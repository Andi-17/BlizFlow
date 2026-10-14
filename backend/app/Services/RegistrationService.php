<?php

namespace App\Services;

use App\Mail\AccountVerificationCodeMail;
use App\Mail\WelcomeMail;
use App\Models\User;
use App\Support\MailSender;
use App\Support\RegionDefaults;
use App\Support\UsernameRules;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RegistrationService
{
    public function __construct(
        protected CompanyOnboardingService $onboardingService,
    ) {
    }

    public function sendVerificationCode(array $data): array
    {
        $email = mb_strtolower(trim($data['email']));
        $username = UsernameRules::normalize($data['username']);

        if (User::query()->where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['This email is already registered.'],
            ]);
        }

        if (User::query()->where('username', $username)->exists()) {
            throw ValidationException::withMessages([
                'username' => ['This username is already taken.'],
            ]);
        }

        $code = (string) random_int(100000, 999999);
        $payload = [
            'code_hash' => hash('sha256', $code),
            'attempts' => 0,
            'registration' => [
                'name' => $data['name'],
                'username' => $username,
                'email' => $email,
                'password' => bcrypt($data['password']),
                'company_name' => $data['company_name'] ?? null,
                'country' => RegionDefaults::normalizeCountry($data['country'] ?? null),
                'industry' => $data['industry'] ?? 'general',
                'plan' => 'free',
            ],
        ];

        Cache::put($this->cacheKey($email), $payload, now()->addMinutes(15));

        $sendResult = MailSender::send($email, new AccountVerificationCodeMail(
            $code,
            $data['name'] ?? 'there',
        ));

        $result = [
            'email' => $email,
            'expires_in' => 900,
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

    public function confirm(string $email, string $code): array
    {
        $email = mb_strtolower(trim($email));
        $cacheKey = $this->cacheKey($email);
        $payload = Cache::get($cacheKey);

        if (! is_array($payload) || empty($payload['code_hash']) || empty($payload['registration'])) {
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

        $data = $payload['registration'];
        Cache::forget($cacheKey);

        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => $data['password'],
                'email_verified_at' => now(),
                'is_platform_admin' => false,
                'is_active' => true,
            ]);

            $company = null;
            if (! empty($data['company_name'])) {
                $company = $this->onboardingService->onboard($user, [
                    'name' => $data['company_name'],
                    'email' => $user->email,
                    'industry' => $data['industry'] ?? 'general',
                    'country' => $data['country'] ?? null,
                ], 'free');
            }

            $region = RegionDefaults::forCountry($data['country'] ?? ($company?->country));

            MailSender::send($user->email, new WelcomeMail(
                $user->name,
                $company?->name,
                (bool) $user->is_platform_admin,
            ));

            return [
                'user' => $user,
                'company' => $company,
                'locale' => $region['locale'],
                'currency' => $region['currency'],
                'country' => $region['code'],
            ];
        });
    }

    protected function cacheKey(string $email): string
    {
        return 'bizflow:register:'.hash('sha256', mb_strtolower(trim($email)));
    }
}
