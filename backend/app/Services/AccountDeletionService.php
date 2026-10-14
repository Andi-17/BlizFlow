<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanyUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AccountDeletionService
{
    public function deleteCompany(Company $company): void
    {
        DB::transaction(function () use ($company) {
            if ($company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
            }

            // Hard-delete so FK cascades wipe related business data.
            $company->forceDelete();
        });
    }

    public function deleteAccount(User $user): void
    {
        DB::transaction(function () use ($user) {
            $ownedCompanyIds = CompanyUser::query()
                ->where('user_id', $user->id)
                ->where('is_owner', true)
                ->pluck('company_id');

            foreach ($ownedCompanyIds as $companyId) {
                $company = Company::query()->withTrashed()->find($companyId);
                if ($company) {
                    if ($company->logo_path) {
                        Storage::disk('public')->delete($company->logo_path);
                    }
                    $company->forceDelete();
                }
            }

            CompanyUser::query()->where('user_id', $user->id)->delete();

            $user->tokens()->delete();
            $user->forceDelete();
        });
    }
}
