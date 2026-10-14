<?php

namespace Tests;

use App\Models\Company;
use App\Models\CompanyUser;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            \Database\Seeders\PlanSeeder::class,
            \Database\Seeders\RolePermissionSeeder::class,
        ]);
    }

    protected function createCompanyWithOwner(array $userAttrs = [], array $companyAttrs = []): array
    {
        $user = User::factory()->create($userAttrs);
        $company = Company::factory()->create($companyAttrs);
        $ownerRole = Role::query()->whereNull('company_id')->where('slug', 'owner')->first();

        CompanyUser::query()->create([
            'company_id' => $company->id,
            'user_id' => $user->id,
            'role_id' => $ownerRole?->id,
            'is_owner' => true,
            'status' => 'active',
        ]);

        $plan = Plan::query()->where('slug', 'free')->first();
        Subscription::query()->create([
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'current_period_start' => now(),
        ]);

        return compact('user', 'company');
    }

    protected function actingAsCompanyMember(User $user, Company $company): static
    {
        app(TenantContext::class)->setCompany($company);

        return $this->actingAs($user)->withHeader('X-Company-Id', (string) $company->id);
    }
}
