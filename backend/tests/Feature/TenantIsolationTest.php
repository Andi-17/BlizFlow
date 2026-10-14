<?php

namespace Tests\Feature;

use App\Models\Customer;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    public function test_company_a_cannot_access_company_b_customers(): void
    {
        ['user' => $userA, 'company' => $companyA] = $this->createCompanyWithOwner(['email' => 'a@example.com']);
        ['user' => $userB, 'company' => $companyB] = $this->createCompanyWithOwner(['email' => 'b@example.com']);

        $customerB = Customer::query()->create([
            'company_id' => $companyB->id,
            'name' => 'Secret Customer',
            'email' => 'secret@example.com',
        ]);

        $this->actingAsCompanyMember($userA, $companyA)
            ->getJson('/api/v1/customers/'.$customerB->id)
            ->assertNotFound();

        $this->actingAsCompanyMember($userA, $companyA)
            ->getJson('/api/v1/customers')
            ->assertOk()
            ->assertJsonMissing(['email' => 'secret@example.com']);

        $this->actingAsCompanyMember($userB, $companyB)
            ->getJson('/api/v1/customers/'.$customerB->id)
            ->assertOk()
            ->assertJsonPath('data.email', 'secret@example.com');
    }
}
