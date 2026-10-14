<?php

namespace App\Traits;

use App\Models\Company;
use App\Models\Scopes\CompanyScope;
use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToCompany
{
    public static function bootBelongsToCompany(): void
    {
        static::addGlobalScope(new CompanyScope);

        static::creating(function ($model) {
            $companyId = app(TenantContext::class)->companyId();
            // When tenant context is active, always bind the record to that company
            // (ignore any client-supplied company_id).
            if ($companyId) {
                $model->company_id = $companyId;
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
