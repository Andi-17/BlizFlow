<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Services\OrderService;
use App\Services\TenantContext;
use Tests\TestCase;

class OrderCalculationTest extends TestCase
{
    public function test_order_service_calculates_totals_server_side(): void
    {
        ['user' => $user, 'company' => $company] = $this->createCompanyWithOwner();
        app(TenantContext::class)->setCompany($company);

        $customer = Customer::query()->create([
            'company_id' => $company->id,
            'name' => 'Buyer',
        ]);

        $product = Product::query()->create([
            'company_id' => $company->id,
            'name' => 'Widget',
            'sku' => 'W-1',
            'price' => 10.00,
            'cost' => 4.00,
            'stock_quantity' => 100,
            'min_stock_level' => 5,
        ]);

        $order = app(OrderService::class)->create([
            'customer_id' => $customer->id,
            'discount' => 5,
            'tax' => 2.50,
            // Malicious frontend totals must be ignored
            'subtotal' => 1,
            'total' => 1,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 3,
                    'unit_price' => 10.00,
                ],
                [
                    'name' => 'Service',
                    'quantity' => 1,
                    'unit_price' => 20.00,
                ],
            ],
        ]);

        $this->assertSame('50.00', $order->subtotal);
        $this->assertSame('5.00', $order->discount);
        $this->assertSame('2.50', $order->tax);
        $this->assertSame('47.50', $order->total);
        $this->assertCount(2, $order->items);
        $this->assertSame(97, $product->fresh()->stock_quantity);
    }

    public function test_order_api_ignores_client_totals(): void
    {
        ['user' => $user, 'company' => $company] = $this->createCompanyWithOwner();

        $customer = Customer::query()->create([
            'company_id' => $company->id,
            'name' => 'Buyer',
        ]);

        $product = Product::query()->create([
            'company_id' => $company->id,
            'name' => 'Widget',
            'sku' => 'W-2',
            'price' => 25.00,
            'stock_quantity' => 10,
        ]);

        $response = $this->actingAsCompanyMember($user, $company)
            ->postJson('/api/v1/orders', [
                'customer_id' => $customer->id,
                'discount' => 0,
                'tax' => 0,
                'subtotal' => 1,
                'total' => 1,
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 2,
                    ],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.subtotal', '50.00')
            ->assertJsonPath('data.total', '50.00');
    }
}
