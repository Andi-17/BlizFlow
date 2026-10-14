<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * EUR-based FX for catalog plan amounts (display + checkout face value).
 * Prefers live ECB rates via Frankfurter; falls back to configured defaults.
 */
class CurrencyRates
{
    private const CACHE_KEY = 'billing.fx.eur_rates';

    /**
     * How many units of $currency equal 1 EUR.
     */
    public static function rateFromEur(string $currency): float
    {
        $currency = strtoupper(trim($currency));
        if ($currency === '' || $currency === 'EUR') {
            return 1.0;
        }

        $rates = self::ratesFromEur();

        return (float) ($rates[$currency] ?? 1.0);
    }

    public static function convertFromEur(float $amountEur, string $currency): float
    {
        $currency = strtoupper(trim($currency));
        if ($currency === '' || $currency === 'EUR') {
            return round($amountEur, 2);
        }

        return round($amountEur * self::rateFromEur($currency), 2);
    }

    /**
     * @return array<string, float>
     */
    public static function ratesFromEur(): array
    {
        return Cache::remember(self::CACHE_KEY, now()->addHours(12), function () {
            return self::fetchLiveRates() ?? self::fallbackRates();
        });
    }

    /**
     * @return array<string, float>|null
     */
    protected static function fetchLiveRates(): ?array
    {
        try {
            $response = Http::timeout(4)
                ->acceptJson()
                ->get('https://api.frankfurter.app/latest', [
                    'from' => 'EUR',
                    'to' => 'CHF,USD,GBP',
                ]);

            if (! $response->successful()) {
                return null;
            }

            $rates = $response->json('rates');
            if (! is_array($rates)) {
                return null;
            }

            $resolved = [
                'EUR' => 1.0,
                'CHF' => isset($rates['CHF']) ? (float) $rates['CHF'] : null,
                'USD' => isset($rates['USD']) ? (float) $rates['USD'] : null,
                'GBP' => isset($rates['GBP']) ? (float) $rates['GBP'] : null,
            ];

            foreach (['CHF', 'USD', 'GBP'] as $code) {
                if ($resolved[$code] === null || $resolved[$code] <= 0) {
                    $resolved[$code] = self::fallbackRates()[$code];
                }
            }

            return $resolved;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return array<string, float>
     */
    public static function fallbackRates(): array
    {
        return [
            'EUR' => 1.0,
            'CHF' => (float) config('billing.fx.CHF', 0.94),
            'USD' => (float) config('billing.fx.USD', 1.08),
            'GBP' => (float) config('billing.fx.GBP', 0.86),
        ];
    }

    public static function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
