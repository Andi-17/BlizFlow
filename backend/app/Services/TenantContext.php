<?php

namespace App\Services;

use App\Models\Company;

class TenantContext
{
    protected ?Company $company = null;

    protected bool $bypassCompanyScope = false;

    public function setCompany(?Company $company): void
    {
        if ($company) {
            app(\App\Services\Billing\PlanEntitlementService::class)
                ->expireComplimentaryTrialIfNeeded($company);
            $company->unsetRelation('subscription');
            $company->unsetRelation('settings');
            $company->load(['subscription.plan', 'settings']);
        }

        $this->company = $company;
    }

    public function bypassCompanyScope(bool $bypass = true): void
    {
        $this->bypassCompanyScope = $bypass;
    }

    public function shouldBypassCompanyScope(): bool
    {
        return $this->bypassCompanyScope;
    }

    public function company(): ?Company
    {
        return $this->company;
    }

    public function companyId(): ?int
    {
        return $this->company?->id;
    }

    public function clear(): void
    {
        $this->company = null;
    }

    public function hasCompany(): bool
    {
        return $this->company !== null;
    }
}
