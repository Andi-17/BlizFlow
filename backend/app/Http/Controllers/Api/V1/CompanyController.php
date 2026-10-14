<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Company\DeleteCompanyRequest;
use App\Http\Requests\Api\Company\UpdateCompanyRequest;
use App\Http\Requests\Api\Company\UploadCompanyLogoRequest;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Services\AccountDeletionService;
use App\Services\TenantContext;
use App\Support\IndustryCatalog;
use App\Support\InvoiceDisplaySettings;
use App\Support\LandingPageSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $companies = $request->user()->is_platform_admin
            ? Company::query()->with('subscription.plan')->latest()->paginate(20)
            : $request->user()
                ->companies()
                ->wherePivot('status', 'active')
                ->with('subscription.plan')
                ->paginate(20);

        return $this->success(CompanyResource::collection($companies)->response()->getData(true));
    }

    public function show(Company $company)
    {
        Gate::authorize('view', $company);

        return $this->success(new CompanyResource($company->load(['subscription.plan', 'settings'])));
    }

    public function current(TenantContext $tenantContext)
    {
        $company = $tenantContext->company();
        if (! $company) {
            return $this->error('Company context required.', 400);
        }

        Gate::authorize('view', $company);

        return $this->success(new CompanyResource($company->load(['subscription.plan', 'settings'])));
    }

    public function update(UpdateCompanyRequest $request, Company $company)
    {
        Gate::authorize('update', $company);

        $data = $request->safe()->except('settings');
        $company->update($data);

        if ($request->filled('industry')) {
            $industry = IndustryCatalog::get($request->string('industry')->toString());
            CompanySetting::query()->updateOrCreate(
                ['company_id' => $company->id, 'key' => 'industry_labels'],
                ['value' => json_encode($industry['labels'])]
            );
            CompanySetting::query()->updateOrCreate(
                ['company_id' => $company->id, 'key' => 'invoice_prefix'],
                ['value' => $industry['invoice_prefix']]
            );
            CompanySetting::query()->updateOrCreate(
                ['company_id' => $company->id, 'key' => 'order_prefix'],
                ['value' => $industry['order_prefix']]
            );

            $existingInvoiceSettings = CompanySetting::query()
                ->where('company_id', $company->id)
                ->where('key', 'invoice_settings')
                ->value('value');

            if (! filled($existingInvoiceSettings)) {
                CompanySetting::query()->updateOrCreate(
                    ['company_id' => $company->id, 'key' => 'invoice_settings'],
                    ['value' => json_encode(InvoiceDisplaySettings::defaults($industry['slug']))]
                );
            }
        }

        if ($request->filled('settings')) {
            $industrySlug = (string) ($company->fresh()->industry ?: 'general');

            foreach ($request->input('settings') as $key => $value) {
                if ($key === 'invoice_settings') {
                    $value = json_encode(InvoiceDisplaySettings::normalize($value, $industrySlug));
                } elseif ($key === 'landing_page') {
                    $value = json_encode(LandingPageSettings::normalize($value, $industrySlug));
                } elseif (is_array($value)) {
                    $value = json_encode($value);
                } elseif ($value === null) {
                    $value = null;
                } else {
                    $value = (string) $value;
                }

                CompanySetting::query()->updateOrCreate(
                    ['company_id' => $company->id, 'key' => $key],
                    ['value' => $value]
                );
            }
        }

        return $this->success(new CompanyResource($company->fresh(['subscription.plan', 'settings'])), 'Company updated');
    }

    public function uploadLogo(UploadCompanyLogoRequest $request, Company $company)
    {
        Gate::authorize('update', $company);

        if ($company->logo_path) {
            Storage::disk('public')->delete($company->logo_path);
        }

        $path = $request->file('logo')->store('company-logos/'.$company->id, 'public');
        $company->update(['logo_path' => $path]);

        return $this->success(new CompanyResource($company->fresh(['subscription.plan', 'settings'])), 'Logo uploaded');
    }

    public function removeLogo(Company $company)
    {
        Gate::authorize('update', $company);

        if ($company->logo_path) {
            Storage::disk('public')->delete($company->logo_path);
            $company->update(['logo_path' => null]);
        }

        return $this->success(new CompanyResource($company->fresh(['subscription.plan', 'settings'])), 'Logo removed');
    }

    public function destroy(DeleteCompanyRequest $request, Company $company, AccountDeletionService $deletionService)
    {
        Gate::authorize('delete', $company);

        $user = $request->user();
        $membership = $user->membershipFor($company);

        if (! $user->is_platform_admin && ! $membership?->is_owner) {
            return $this->forbidden('Only the company owner can delete this workspace.');
        }

        if (! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Password is incorrect.'],
            ]);
        }

        $deletionService->deleteCompany($company);

        return $this->success(null, 'Company and all its data were deleted');
    }
}
