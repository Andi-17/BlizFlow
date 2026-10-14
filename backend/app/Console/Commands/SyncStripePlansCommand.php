<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Support\RegionDefaults;
use Illuminate\Console\Command;
use Stripe\StripeClient;
use Throwable;

class SyncStripePlansCommand extends Command
{
    protected $signature = 'stripe:sync-plans {--currencies=eur,chf : Comma-separated currencies to sync}';

    protected $description = 'Create Stripe products/prices for Pro, Business, and Free Ultra, then store price IDs on plans';

    public function handle(): int
    {
        $secret = (string) config('services.stripe.secret');
        if ($secret === '') {
            $this->error('STRIPE_SECRET is empty. Add your Stripe secret key first.');

            return self::FAILURE;
        }

        $client = new StripeClient($secret);
        $currencies = collect(explode(',', (string) $this->option('currencies')))
            ->map(fn (string $value) => strtolower(trim($value)))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $paidPlans = Plan::query()
            ->where('is_active', true)
            ->where('price', '>', 0)
            ->whereIn('interval', ['monthly', 'yearly'])
            ->orderBy('sort_order')
            ->get();

        $envUpdates = [];

        foreach ($paidPlans as $plan) {
            try {
                $created = $this->syncPlan($client, $plan, $currencies);
                $envUpdates = array_merge($envUpdates, $created);
            } catch (Throwable $exception) {
                $this->error('Failed to sync '.$plan->slug.': '.$exception->getMessage());

                return self::FAILURE;
            }
        }

        $freeUltra = Plan::query()->where('slug', 'free-ultra')->where('is_active', true)->first();
        if ($freeUltra) {
            try {
                $created = $this->syncFreeUltra($client, $freeUltra);
                $envUpdates = array_merge($envUpdates, $created);
            } catch (Throwable $exception) {
                $this->error('Failed to sync free-ultra: '.$exception->getMessage());

                return self::FAILURE;
            }
        }

        if ($envUpdates !== []) {
            $this->newLine();
            $this->info('Add these to backend/.env (or they were auto-written if writable):');
            foreach ($envUpdates as $key => $value) {
                $this->line($key.'='.$value);
            }
            $this->writeEnvPrices($envUpdates);
        }

        $this->info('Stripe plans synced.');

        return self::SUCCESS;
    }

    /**
     * @param  list<string>  $currencies
     * @return array<string, string>
     */
    protected function syncPlan(StripeClient $client, Plan $plan, array $currencies): array
    {
        $productId = $plan->stripe_product_id;
        if ($productId) {
            try {
                $client->products->retrieve($productId);
            } catch (Throwable) {
                $productId = null;
            }
        }

        if (! $productId && filled($plan->stripe_price_id)) {
            try {
                $existingPrice = $client->prices->retrieve($plan->stripe_price_id);
                $productId = is_string($existingPrice->product)
                    ? $existingPrice->product
                    : ($existingPrice->product->id ?? null);
            } catch (Throwable) {
                $productId = null;
            }
        }

        if (! $productId) {
            $product = $client->products->create([
                'name' => 'BizFlow '.$plan->name,
                'description' => $plan->description ?: $plan->name,
                'metadata' => [
                    'plan_id' => (string) $plan->id,
                    'plan_slug' => $plan->slug,
                ],
            ]);
            $productId = $product->id;
        }

        $envUpdates = [];
        $eurPriceId = $plan->stripe_price_id;
        $interval = $plan->interval === 'yearly' ? 'year' : 'month';

        foreach ($currencies as $currency) {
            $priced = RegionDefaults::planPrice($plan->family(), strtoupper($currency));
            $amount = (int) round($priced['amount'] * 100);
            $currencyCode = strtolower($priced['currency']);
            $envKey = $this->envKeyFor($plan->family(), $currencyCode);

            if ($currencyCode === 'eur' && filled($plan->stripe_price_id)) {
                try {
                    $existing = $client->prices->retrieve($plan->stripe_price_id);
                    $matches = (int) ($existing->unit_amount ?? 0) === $amount
                        && strtolower((string) ($existing->currency ?? '')) === 'eur'
                        && (($existing->recurring->interval ?? null) === $interval);
                    if ($matches) {
                        $this->line('Kept '.$plan->slug.' EUR → '.$plan->stripe_price_id);
                        $envUpdates[$envKey] = $plan->stripe_price_id;
                        continue;
                    }
                } catch (Throwable) {
                    // create below
                }
            }

            $configured = (string) config("services.stripe.prices.{$plan->family()}.{$currencyCode}");
            if ($configured !== '') {
                try {
                    $existing = $client->prices->retrieve($configured);
                    $matches = (int) ($existing->unit_amount ?? 0) === $amount
                        && strtolower((string) ($existing->currency ?? '')) === $currencyCode
                        && (($existing->recurring->interval ?? null) === $interval);
                    if ($matches) {
                        $this->line('Kept '.$plan->slug.' '.strtoupper($currencyCode).' → '.$configured);
                        $envUpdates[$envKey] = $configured;
                        if ($currencyCode === 'eur') {
                            $eurPriceId = $configured;
                        }
                        continue;
                    }
                } catch (Throwable) {
                    // create below
                }
            }

            $price = $client->prices->create([
                'product' => $productId,
                'currency' => $currencyCode,
                'unit_amount' => $amount,
                'recurring' => [
                    'interval' => $interval,
                ],
                'metadata' => [
                    'plan_id' => (string) $plan->id,
                    'plan_slug' => $plan->slug,
                    'currency' => $currencyCode,
                ],
            ]);

            $this->line('Created '.$plan->slug.' '.strtoupper($currencyCode).' → '.$price->id);
            $envUpdates[$envKey] = $price->id;

            if ($currencyCode === 'eur') {
                $eurPriceId = $price->id;
            }
        }

        $plan->update([
            'stripe_product_id' => $productId,
            'stripe_price_id' => $eurPriceId ?: $plan->stripe_price_id,
            'currency' => 'eur',
        ]);

        return $envUpdates;
    }

    /**
     * @return array<string, string>
     */
    protected function syncFreeUltra(StripeClient $client, Plan $plan): array
    {
        $productId = $plan->stripe_product_id;
        if ($productId) {
            try {
                $client->products->retrieve($productId);
            } catch (Throwable) {
                $productId = null;
            }
        }

        if (! $productId && filled($plan->stripe_price_id)) {
            try {
                $existingPrice = $client->prices->retrieve($plan->stripe_price_id);
                $productId = is_string($existingPrice->product)
                    ? $existingPrice->product
                    : ($existingPrice->product->id ?? null);
            } catch (Throwable) {
                $productId = null;
            }
        }

        if (! $productId) {
            $product = $client->products->create([
                'name' => 'BizFlow Free Ultra',
                'description' => $plan->description ?: 'Creator complimentary full-access plan',
                'metadata' => [
                    'plan_id' => (string) $plan->id,
                    'plan_slug' => $plan->slug,
                    'hidden' => '1',
                ],
            ]);
            $productId = $product->id;
        } else {
            try {
                $client->products->update($productId, [
                    'name' => 'BizFlow Free Ultra',
                    'metadata' => [
                        'plan_id' => (string) $plan->id,
                        'plan_slug' => $plan->slug,
                        'hidden' => '1',
                    ],
                ]);
            } catch (Throwable) {
                // keep existing product
            }
        }

        $envKey = 'STRIPE_PRICE_FREE_ULTRA_MONTHLY';
        $priceId = $plan->stripe_price_id;
        $configured = (string) config('services.stripe.prices.free_ultra.eur');

        if ($configured !== '') {
            try {
                $existing = $client->prices->retrieve($configured);
                $matches = (int) ($existing->unit_amount ?? -1) === 0
                    && strtolower((string) ($existing->currency ?? '')) === 'eur'
                    && (($existing->recurring->interval ?? null) === 'month');
                if ($matches) {
                    $this->line('Kept free-ultra EUR → '.$configured);
                    $priceId = $configured;
                    $plan->update([
                        'stripe_product_id' => $productId,
                        'stripe_price_id' => $priceId,
                        'currency' => 'eur',
                    ]);

                    return [$envKey => $priceId];
                }
            } catch (Throwable) {
                // create below
            }
        }

        if (filled($priceId)) {
            try {
                $existing = $client->prices->retrieve($priceId);
                $matches = (int) ($existing->unit_amount ?? -1) === 0
                    && strtolower((string) ($existing->currency ?? '')) === 'eur'
                    && (($existing->recurring->interval ?? null) === 'month');
                if ($matches) {
                    $this->line('Kept free-ultra EUR → '.$priceId);
                    $plan->update([
                        'stripe_product_id' => $productId,
                        'stripe_price_id' => $priceId,
                        'currency' => 'eur',
                    ]);

                    return [$envKey => $priceId];
                }
            } catch (Throwable) {
                // create below
            }
        }

        $price = $client->prices->create([
            'product' => $productId,
            'currency' => 'eur',
            'unit_amount' => 0,
            'recurring' => [
                'interval' => 'month',
            ],
            'metadata' => [
                'plan_id' => (string) $plan->id,
                'plan_slug' => $plan->slug,
                'hidden' => '1',
            ],
        ]);

        $this->line('Created free-ultra EUR → '.$price->id);
        $plan->update([
            'stripe_product_id' => $productId,
            'stripe_price_id' => $price->id,
            'currency' => 'eur',
        ]);

        return [$envKey => $price->id];
    }

    protected function envKeyFor(string $family, string $currency): string
    {
        if ($family === 'free_ultra') {
            return 'STRIPE_PRICE_FREE_ULTRA_MONTHLY';
        }

        $key = 'STRIPE_PRICE_'.strtoupper($family).'_MONTHLY';
        if ($currency !== 'eur') {
            $key .= '_'.strtoupper($currency);
        }

        return $key;
    }

    /**
     * @param  array<string, string>  $updates
     */
    protected function writeEnvPrices(array $updates): void
    {
        $envPath = base_path('.env');
        if (! is_file($envPath) || ! is_writable($envPath)) {
            return;
        }

        $contents = file_get_contents($envPath);
        if ($contents === false) {
            return;
        }

        foreach ($updates as $key => $value) {
            $line = $key.'='.$value;
            if (preg_match('/^'.preg_quote($key, '/').'=.*$/m', $contents)) {
                $contents = preg_replace('/^'.preg_quote($key, '/').'=.*$/m', $line, $contents, 1);
            } else {
                $contents = rtrim($contents)."\n".$line."\n";
            }
        }

        file_put_contents($envPath, $contents);
        $this->info('Updated backend/.env with regional Stripe price IDs.');
    }
}
