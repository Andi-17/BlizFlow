<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Str;

class SmartSearchService
{
    public function search(string $rawQuery, int $limit = 8): array
    {
        $query = trim(preg_replace('/\s+/u', ' ', $rawQuery) ?? '');
        if ($query === '' || mb_strlen($query) < 2) {
            return [
                'query' => $query,
                'intent' => 'none',
                'terms' => '',
                'results' => [],
            ];
        }

        $intent = $this->detectIntent($query);
        $terms = $this->extractTerms($query, $intent);
        $qty = $this->extractQuantity($query);

        $results = match ($intent) {
            'invoice' => $this->searchInvoices($terms, $limit, preferLatest: true),
            'order' => $this->searchOrders($terms, $limit, preferLatest: true),
            'stock', 'add_stock' => $this->searchProducts($terms, $limit, $intent === 'add_stock' ? $qty : null),
            'customer' => $this->searchCustomers($terms, $limit),
            default => $this->searchAll($terms, $limit),
        };

        return [
            'query' => $query,
            'intent' => $intent,
            'terms' => $terms,
            'quantity' => $qty,
            'results' => $results,
        ];
    }

    protected function detectIntent(string $query): string
    {
        $normalized = Str::lower($query);

        if (preg_match('/\b(shto|shtoj|add|rrit|increase)\b/u', $normalized)) {
            return 'add_stock';
        }
        if (preg_match('/\b(stok|stock|inventar|inventory|sa\s+kemi|how\s+many)\b/u', $normalized)) {
            return 'stock';
        }
        if (preg_match('/\b(fatur|invoice|bill)\b/u', $normalized)) {
            return 'invoice';
        }
        if (preg_match('/\b(porosi|order)\b/u', $normalized)) {
            return 'order';
        }
        if (preg_match('/\b(gjej|gjeje|find|hap|open|klient|customer|client)\b/u', $normalized)) {
            return 'customer';
        }

        return 'all';
    }

    protected function extractTerms(string $query, string $intent): string
    {
        $stop = [
            'gjej', 'gjeje', 'find', 'hap', 'open', 'ma', 'me', 'e', 'te', 'të', 'i', 'a', 'the',
            'sa', 'kemi', 'për', 'per', 'for', 'how', 'many', 'stok', 'stock', 'inventar', 'inventory',
            'faturën', 'faturen', 'fatura', 'faturë', 'invoice', 'fundit', 'fund', 'latest', 'last',
            'porosinë', 'porosine', 'porosi', 'order', 'shto', 'shtoj', 'add', 'copë', 'cope', 'pcs',
            'piece', 'pieces', 'of', 'në', 'ne', 'nga', 'to', 'klientin', 'klient', 'customer',
        ];

        // Remove stopwords but keep meaningful tokens (names, SKUs, product words)
        $tokens = preg_split('/\s+/u', Str::lower($query)) ?: [];
        $kept = [];
        foreach ($tokens as $token) {
            $clean = trim($token, " \t\n\r\0\x0B.,;:!?\"'");
            if ($clean === '' || is_numeric($clean)) {
                continue;
            }
            if (in_array($clean, $stop, true)) {
                continue;
            }
            // Strip possessive Albanian -it/-in endings lightly for search
            $stem = preg_replace('/(it|in|në|ne)$/u', '', $clean) ?: $clean;
            if (mb_strlen($stem) >= 2) {
                $kept[] = $stem;
            } elseif (mb_strlen($clean) >= 2) {
                $kept[] = $clean;
            }
        }

        $terms = trim(implode(' ', array_unique($kept)));

        return $terms !== '' ? $terms : $query;
    }

    protected function extractQuantity(string $query): ?int
    {
        if (preg_match('/\b(\d+)\s*(cop[eë]?|pcs?|x)?\b/ui', $query, $match)) {
            $qty = (int) $match[1];

            return $qty > 0 ? $qty : null;
        }

        return null;
    }

    protected function searchAll(string $terms, int $limit): array
    {
        $per = max(2, (int) ceil($limit / 4));

        return array_values(array_slice(array_merge(
            $this->searchCustomers($terms, $per),
            $this->searchProducts($terms, $per),
            $this->searchOrders($terms, $per),
            $this->searchInvoices($terms, $per),
        ), 0, $limit));
    }

    protected function searchCustomers(string $terms, int $limit): array
    {
        return Customer::query()
            ->where(function ($query) use ($terms) {
                $query->where('name', 'like', "%{$terms}%")
                    ->orWhere('email', 'like', "%{$terms}%")
                    ->orWhere('company_name', 'like', "%{$terms}%")
                    ->orWhere('phone', 'like', "%{$terms}%");
                foreach (preg_split('/\s+/u', $terms) ?: [] as $part) {
                    if (mb_strlen($part) < 2) {
                        continue;
                    }
                    $query->orWhere('name', 'like', "%{$part}%");
                }
            })
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(fn (Customer $customer) => [
                'type' => 'customer',
                'id' => $customer->id,
                'title' => $customer->name,
                'subtitle' => collect([$customer->email, $customer->phone])->filter()->implode(' · ') ?: null,
                'href' => '/app/customers/'.$customer->id,
                'meta' => null,
            ])
            ->all();
    }

    protected function searchProducts(string $terms, int $limit, ?int $addQty = null): array
    {
        return Product::query()
            ->where(function ($query) use ($terms) {
                $query->where('name', 'like', "%{$terms}%")
                    ->orWhere('sku', 'like', "%{$terms}%")
                    ->orWhere('description', 'like', "%{$terms}%");
                foreach (preg_split('/\s+/u', $terms) ?: [] as $part) {
                    if (mb_strlen($part) < 2) {
                        continue;
                    }
                    $query->orWhere('name', 'like', "%{$part}%")
                        ->orWhere('sku', 'like', "%{$part}%");
                }
            })
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(function (Product $product) use ($addQty) {
                $href = '/app/inventory';
                if ($addQty) {
                    $href .= '?product='.$product->id.'&add='.$addQty;
                } else {
                    $href .= '?q='.urlencode($product->name);
                }

                return [
                    'type' => 'product',
                    'id' => $product->id,
                    'title' => $product->name,
                    'subtitle' => trim(($product->sku ? 'SKU '.$product->sku.' · ' : '').'Stok: '.(int) $product->stock_quantity),
                    'href' => $href,
                    'meta' => [
                        'stock_quantity' => (int) $product->stock_quantity,
                        'add_quantity' => $addQty,
                    ],
                ];
            })
            ->all();
    }

    protected function searchOrders(string $terms, int $limit, bool $preferLatest = false): array
    {
        $query = Order::query()
            ->with('customer:id,name')
            ->where(function ($inner) use ($terms) {
                $inner->where('order_number', 'like', "%{$terms}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($terms) {
                        $customerQuery->where('name', 'like', "%{$terms}%")
                            ->orWhere('email', 'like', "%{$terms}%");
                        foreach (preg_split('/\s+/u', $terms) ?: [] as $part) {
                            if (mb_strlen($part) >= 2) {
                                $customerQuery->orWhere('name', 'like', "%{$part}%");
                            }
                        }
                    });
            })
            ->latest()
            ->limit($limit);

        return $query->get()->map(fn (Order $order) => [
            'type' => 'order',
            'id' => $order->id,
            'title' => $order->order_number ?: ('Order #'.$order->id),
            'subtitle' => collect([
                $order->customer?->name,
                $order->status,
                '€'.number_format((float) $order->total, 2),
            ])->filter()->implode(' · '),
            'href' => '/app/orders/'.$order->id,
            'meta' => $preferLatest ? ['prefer_latest' => true] : null,
        ])->all();
    }

    protected function searchInvoices(string $terms, int $limit, bool $preferLatest = false): array
    {
        $query = Invoice::query()
            ->with('customer:id,name')
            ->where(function ($inner) use ($terms) {
                $inner->where('invoice_number', 'like', "%{$terms}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($terms) {
                        $customerQuery->where('name', 'like', "%{$terms}%")
                            ->orWhere('email', 'like', "%{$terms}%");
                        foreach (preg_split('/\s+/u', $terms) ?: [] as $part) {
                            if (mb_strlen($part) >= 2) {
                                $customerQuery->orWhere('name', 'like', "%{$part}%");
                            }
                        }
                    });
            })
            ->latest('issue_date')
            ->latest('id')
            ->limit($limit);

        return $query->get()->map(fn (Invoice $invoice) => [
            'type' => 'invoice',
            'id' => $invoice->id,
            'title' => $invoice->invoice_number ?: ('Invoice #'.$invoice->id),
            'subtitle' => collect([
                $invoice->customer?->name,
                $invoice->status,
                '€'.number_format((float) $invoice->total, 2),
            ])->filter()->implode(' · '),
            'href' => '/app/invoices/'.$invoice->id,
            'meta' => $preferLatest ? ['prefer_latest' => true] : null,
        ])->all();
    }
}
