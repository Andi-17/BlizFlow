<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique(array_filter(array_merge(
        [
            env('FRONTEND_URL', 'http://127.0.0.1:5173'),
            env('APP_URL'),
        ],
        env('APP_ENV', 'production') === 'production' ? [] : [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
        ]
    )))),

    'allowed_origins_patterns' => array_values(array_filter([
        // Local business subdomains: http://slug.localhost:5173
        env('APP_ENV', 'production') === 'production' ? null : '#^https?://[a-z0-9-]+\.localhost(:\d+)?$#',
        // Production wildcard if FRONTEND_ROOT_DOMAIN is set (e.g. bizflow.com)
        filled(env('FRONTEND_ROOT_DOMAIN'))
            ? '#^https?://([a-z0-9-]+\.)?'.preg_quote(strtolower((string) env('FRONTEND_ROOT_DOMAIN')), '#').'(:\d+)?$#'
            : null,
    ])),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
