<?php

namespace App\Support;

class CheckoutRedirectGuard
{
    public static function allowed(string $url): bool
    {
        $parts = parse_url($url);
        if (! is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
            return false;
        }

        if (! in_array($parts['scheme'], ['http', 'https'], true)) {
            return false;
        }

        $origin = $parts['scheme'].'://'.$parts['host'];
        if (! empty($parts['port'])) {
            $origin .= ':'.$parts['port'];
        }

        $allowed = config('cors.allowed_origins', []);
        foreach ($allowed as $allowedOrigin) {
            if ($origin === rtrim((string) $allowedOrigin, '/')) {
                return true;
            }
        }

        return false;
    }
}
