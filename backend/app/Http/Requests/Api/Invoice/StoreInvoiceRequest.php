<?php

namespace App\Http\Requests\Api\Invoice;

use App\Support\CompanyRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', CompanyRules::existsInCompany('customers')],
            'order_id' => ['nullable', 'integer', CompanyRules::existsInCompany('orders')],
            // "paid" is only allowed via mark-paid endpoint
            'status' => ['nullable', 'in:draft,sent,overdue,cancelled'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer', CompanyRules::existsInCompany('products')],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
