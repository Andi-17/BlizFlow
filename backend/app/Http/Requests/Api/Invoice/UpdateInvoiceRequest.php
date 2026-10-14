<?php

namespace App\Http\Requests\Api\Invoice;

use App\Support\CompanyRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['sometimes', 'required', 'integer', CompanyRules::existsInCompany('customers')],
            'order_id' => ['nullable', 'integer', CompanyRules::existsInCompany('orders')],
            // "paid" / paid_at only via mark-paid
            'status' => ['nullable', 'in:draft,sent,overdue,cancelled'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer', CompanyRules::existsInCompany('products')],
            'items.*.description' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
