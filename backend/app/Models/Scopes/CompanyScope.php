<?php

namespace App\Models\Scopes;

use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class CompanyScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(TenantContext::class);

        if ($context->shouldBypassCompanyScope() || (app()->runningInConsole() && ! app()->runningUnitTests())) {
            return;
        }

        $companyId = $context->companyId();
        if ($companyId) {
            $builder->where($model->getTable().'.company_id', $companyId);

            return;
        }

        $builder->whereRaw('1 = 0');
    }
}
