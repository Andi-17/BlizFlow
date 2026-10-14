<?php

namespace App\Support;

class BusinessPublicUrl
{
    public static function forSlug(string $slug): string
    {
        $slug = strtolower(trim($slug));
        if ($slug === '') {
            return rtrim((string) config('app.frontend_url'), '/');
        }

        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        $parts = parse_url($frontendUrl) ?: [];
        $scheme = $parts['scheme'] ?? 'http';
        $host = strtolower((string) ($parts['host'] ?? 'localhost'));
        $port = $parts['port'] ?? null;

        $root = strtolower((string) (config('app.frontend_root_domain') ?: $host));

        if ($root === '' || $root === '127.0.0.1' || filter_var($root, FILTER_VALIDATE_IP)) {
            return $frontendUrl.'/b/'.$slug;
        }

        $portPart = $port && ! in_array((int) $port, [80, 443], true) ? ':'.$port : '';

        return $scheme.'://'.$slug.'.'.$root.$portPart;
    }

    public static function pathForSlug(string $slug): string
    {
        return '/b/'.strtolower(trim($slug));
    }
}
