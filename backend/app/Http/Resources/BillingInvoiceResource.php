<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillingInvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'company' => $this->whenLoaded('company', fn () => $this->company?->only(['id', 'name'])),
            'number' => $this->number,
            'amount_due' => $this->amount_due,
            'amount_paid' => $this->amount_paid,
            'currency' => $this->currency,
            'status' => $this->status,
            'hosted_invoice_url' => $this->hosted_invoice_url,
            'invoice_pdf' => $this->invoice_pdf,
            'period_start' => $this->period_start,
            'period_end' => $this->period_end,
            'paid_at' => $this->paid_at,
            'created_at' => $this->created_at,
        ];
    }
}