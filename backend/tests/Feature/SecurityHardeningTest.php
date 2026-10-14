<?php

namespace Tests\Feature;

use App\Models\CompanyUser;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    protected function createWorker(User $owner, $company): User
    {
        $worker = User::factory()->create(['email' => 'worker-'.uniqid().'@example.com']);
        $role = Role::query()->whereNull('company_id')->where('slug', 'employee')->first();

        CompanyUser::query()->create([
            'company_id' => $company->id,
            'user_id' => $worker->id,
            'role_id' => $role?->id,
            'is_owner' => false,
            'status' => 'active',
        ]);

        return $worker;
    }

    public function test_company_a_cannot_access_company_b_invoice(): void
    {
        ['user' => $userA, 'company' => $companyA] = $this->createCompanyWithOwner(['email' => 'ownera@example.com']);
        ['user' => $userB, 'company' => $companyB] = $this->createCompanyWithOwner(['email' => 'ownerb@example.com']);

        $customerB = Customer::query()->create([
            'company_id' => $companyB->id,
            'name' => 'B Customer',
            'email' => 'bcust@example.com',
        ]);

        $invoiceB = Invoice::query()->create([
            'company_id' => $companyB->id,
            'customer_id' => $customerB->id,
            'invoice_number' => 'INV-B-1',
            'status' => 'draft',
            'subtotal' => 100,
            'discount' => 0,
            'tax' => 0,
            'total' => 100,
            'issue_date' => now()->toDateString(),
        ]);

        $this->actingAsCompanyMember($userA, $companyA)
            ->getJson('/api/v1/invoices/'.$invoiceB->id)
            ->assertNotFound();
    }

    public function test_worker_cannot_update_invoice(): void
    {
        ['user' => $owner, 'company' => $company] = $this->createCompanyWithOwner();
        $worker = $this->createWorker($owner, $company);

        $customer = Customer::query()->create([
            'company_id' => $company->id,
            'name' => 'Client',
            'email' => 'client@example.com',
        ]);

        $invoice = Invoice::query()->create([
            'company_id' => $company->id,
            'customer_id' => $customer->id,
            'invoice_number' => 'INV-1',
            'status' => 'draft',
            'subtotal' => 50,
            'discount' => 0,
            'tax' => 0,
            'total' => 50,
            'issue_date' => now()->toDateString(),
        ]);

        $this->actingAsCompanyMember($worker, $company)
            ->putJson('/api/v1/invoices/'.$invoice->id, ['notes' => 'hacked'])
            ->assertForbidden();
    }

    public function test_cannot_mark_invoice_paid_via_update(): void
    {
        ['user' => $owner, 'company' => $company] = $this->createCompanyWithOwner();

        $customer = Customer::query()->create([
            'company_id' => $company->id,
            'name' => 'Client',
            'email' => 'client2@example.com',
        ]);

        $invoice = Invoice::query()->create([
            'company_id' => $company->id,
            'customer_id' => $customer->id,
            'invoice_number' => 'INV-2',
            'status' => 'draft',
            'subtotal' => 50,
            'discount' => 0,
            'tax' => 0,
            'total' => 50,
            'issue_date' => now()->toDateString(),
        ]);

        $this->actingAsCompanyMember($owner, $company)
            ->putJson('/api/v1/invoices/'.$invoice->id, ['status' => 'paid'])
            ->assertStatus(422);

        $this->assertSame('draft', $invoice->fresh()->status);
    }

    public function test_cannot_attach_cross_tenant_customer_to_invoice(): void
    {
        ['user' => $userA, 'company' => $companyA] = $this->createCompanyWithOwner(['email' => 'a2@example.com']);
        ['company' => $companyB] = $this->createCompanyWithOwner(['email' => 'b2@example.com']);

        $customerB = Customer::query()->create([
            'company_id' => $companyB->id,
            'name' => 'Foreign',
            'email' => 'foreign@example.com',
        ]);

        $this->actingAsCompanyMember($userA, $companyA)
            ->postJson('/api/v1/invoices', [
                'customer_id' => $customerB->id,
                'items' => [
                    ['description' => 'Work', 'quantity' => 1, 'unit_price' => 10],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id']);
    }

    public function test_worker_cannot_update_employee_role(): void
    {
        ['user' => $owner, 'company' => $company] = $this->createCompanyWithOwner();
        $worker = $this->createWorker($owner, $company);
        $adminRole = Role::query()->whereNull('company_id')->where('slug', 'admin')->first();

        $membership = CompanyUser::query()
            ->where('company_id', $company->id)
            ->where('user_id', $worker->id)
            ->first();

        $this->actingAsCompanyMember($worker, $company)
            ->putJson('/api/v1/employees/'.$membership->id, [
                'role_id' => $adminRole->id,
            ])
            ->assertForbidden();
    }

    public function test_company_id_spoof_on_product_create_is_ignored(): void
    {
        ['user' => $userA, 'company' => $companyA] = $this->createCompanyWithOwner(['email' => 'a3@example.com']);
        ['company' => $companyB] = $this->createCompanyWithOwner(['email' => 'b3@example.com']);

        $response = $this->actingAsCompanyMember($userA, $companyA)
            ->postJson('/api/v1/products', [
                'name' => 'Oil',
                'sku' => 'OIL-1',
                'price' => 12,
                'company_id' => $companyB->id,
            ])
            ->assertCreated();

        $product = Product::query()->findOrFail($response->json('data.id'));
        $this->assertSame((int) $companyA->id, (int) $product->company_id);
    }
}
