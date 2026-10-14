<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public function __construct(protected ActivityLogger $activityLogger)
    {
    }

    public function create(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
            $items = $data['items'] ?? [];
            unset($data['items'], $data['subtotal'], $data['total'], $data['company_id'], $data['paid_at']);

            $totals = $this->calculateTotals($items, (float) ($data['discount'] ?? 0), (float) ($data['tax'] ?? 0));

            $status = $data['status'] ?? 'draft';
            if ($status === 'paid') {
                $status = 'draft';
            }

            $invoice = Invoice::query()->create([
                ...$data,
                'invoice_number' => $data['invoice_number'] ?? $this->generateInvoiceNumber(),
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'status' => $status,
                'issue_date' => $data['issue_date'] ?? now()->toDateString(),
            ]);

            foreach ($totals['lines'] as $line) {
                InvoiceItem::query()->create([
                    'invoice_id' => $invoice->id,
                    ...$line,
                ]);
            }

            $this->activityLogger->log('invoice.created', $invoice, [
                'invoice_number' => $invoice->invoice_number,
                'total' => $invoice->total,
            ]);

            return $invoice->load(['items', 'customer']);
        });
    }

    public function createFromOrder(Order $order, array $overrides = []): Invoice
    {
        $items = $order->items->map(fn ($item) => [
            'product_id' => $item->product_id,
            'description' => $item->name,
            'quantity' => $item->quantity,
            'unit_price' => $item->unit_price,
        ])->all();

        return $this->create([
            'customer_id' => $order->customer_id,
            'order_id' => $order->id,
            'discount' => $order->discount,
            'tax' => $order->tax,
            'notes' => $order->notes,
            'items' => $items,
            ...$overrides,
        ]);
    }

    public function update(Invoice $invoice, array $data): Invoice
    {
        return DB::transaction(function () use ($invoice, $data) {
            unset($data['paid_at'], $data['subtotal'], $data['total'], $data['company_id']);

            if (($data['status'] ?? null) === 'paid') {
                unset($data['status']);
            }

            if (isset($data['items'])) {
                $invoice->items()->delete();

                $totals = $this->calculateTotals(
                    $data['items'],
                    (float) ($data['discount'] ?? $invoice->discount),
                    (float) ($data['tax'] ?? $invoice->tax),
                );

                foreach ($totals['lines'] as $line) {
                    InvoiceItem::query()->create([
                        'invoice_id' => $invoice->id,
                        ...$line,
                    ]);
                }

                $data['subtotal'] = $totals['subtotal'];
                $data['discount'] = $totals['discount'];
                $data['tax'] = $totals['tax'];
                $data['total'] = $totals['total'];
                unset($data['items']);
            } elseif (array_key_exists('discount', $data) || array_key_exists('tax', $data)) {
                $invoice->loadMissing('items');
                $lines = $invoice->items->map(fn (InvoiceItem $item) => [
                    'product_id' => $item->product_id,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                ])->all();

                $totals = $this->calculateTotals(
                    $lines,
                    (float) ($data['discount'] ?? $invoice->discount),
                    (float) ($data['tax'] ?? $invoice->tax),
                );

                $data['subtotal'] = $totals['subtotal'];
                $data['discount'] = $totals['discount'];
                $data['tax'] = $totals['tax'];
                $data['total'] = $totals['total'];
            }

            $invoice->update($data);

            $this->activityLogger->log('invoice.updated', $invoice);

            return $invoice->fresh(['items', 'customer']);
        });
    }

    public function markPaid(Invoice $invoice): Invoice
    {
        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $this->activityLogger->log('invoice.paid', $invoice);

        return $invoice->fresh(['items', 'customer']);
    }

    public function calculateTotals(array $items, float $discount = 0, float $tax = 0): array
    {
        $lines = [];
        $subtotal = 0.0;

        foreach ($items as $item) {
            $product = null;
            if (! empty($item['product_id'])) {
                $product = Product::query()->find($item['product_id']);
            }

            $quantity = (int) ($item['quantity'] ?? 1);
            $unitPrice = isset($item['unit_price'])
                ? (float) $item['unit_price']
                : (float) ($product?->price ?? 0);
            $lineTotal = round($quantity * $unitPrice, 2);
            $subtotal += $lineTotal;

            $lines[] = [
                'product_id' => $product?->id ?? ($item['product_id'] ?? null),
                'description' => $item['description'] ?? $product?->name ?? 'Item',
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

    protected function generateInvoiceNumber(): string
    {
        $companyId = app(TenantContext::class)->companyId() ?? 0;
        $sequence = Invoice::query()->withoutGlobalScopes()->where('company_id', $companyId)->count() + 1;

        return sprintf('INV-%d-%05d', $companyId, $sequence);
    }
}
