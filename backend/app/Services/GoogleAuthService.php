<?php

namespace App\Services;

use App\Mail\WelcomeMail;
use App\Models\User;
use App\Support\MailSender;
use App\Support\UsernameRules;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Contracts\User as SocialUser;

class GoogleAuthService
{
    public function isConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'));
    }

    public function loginOrRegister(SocialUser $googleUser): User
    {
        $email = mb_strtolower(trim((string) $googleUser->getEmail()));
        $googleId = (string) $googleUser->getId();

        if ($email === '' || $googleId === '') {
            throw ValidationException::withMessages([
                'google' => ['Google did not share an email address. Allow email access and try again.'],
            ]);
        }

        $user = User::query()->where('google_id', $googleId)->first()
            ?? User::query()->where('email', $email)->first();

        if ($user && ! $user->is_active) {
            throw ValidationException::withMessages([
                'google' => ['This account is inactive.'],
            ]);
        }

        $created = false;

        if (! $user) {
            $user = User::query()->create([
                'name' => $googleUser->getName() ?: Str::before($email, '@'),
                'username' => $this->uniqueUsernameFromEmail($email),
                'email' => $email,
                'google_id' => $googleId,
                'avatar_url' => $googleUser->getAvatar(),
                'password' => Hash::make(Str::password(32)),
                'email_verified_at' => now(),
                'is_platform_admin' => false,
                'is_active' => true,
            ]);
            $created = true;
        } else {
            $user->forceFill(array_filter([
                'google_id' => $user->google_id ?: $googleId,
                'avatar_url' => $googleUser->getAvatar() ?: $user->avatar_url,
                'email_verified_at' => $user->email_verified_at ?? now(),
            ]))->save();
        }

        if ($created) {
            MailSender::send($user->email, new WelcomeMail(
                $user->name,
                null,
                (bool) $user->is_platform_admin,
            ));
        }

        return $user->fresh();
    }

    public function destinationPath(User $user): string
    {
        $companyCount = $user->companies()
            ->wherePivot('status', 'active')
            ->count();

        if ($user->is_platform_admin && $companyCount === 0) {
            return '/admin';
        }

        if ($companyCount === 0) {
            return '/onboarding/company';
        }

        return '/app';
    }

    protected function uniqueUsernameFromEmail(string $email): string
    {
        $local = UsernameRules::normalize(Str::before($email, '@'));
        $base = preg_replace('/[^a-z0-9._]/', '', $local) ?: 'user';
        $base = substr($base, 0, 40);
        if (strlen($base) < 3) {
            $base = str_pad($base, 3, '0');
        }

        $username = $base;
        $suffix = 0;
        while (User::query()->where('username', $username)->exists()) {
            $suffix++;
            $username = substr($base, 0, 40).$suffix;
        }

        return $username;
    }
}
