<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class AdminPaymentController extends Controller
{
    public function index(Request $request)
    {
        $payments = Payment::query()
            ->withoutGlobalScopes()
            ->with('company:id,name')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->latest()
            ->paginate((int) $request->integer('per_page', 20));

        $payload = $payments->toArray();
        $payload['data'] = $payments->getCollection()->map(fn (Payment $payment) => [
            'id' => $payment->id,
            'company_id' => $payment->company_id,
            'company' => $payment->company?->only(['id', 'name']),
            'subscription_id' => $payment->subscription_id,
            'stripe_payment_intent_id' => $payment->stripe_payment_intent_id,
            'stripe_invoice_id' => $payment->stripe_invoice_id,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'status' => $payment->status,
            'paid_at' => $payment->paid_at,
            'created_at' => $payment->created_at,
        ])->values()->all();

        return $this->success($payload);
    }
}
