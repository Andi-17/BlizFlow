<?php

namespace App\Support;

class DevTools
{
    /**
     * Destructive test helpers (wipe users, etc.) — never on production.
     */
    public static function enabled(): bool
    {
        if (app()->environment(['local', 'testing'])) {
            return true;
        }

        if (filter_var(env('DEV_TOOLS_ENABLED', false), FILTER_VALIDATE_BOOLEAN)) {
            return true;
        }

        $stripeSecret = (string) config('services.stripe.secret', '');

        return str_starts_with($stripeSecret, 'sk_test_')
            && ! app()->environment('production');
    }
}
