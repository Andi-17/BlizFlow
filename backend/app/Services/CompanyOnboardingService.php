<?php

namespace App\Services;

use App\Mail\CompanyVerificationCodeMail;
use App\Models\Category;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\CompanyUser;
use App\Models\Role;
use App\Models\User;
use App\Services\Billing\PlanEntitlementService;
use App\Services\Billing\StripeService;
use App\Support\IndustryCatalog;
use App\Support\MailSender;
use App\Support\RegionDefaults;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CompanyOnboardingService
{
    public const MAX_OWNED_COMPANIES = 1;

    public function __construct(
        protected StripeService $stripeService,
        protected ActivityLogger $activityLogger,
        protected PlanEntitlementService $planEntitlements,
    ) {
    }

    public function ownedCompanyCount(User $user): int
    {
        return CompanyUser::query()
            ->where('user_id', $user->id)
            ->where('is_owner', true)
            ->where('status', 'active')
            ->count();
    }

    public function assertCanCreateCompany(User $user): void
    {
        $this->planEntitlements->assertCanCreateCompany($user);
    }

    public function sendVerificationCode(User $user, array $companyData): array
    {
        $this->assertCanCreateCompany($user);

        $code = (string) random_int(100000, 999999);
        $payload = [
            'code_hash' => hash('sha256', $code),
            'company' => $companyData,
            'plan' => $companyData['plan'] ?? 'free',
            'attempts' => 0,
        ];

        Cache::put($this->cacheKey($user->id), $payload, now()->addMinutes(15));

        $companyName = $companyData['name'] ?? 'your company';
        $sendResult = MailSender::send($user->email, new CompanyVerificationCodeMail(
            $code,
            $companyName,
            $user->name ?? 'there',
        ));

        $result = [
            'email' => $user->email,
            'expires_in' => 900,
            'owned_companies' => $this->ownedCompanyCount($user),
            'max_companies' => $this->planEntitlements->maxOwnedCompanies($user),
            'mail_delivered' => $sendResult['delivered'],
        ];

        if (MailSender::shouldShowCode($sendResult)) {
            $result['dev_code'] = $code;
            $result['mail_hint'] = $sendResult['error']
                ? 'Email failed: '.$sendResult['error'].' — use this code for now.'
                : 'Local/log mail mode — code shown here because inbox delivery is off.';
        }

        return $result;
    }

    public function confirmVerificationCode(User $user, string $code, ?array $companyOverride = null): Company
    {
        $this->assertCanCreateCompany($user);

        $cacheKey = $this->cacheKey($user->id);
        $payload = Cache::get($cacheKey);

        if (! is_array($payload) || empty($payload['code_hash'])) {
            throw ValidationException::withMessages([
                'verification_code' => ['Verification code expired. Request a new one.'],
            ]);
        }

        $attempts = (int) ($payload['attempts'] ?? 0);
        if ($attempts >= 5) {
            Cache::forget($cacheKey);
            throw ValidationException::withMessages([
                'verification_code' => ['Too many attempts. Request a new code.'],
            ]);
        }

        if (! hash_equals($payload['code_hash'], hash('sha256', trim($code)))) {
            $payload['attempts'] = $attempts + 1;
            Cache::put($cacheKey, $payload, now()->addMinutes(15));
            throw ValidationException::withMessages([
                'verification_code' => ['Invalid verification code.'],
            ]);
        }

        $companyData = $companyOverride ?: ($payload['company'] ?? []);
        $plan = $companyOverride['plan'] ?? ($payload['plan'] ?? 'free');

        Cache::forget($cacheKey);

        return $this->onboard($user, $companyData, $plan);
    }

    public function onboard(User $user, array $companyData, ?string $planSlug = 'free'): Company
    {
        $this->assertCanCreateCompany($user);

        return DB::transaction(function () use ($user, $companyData, $planSlug) {
            $slug = $companyData['slug'] ?? Str::slug($companyData['name']);
            $baseSlug = $slug;
            $counter = 1;
            while (Company::query()->where('slug', $slug)->exists()) {
                $slug = $baseSlug.'-'.$counter;
                $counter++;
            }

            $industrySlug = $companyData['industry'] ?? 'general';
            $industry = IndustryCatalog::get($industrySlug);
            $country = RegionDefaults::normalizeCountry($companyData['country'] ?? null);
            $region = RegionDefaults::forCountry($country);

            $payload = [
                'name' => $companyData['name'],
                'slug' => $slug,
                'industry' => $industry['slug'],
                'tagline' => $companyData['tagline'] ?? $industry['description'],
                'email' => $companyData['email'] ?? $user->email ?? null,
                'phone' => $companyData['phone'] ?? null,
                'address_line1' => $companyData['address_line1'] ?? null,
                'address_line2' => $companyData['address_line2'] ?? null,
                'city' => $companyData['city'] ?? null,
                'state' => $companyData['state'] ?? null,
                'postal_code' => $companyData['postal_code'] ?? null,
                'country' => $country === 'OTHER' ? ($companyData['country'] ?? 'OTHER') : $country,
                'is_active' => true,
                'is_public' => true,
            ];

            if (! filled($payload['email'])) {
                $payload['email'] = $user->email;
            }

            $company = Company::query()->create($payload);

            $ownerRole = Role::query()->firstOrCreate(
                ['company_id' => null, 'slug' => 'owner'],
                ['name' => 'Owner', 'description' => 'Company owner']
            );

            CompanyUser::query()->create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'role_id' => $ownerRole->id,
                'is_owner' => true,
                'status' => 'active',
            ]);

            $defaults = [
                'currency' => $region['currency'],
                'locale' => $region['locale'],
                'timezone' => $region['timezone'],
                'invoice_prefix' => $industry['invoice_prefix'],
                'order_prefix' => $industry['order_prefix'],
                'tax_rate' => '0',
                'industry_labels' => json_encode($industry['labels']),
            ];

            foreach ($defaults as $key => $value) {
                CompanySetting::query()->create([
                    'company_id' => $company->id,
                    'key' => $key,
                    'value' => $value,
                ]);
            }

            foreach ($industry['default_categories'] as $categoryName) {
                Category::query()->create([
                    'company_id' => $company->id,
                    'name' => $categoryName,
                    'slug' => Str::slug($categoryName),
                    'description' => null,
                ]);
            }

            $this->stripeService->startComplimentaryTrial($company);

            $this->activityLogger->log('company.onboarded', $company, [
                'plan' => 'trial',
                'trial_days' => (int) config('billing.trial_days', 7),
            ], $user, $company->id);

            return $company->load(['subscription.plan', 'settings']);
        });
    }

    protected function cacheKey(int $userId): string
    {
        return 'company_verify:'.$userId;
    }
}
