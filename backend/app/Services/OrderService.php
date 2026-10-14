<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(protected ActivityLogger $activityLogger)
    {
    }

    public function create(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $items = $data['items'] ?? [];
            unset($data['items'], $data['subtotal'], $data['total']);

            $totals = $this->calculateTotals($items, (float) ($data['discount'] ?? 0), (float) ($data['tax'] ?? 0));

            $order = Order::query()->create([
                ...$data,
                'order_number' => $data['order_number'] ?? $this->generateOrderNumber(),
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'ordered_at' => $data['ordered_at'] ?? now(),
                'status' => $data['status'] ?? 'pending',
            ]);

            foreach ($totals['lines'] as $line) {
                OrderItem::query()->create([
                    'order_id' => $order->id,
                    ...$line,
                ]);

                if (! empty($line['product_id']) && ($data['decrement_stock'] ?? true)) {
                    $this->decrementStock((int) $line['product_id'], (int) $line['quantity']);
                }
            }

            $this->activityLogger->log('order.created', $order, [
                'order_number' => $order->order_number,
                'total' => $order->total,
            ]);

            return $order->load(['items', 'customer']);
        });
    }

    public function update(Order $order, array $data): Order
    {
        return DB::transaction(function () use ($order, $data) {
            if (isset($data['items'])) {
                foreach ($order->items as $existingItem) {
                    if ($existingItem->product_id) {
                        Product::query()->whereKey($existingItem->product_id)
                            ->increment('stock_quantity', $existingItem->quantity);
                    }
                }

                $order->items()->delete();

                $totals = $this->calculateTotals(
                    $data['items'],
                    (float) ($data['discount'] ?? $order->discount),
                    (float) ($data['tax'] ?? $order->tax),
                );

                foreach ($totals['lines'] as $line) {
                    OrderItem::query()->create([
                        'order_id' => $order->id,
                        ...$line,
                    ]);

                    if (! empty($line['product_id'])) {
                        $this->decrementStock((int) $line['product_id'], (int) $line['quantity']);
                    }
                }

                $data['subtotal'] = $totals['subtotal'];
                $data['discount'] = $totals['discount'];
                $data['tax'] = $totals['tax'];
                $data['total'] = $totals['total'];
                unset($data['items']);
            } else {
                unset($data['subtotal'], $data['total']);
            }

            $order->update($data);

            $this->activityLogger->log('order.updated', $order);

            return $order->fresh(['items', 'customer']);
        });
    }

    public function calculateTotals(array $items, float $discount = 0, float $tax = 0): array
    {
        $lines = [];
        $subtotal = 0.0;

        foreach ($items as $item) {
            $product = null;
            if (! empty($item['product_id'])) {
                $product = Product::query()->findOrFail($item['product_id']);
            }

            $quantity = (int) ($item['quantity'] ?? 1);
            $unitPrice = isset($item['unit_price'])
                ? (float) $item['unit_price']
                : (float) ($product?->price ?? 0);
            $lineTotal = round($quantity * $unitPrice, 2);
            $subtotal += $lineTotal;

            $lines[] = [
                'product_id' => $product?->id,
                'name' => $item['name'] ?? $product?->name ?? 'Item',
                'sku' => $item['sku'] ?? $product?->sku,
                'quantity' => $quantity,
                'unit_price' => number_format($unitPrice, 2, '.', ''),
                'line_total' => number_format($lineTotal, 2, '.', ''),
            ];
        }

        $discount = max(0, round($discount, 2));
        $tax = max(0, round($tax, 2));
        $total = max(0, round($subtotal - $discount + $tax, 2));

        return [
            'lines' => $lines,
            'subtotal' => number_format($subtotal, 2, '.', ''),
            'discount' => number_format($discount, 2, '.', ''),
            'tax' => number_format($tax, 2, '.', ''),
            'total' => number_format($total, 2, '.', ''),
        ];
    }

    protected function decrementStock(int $productId, int $quantity): void
    {
        $product = Product::query()->lockForUpdate()->findOrFail($productId);

        if ($product->stock_quantity < $quantity) {
            throw ValidationException::withMessages([
                'items' => "Insufficient stock for product {$product->sku}.",
            ]);
        }

        $product->decrement('stock_quantity', $quantity);
    }

    protected function generateOrderNumber(): string
    {
        $companyId = app(TenantContext::class)->companyId() ?? 0;
        $sequence = Order::query()->withoutGlobalScopes()->where('company_id', $companyId)->count() + 1;

        return sprintf('ORD-%d-%05d', $companyId, $sequence);
    }
}
