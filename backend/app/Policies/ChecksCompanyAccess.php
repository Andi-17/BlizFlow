<?php

namespace App\Policies;

use App\Models\User;
use App\Services\TenantContext;

trait ChecksCompanyAccess
{
    protected function sameCompany(User $user, $model): bool
    {
        if ($user->is_platform_admin) {
            return true;
        }

        $companyId = $model->company_id ?? null;
        $contextId = app(TenantContext::class)->companyId();

        if (! $companyId || ! $contextId || (int) $companyId !== (int) $contextId) {
            return false;
        }

        return $user->isMemberOf($companyId);
    }

    protected function canManage(User $user): bool
    {
        if ($user->is_platform_admin) {
            return true;
        }

        $company = app(TenantContext::class)->company();
        if (! $company) {
            return false;
        }

        $membership = $user->membershipFor($company);

        return $membership && $membership->status === 'active';
    }

    protected function allows(User $user, string $permission): bool
    {
        if (! $this->canManage($user)) {
            return false;
        }

        return $user->hasPermission($permission);
    }

    protected function allowsAny(User $user, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->allows($user, $permission)) {
                return true;
            }
        }

        return false;
    }
}
