<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Services\InvoiceService;
use App\Services\TenantContext;
use Tests\TestCase;

class InvoiceCalculationTest extends TestCase
{
    public function test_invoice_service_calculates_totals_server_side(): void
    {
        ['company' => $company] = $this->createCompanyWithOwner();
        app(TenantContext::class)->setCompany($company);

        $customer = Customer::query()->create([
            'company_id' => $company->id,
            'name' => 'Client',
        ]);

        $product = Product::query()->create([
            'company_id' => $company->id,
            'name' => 'Consulting',
            'sku' => 'C-1',
            'price' => 100.00,
            'stock_quantity' => 0,
        ]);

        $invoice = app(InvoiceService::class)->create([
            'customer_id' => $customer->id,
            'discount' => 10,
            'tax' => 19,
            'subtotal' => 1,
            'total' => 1,
            'items' => [
                [
                    'product_id' => $product->id,
                    'description' => 'Consulting hours',
                    'quantity' => 2,
                    'unit_price' => 100.00,
                ],
            ],
        ]);

        $this->assertSame('200.00', $invoice->subtotal);
        $this->assertSame('10.00', $invoice->discount);
        $this->assertSame('19.00', $invoice->tax);
        $this->assertSame('209.00', $invoice->total);
        $this->assertNotEmpty($invoice->invoice_number);
    }
}
