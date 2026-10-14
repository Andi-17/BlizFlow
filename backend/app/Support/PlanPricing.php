<?php

namespace App\Support;

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Plan;

class PlanPricing
{
    public static function companyCurrency(?Company $company): string
    {
        if (! $company) {
            return 'EUR';
        }

        $fromSettings = CompanySetting::query()
            ->where('company_id', $company->id)
            ->where('key', 'currency')
            ->value('value');

        if (filled($fromSettings)) {
            return strtoupper((string) $fromSettings);
        }

        return RegionDefaults::currencyForCountry($company->country);
    }

    /**
     * @return array{price: float, currency: string, stripe_price_id: ?string}
     */
    public static function resolve(Plan $plan, string $currency): array
    {
        $currency = strtoupper($currency);
        $priced = RegionDefaults::planPrice($plan->family(), $currency);
        $currency = $priced['currency'];

        return [
            'price' => $plan->isFree() ? 0.0 : $priced['amount'],
            'currency' => strtolower($currency),
            'stripe_price_id' => self::stripePriceId($plan, $currency),
        ];
    }

    public static function stripePriceId(Plan $plan, string $currency): ?string
    {
        if ($plan->isFreeUltra()) {
            $configured = config('services.stripe.prices.free_ultra.eur');
            if (is_string($configured) && filled($configured)) {
                return $configured;
            }

            return filled($plan->stripe_price_id) ? (string) $plan->stripe_price_id : null;
        }

        if ($plan->isFree()) {
            return null;
        }

        $family = $plan->family();
        if (! in_array($family, ['pro', 'business'], true)) {
            return filled($plan->stripe_price_id) ? (string) $plan->stripe_price_id : null;
        }

        $currency = strtolower($currency);
        $configured = config("services.stripe.prices.{$family}.{$currency}");

        if (is_string($configured) && filled($configured)) {
            return $configured;
        }

        if ($currency === 'eur' && filled($plan->stripe_price_id)) {
            return (string) $plan->stripe_price_id;
        }

        return null;
    }

    public static function planIdFromStripePriceId(?string $stripePriceId): ?int
    {
        if (! filled($stripePriceId)) {
            return null;
        }

        $fromPlan = Plan::query()->where('stripe_price_id', $stripePriceId)->value('id');
        if ($fromPlan) {
            return (int) $fromPlan;
        }

        foreach (['pro', 'business', 'free_ultra'] as $family) {
            $prices = config("services.stripe.prices.{$family}", []);
            if (! is_array($prices)) {
                continue;
            }
            foreach ($prices as $priceId) {
                if (is_string($priceId) && $priceId === $stripePriceId) {
                    $slug = $family === 'free_ultra' ? 'free-ultra' : $family;

                    return Plan::query()->where('slug', $slug)->where('is_active', true)->value('id');
                }
            }
        }

        return null;
    }
}
