<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Invoice\StoreInvoiceRequest;
use App\Http\Requests\Api\Invoice\UpdateInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Order;
use App\Services\InvoicePdfService;
use App\Services\InvoiceService;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Invoice::class);

        $invoices = Invoice::query()
            ->with(['customer', 'items'])
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->success(InvoiceResource::collection($invoices)->response()->getData(true));
    }

    public function store(StoreInvoiceRequest $request, InvoiceService $invoiceService)
    {
        Gate::authorize('create', Invoice::class);

        $invoice = $invoiceService->create($request->validated());

        return $this->created(new InvoiceResource($invoice));
    }

    public function fromOrder(Order $order, InvoiceService $invoiceService)
    {
        Gate::authorize('create', Invoice::class);
        Gate::authorize('view', $order);

        $invoice = $invoiceService->createFromOrder($order->load('items'));

        return $this->created(new InvoiceResource($invoice));
    }

    public function show(Invoice $invoice)
    {
        Gate::authorize('view', $invoice);

        return $this->success(new InvoiceResource($invoice->load(['customer', 'items'])));
    }

    public function downloadPdf(Invoice $invoice, InvoicePdfService $invoicePdfService, TenantContext $tenantContext)
    {
        Gate::authorize('view', $invoice);

        $company = $tenantContext->company();
        if (! $company) {
            return $this->error('Company context required.', 400);
        }

        return $invoicePdfService->download($invoice, $company);
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice, InvoiceService $invoiceService)
    {
        Gate::authorize('update', $invoice);

        $invoice = $invoiceService->update($invoice, $request->validated());

        return $this->success(new InvoiceResource($invoice), 'Invoice updated');
    }

    public function markPaid(Invoice $invoice, InvoiceService $invoiceService)
    {
        Gate::authorize('update', $invoice);

        $invoice = $invoiceService->markPaid($invoice);

        return $this->success(new InvoiceResource($invoice), 'Invoice marked paid');
    }

    public function destroy(Invoice $invoice)
    {
        Gate::authorize('delete', $invoice);

        $invoice->delete();

        return $this->success(null, 'Invoice deleted');
    }
}
