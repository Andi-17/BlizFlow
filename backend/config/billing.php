<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Catalog FX (EUR base)
    |--------------------------------------------------------------------------
    |
    | Used when live ECB rates (Frankfurter) are unavailable.
    | Values = units of currency per 1 EUR.
    |
    */

    'fx' => [
        'CHF' => (float) env('BILLING_FX_CHF', 0.94),
        'USD' => (float) env('BILLING_FX_USD', 1.08),
        'GBP' => (float) env('BILLING_FX_GBP', 0.86),
    ],

    /*
    |--------------------------------------------------------------------------
    | EUR list prices (source of truth before FX)
    |--------------------------------------------------------------------------
    */

    'eur_prices' => [
        'free' => 0.0,
        'free_ultra' => 0.0,
        'pro' => 19.0,
        'business' => 40.0,
    ],

    /*
    |--------------------------------------------------------------------------
    | Complimentary Pro trial (no card required)
    |--------------------------------------------------------------------------
    */

    'trial_days' => (int) env('BILLING_TRIAL_DAYS', 7),
    'trial_plan' => env('BILLING_TRIAL_PLAN', 'pro'),

];
