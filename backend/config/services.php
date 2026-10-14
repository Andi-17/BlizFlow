<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', env('FRONTEND_URL', 'http://localhost:5173').'/auth/google/callback'),
    ],

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'prices' => [
            'pro' => [
                'eur' => env('STRIPE_PRICE_PRO_MONTHLY'),
                'chf' => env('STRIPE_PRICE_PRO_MONTHLY_CHF'),
                'gbp' => env('STRIPE_PRICE_PRO_MONTHLY_GBP'),
                'usd' => env('STRIPE_PRICE_PRO_MONTHLY_USD'),
            ],
            'business' => [
                'eur' => env('STRIPE_PRICE_BUSINESS_MONTHLY'),
                'chf' => env('STRIPE_PRICE_BUSINESS_MONTHLY_CHF'),
                'gbp' => env('STRIPE_PRICE_BUSINESS_MONTHLY_GBP'),
                'usd' => env('STRIPE_PRICE_BUSINESS_MONTHLY_USD'),
            ],
            'free_ultra' => [
                'eur' => env('STRIPE_PRICE_FREE_ULTRA_MONTHLY'),
            ],
        ],
    ],

];
