<?php

namespace App\Support;

use App\Services\TenantContext;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class CompanyRules
{
    public static function existsInCompany(string $table, string $column = 'id'): Exists
    {
        $companyId = app(TenantContext::class)->companyId();

        $rule = Rule::exists($table, $column);

        if ($companyId) {
            $rule->where('company_id', $companyId);
        } else {
            // Deny all until tenant context exists.
            $rule->whereRaw('1 = 0');
        }

        return $rule;
    }

    public static function companyId(): ?int
    {
        return app(TenantContext::class)->companyId();
    }
}
