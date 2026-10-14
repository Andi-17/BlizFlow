<?php

namespace App\Services;

use App\Mail\LoginVerificationCodeMail;
use App\Mail\LoginWelcomeMail;
use App\Models\User;
use App\Support\MailSender;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginChallengeService
{
    public function start(string $login, string $password): array
    {
        $login = trim($login);

        $user = User::query()
            ->where(function ($query) use ($login) {
                $query
                    ->where('email', $login)
                    ->orWhere('username', mb_strtolower($login, 'UTF-8'));
            })
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => ['This account is inactive.'],
            ]);
        }

        if (! $user->email) {
            throw ValidationException::withMessages([
                'login' => ['This account has no email for verification.'],
            ]);
        }

        $code = (string) random_int(100000, 999999);
        Cache::put($this->cacheKey($user->id), [
            'code_hash' => hash('sha256', $code),
            'attempts' => 0,
            'user_id' => $user->id,
        ], now()->addMinutes(10));

        $sendResult = MailSender::send($user->email, new LoginVerificationCodeMail(
            $code,
            $user->name ?? 'there',
        ));

        $masked = $this->maskEmail($user->email);

        $result = [
            'email' => $masked,
            'email_hint' => $masked,
            'user_id' => $user->id,
            'expires_in' => 600,
            'requires_verification' => true,
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

    public function confirm(int $userId, string $code): User
    {
        $cacheKey = $this->cacheKey($userId);
        $payload = Cache::get($cacheKey);

        if (! is_array($payload) || empty($payload['code_hash'])) {
            throw ValidationException::withMessages([
                'verification_code' => ['Verification code expired. Sign in again.'],
            ]);
        }

        $attempts = (int) ($payload['attempts'] ?? 0);
        if ($attempts >= 5) {
            Cache::forget($cacheKey);
            throw ValidationException::withMessages([
                'verification_code' => ['Too many attempts. Sign in again.'],
            ]);
        }

        if (! hash_equals($payload['code_hash'], hash('sha256', trim($code)))) {
            $payload['attempts'] = $attempts + 1;
            Cache::put($cacheKey, $payload, now()->addMinutes(10));
            throw ValidationException::withMessages([
                'verification_code' => ['Invalid verification code.'],
            ]);
        }

        Cache::forget($cacheKey);

        $user = User::query()->findOrFail($userId);
        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => ['This account is inactive.'],
            ]);
        }

        MailSender::send($user->email, new LoginWelcomeMail(
            $user->name ?? 'there',
            now()->timezone(config('app.timezone'))->format('d M Y, H:i'),
            (bool) $user->is_platform_admin,
        ));

        return $user;
    }

    protected function cacheKey(int $userId): string
    {
        return 'bizflow:login:'.$userId;
    }

    protected function maskEmail(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');
        if ($local === '' || $domain === '') {
            return '***';
        }
        $visible = substr($local, 0, min(2, strlen($local)));

        return $visible.str_repeat('*', max(strlen($local) - 2, 1)).'@'.$domain;
    }
}
