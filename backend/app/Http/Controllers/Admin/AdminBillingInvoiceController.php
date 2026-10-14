<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\BillingInvoiceResource;
use App\Models\BillingInvoice;
use Illuminate\Http\Request;

class AdminBillingInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $invoices = BillingInvoice::query()
            ->withoutGlobalScopes()
            ->with('company:id,name')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->latest()
            ->paginate((int) $request->integer('per_page', 20));

        return $this->success(BillingInvoiceResource::collection($invoices)->response()->getData(true));
    }
}
