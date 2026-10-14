<?php

namespace App\Services;

use App\Models\ContactMessage;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Order;
use Illuminate\Support\Carbon;

class CustomerTimelineService
{
    public function forCustomer(Customer $customer, int $limit = 50): array
    {
        $events = collect();

        Order::query()
            ->where('customer_id', $customer->id)
            ->latest()
            ->limit($limit)
            ->get()
            ->each(function (Order $order) use ($events) {
                $events->push([
                    'type' => 'order',
                    'at' => optional($order->created_at)->toIso8601String(),
                    'date' => optional($order->created_at)->toDateString(),
                    'title' => 'Porosi '.($order->order_number ?: '#'.$order->id),
                    'amount' => (float) $order->total,
                    'status' => $order->status,
                    'href' => '/app/orders/'.$order->id,
                ]);
            });

        Invoice::query()
            ->where('customer_id', $customer->id)
            ->latest('issue_date')
            ->latest('id')
            ->limit($limit)
            ->get()
            ->each(function (Invoice $invoice) use ($events) {
                $events->push([
                    'type' => 'invoice',
                    'at' => optional($invoice->issue_date?->startOfDay() ?? $invoice->created_at)->toIso8601String(),
                    'date' => optional($invoice->issue_date ?? $invoice->created_at)->toDateString(),
                    'title' => 'Faturë '.($invoice->invoice_number ?: '#'.$invoice->id),
                    'amount' => (float) $invoice->total,
                    'status' => $invoice->status,
                    'href' => '/app/invoices/'.$invoice->id,
                ]);

                if ($invoice->paid_at) {
                    $events->push([
                        'type' => 'payment',
                        'at' => optional($invoice->paid_at)->toIso8601String(),
                        'date' => optional($invoice->paid_at)->toDateString(),
                        'title' => 'Pagesë '.($invoice->invoice_number ?: '#'.$invoice->id),
                        'amount' => (float) $invoice->total,
                        'status' => 'paid',
                        'href' => '/app/invoices/'.$invoice->id,
                    ]);
                }
            });

        $contactQuery = ContactMessage::query()->latest()->limit($limit);
        if (filled($customer->email)) {
            $contactQuery->where(function ($query) use ($customer) {
                $query->where('email', $customer->email)
                    ->orWhere('name', 'like', '%'.$customer->name.'%');
            });
        } else {
            $contactQuery->where('name', 'like', '%'.$customer->name.'%');
        }

        $contactQuery->get()->each(function (ContactMessage $message) use ($events) {
            $events->push([
                'type' => 'contact',
                'at' => optional($message->created_at)->toIso8601String(),
                'date' => optional($message->created_at)->toDateString(),
                'title' => 'Kontakt'.($message->subject ? ': '.$message->subject : ' nga website'),
                'amount' => null,
                'status' => $message->status,
                'href' => '/app/contacts',
            ]);
        });

        if ($customer->created_at) {
            $events->push([
                'type' => 'customer_created',
                'at' => $customer->created_at->toIso8601String(),
                'date' => $customer->created_at->toDateString(),
                'title' => 'Klienti u krijua',
                'amount' => null,
                'status' => null,
                'href' => null,
            ]);
        }

        return $events
            ->filter(fn ($event) => filled($event['at'] ?? null))
            ->sortByDesc(fn ($event) => Carbon::parse($event['at'])->timestamp)
            ->values()
            ->take($limit)
            ->all();
    }
}
