<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;

class CompanyPolicy
{
    use ChecksCompanyAccess;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Company $company): bool
    {
        return $user->is_platform_admin || $user->isMemberOf($company);
    }

    public function update(User $user, Company $company): bool
    {
        if ($user->is_platform_admin) {
            return true;
        }

        $membership = $user->membershipFor($company);
        if (! $membership || $membership->status !== 'active') {
            return false;
        }

        if ($membership->is_owner) {
            return true;
        }

        return $user->isCompanyAdmin($company) || $user->hasPermission('settings.manage');
    }

    public function delete(User $user, Company $company): bool
    {
        if ($user->is_platform_admin) {
            return true;
        }

        $membership = $user->membershipFor($company);

        return $membership && $membership->is_owner;
    }
}
