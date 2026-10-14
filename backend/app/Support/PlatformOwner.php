<?php

namespace App\Support;

use App\Models\User;

class PlatformOwner
{
    public static function email(): string
    {
        return strtolower(trim((string) config('app.platform_owner_email', '')));
    }

    public static function isConfigured(): bool
    {
        return self::email() !== '';
    }

    public static function matches(?User $user): bool
    {
        if (! $user || ! $user->is_platform_admin) {
            return false;
        }

        $ownerEmail = self::email();
        if ($ownerEmail === '') {
            return false;
        }

        return strtolower(trim((string) $user->email)) === $ownerEmail;
    }
}
