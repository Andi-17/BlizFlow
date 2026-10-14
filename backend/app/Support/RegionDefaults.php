<?php

namespace App\Support;

/**
 * Maps ISO 3166-1 alpha-2 country codes to billing currency, UI locale, and timezone.
 * Backend is authoritative — never trust client currency/locale for money.
 */
class RegionDefaults
{
    /**
     * @return list<array{code: string, name: string, currency: string, locale: string, timezone: string}>
     */
    public static function countries(): array
    {
        return [
            ['code' => 'AL', 'name' => 'Albania', 'currency' => 'EUR', 'locale' => 'sq', 'timezone' => 'Europe/Tirane'],
            ['code' => 'XK', 'name' => 'Kosovo', 'currency' => 'EUR', 'locale' => 'sq', 'timezone' => 'Europe/Belgrade'],
            ['code' => 'MK', 'name' => 'North Macedonia', 'currency' => 'EUR', 'locale' => 'sq', 'timezone' => 'Europe/Skopje'],
            ['code' => 'CH', 'name' => 'Switzerland', 'currency' => 'CHF', 'locale' => 'de', 'timezone' => 'Europe/Zurich'],
            ['code' => 'LI', 'name' => 'Liechtenstein', 'currency' => 'CHF', 'locale' => 'de', 'timezone' => 'Europe/Vaduz'],
            ['code' => 'DE', 'name' => 'Germany', 'currency' => 'EUR', 'locale' => 'de', 'timezone' => 'Europe/Berlin'],
            ['code' => 'AT', 'name' => 'Austria', 'currency' => 'EUR', 'locale' => 'de', 'timezone' => 'Europe/Vienna'],
            ['code' => 'IT', 'name' => 'Italy', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Rome'],
            ['code' => 'FR', 'name' => 'France', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Paris'],
            ['code' => 'NL', 'name' => 'Netherlands', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Amsterdam'],
            ['code' => 'BE', 'name' => 'Belgium', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Brussels'],
            ['code' => 'ES', 'name' => 'Spain', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Madrid'],
            ['code' => 'PT', 'name' => 'Portugal', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Lisbon'],
            ['code' => 'IE', 'name' => 'Ireland', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Dublin'],
            ['code' => 'FI', 'name' => 'Finland', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Helsinki'],
            ['code' => 'EE', 'name' => 'Estonia', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Tallinn'],
            ['code' => 'LV', 'name' => 'Latvia', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Riga'],
            ['code' => 'LT', 'name' => 'Lithuania', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Vilnius'],
            ['code' => 'SK', 'name' => 'Slovakia', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Bratislava'],
            ['code' => 'SI', 'name' => 'Slovenia', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Ljubljana'],
            ['code' => 'HR', 'name' => 'Croatia', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Zagreb'],
            ['code' => 'GR', 'name' => 'Greece', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Athens'],
            ['code' => 'ME', 'name' => 'Montenegro', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Podgorica'],
            ['code' => 'BA', 'name' => 'Bosnia and Herzegovina', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Sarajevo'],
            ['code' => 'RS', 'name' => 'Serbia', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'Europe/Belgrade'],
            ['code' => 'GB', 'name' => 'United Kingdom', 'currency' => 'GBP', 'locale' => 'en', 'timezone' => 'Europe/London'],
            ['code' => 'US', 'name' => 'United States', 'currency' => 'USD', 'locale' => 'en', 'timezone' => 'America/New_York'],
            ['code' => 'CA', 'name' => 'Canada', 'currency' => 'USD', 'locale' => 'en', 'timezone' => 'America/Toronto'],
            ['code' => 'OTHER', 'name' => 'Other / International', 'currency' => 'EUR', 'locale' => 'en', 'timezone' => 'UTC'],
        ];
    }

    /**
     * @return list<string>
     */
    public static function countryCodes(): array
    {
        return array_column(self::countries(), 'code');
    }

    /**
     * @return array{code: string, name: string, currency: string, locale: string, timezone: string}
     */
    public static function forCountry(?string $countryCode): array
    {
        $code = strtoupper(trim((string) $countryCode));
        if ($code === '') {
            $code = 'OTHER';
        }

        foreach (self::countries() as $country) {
            if ($country['code'] === $code) {
                return $country;
            }
        }

        return [
            'code' => 'OTHER',
            'name' => 'Other / International',
            'currency' => 'EUR',
            'locale' => 'en',
            'timezone' => 'UTC',
        ];
    }

    public static function normalizeCountry(?string $countryCode): string
    {
        return self::forCountry($countryCode)['code'];
    }

    public static function currencyForCountry(?string $countryCode): string
    {
        return self::forCountry($countryCode)['currency'];
    }

    public static function localeForCountry(?string $countryCode): string
    {
        return self::forCountry($countryCode)['locale'];
    }

    public static function timezoneForCountry(?string $countryCode): string
    {
        return self::forCountry($countryCode)['timezone'];
    }

    /**
     * Catalog list prices: EUR is the source of truth; other currencies are converted
     * with live ECB rates (Frankfurter) and rounded to 2 decimals.
     *
     * @return array{amount: float, currency: string}
     */
    public static function planPrice(string $family, string $currency): array
    {
        $currency = strtoupper($currency);
        $family = strtolower($family);

        $supported = ['EUR', 'CHF', 'GBP', 'USD'];
        if (! in_array($currency, $supported, true)) {
            $currency = 'EUR';
        }

        $eurPrices = config('billing.eur_prices', [
            'free' => 0.0,
            'pro' => 19.0,
            'business' => 40.0,
        ]);

        $amountEur = (float) ($eurPrices[$family] ?? 0.0);
        $amount = CurrencyRates::convertFromEur($amountEur, $currency);

        return [
            'amount' => $amount,
            'currency' => $currency,
        ];
    }
}