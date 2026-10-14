<?php

namespace App\Traits;

use App\Models\Scopes\CompanyScope;
use App\Services\TenantContext;

trait HasCompanyScope
{
    public static function bootHasCompanyScope(): void
    {
        static::addGlobalScope(new CompanyScope);
    }

    public function scopeForCompany($query, ?int $companyId = null)
    {
        $companyId = $companyId ?? app(TenantContext::class)->companyId();

        if ($companyId) {
            return $query->where($this->getTable().'.company_id', $companyId);
        }

        return $query;
    }

    public function scopeWithoutCompanyScope($query)
    {
        return $query->withoutGlobalScope(CompanyScope::class);
    }
}
