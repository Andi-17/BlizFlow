<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        Plan::query()
            ->whereIn('slug', ['pro-monthly', 'business-monthly'])
            ->update(['is_active' => false]);

        $plans = [
            [
                'slug' => 'free',
                'name' => 'Free',
                'description' => 'Start one workspace and run the basics.',
                'interval' => 'lifetime',
                'price' => 0,
                'sort_order' => 1,
                'is_public' => true,
                'stripe_price_id' => null,
                'features' => [
                    'max_companies' => 1,
                    'max_users' => 3,
                    'reports' => false,
                    'items' => [
                        '1 company workspace',
                        'Up to 3 people',
                        'Customers, products, orders, invoices, tasks',
                        'Admin, manager & worker roles',
                        'Industry language for your trade',
                    ],
                ],
            ],
            [
                'slug' => 'pro',
                'name' => 'Pro',
                'description' => 'More companies, a larger team, and full reports.',
                'interval' => 'monthly',
                'price' => 19,
                'sort_order' => 2,
                'is_public' => true,
                'stripe_price_id' => config('services.stripe.prices.pro.eur'),
                'features' => [
                    'max_companies' => 3,
                    'max_users' => 15,
                    'reports' => true,
                    'items' => [
                        'Up to 3 company workspaces',
                        'Up to 15 people',
                        'Sales & inventory reports',
                        'Everything in Free',
                        'Priority email support',
                    ],
                ],
            ],
            [
                'slug' => 'business',
                'name' => 'Business',
                'description' => 'Room to grow across shops, crews, and brands.',
                'interval' => 'monthly',
                'price' => 40,
                'sort_order' => 3,
                'is_public' => true,
                'stripe_price_id' => config('services.stripe.prices.business.eur'),
                'features' => [
                    'max_companies' => 10,
                    'max_users' => 0,
                    'reports' => true,
                    'items' => [
                        'Up to 10 company workspaces',
                        'Unlimited team members',
                        'Sales & inventory reports',
                        'Everything in Pro',
                        'Best for multi-location operators',
                    ],
                ],
            ],
            [
                'slug' => 'free-ultra',
                'name' => 'Free Ultra',
                'description' => 'Creator-only complimentary plan with full Business features. Hidden from public pricing.',
                'interval' => 'monthly',
                'price' => 0,
                'sort_order' => 99,
                'is_public' => false,
                'stripe_price_id' => config('services.stripe.prices.free_ultra.eur'),
                'features' => [
                    'max_companies' => 10,
                    'max_users' => 0,
                    'reports' => true,
                    'items' => [
                        'Full Business features',
                        'Assigned only by the creator via Stripe',
                        'Not listed on public pricing',
                    ],
                ],
            ],
        ];

        foreach ($plans as $plan) {
            $current = Plan::query()->where('slug', $plan['slug'])->first();
            $priceChanged = $current
                && (
                    $current->interval !== $plan['interval']
                    || (float) $current->price !== (float) $plan['price']
                );

            Plan::query()->updateOrCreate(
                ['slug' => $plan['slug']],
                [
                    'name' => $plan['name'],
                    'description' => $plan['description'],
                    'interval' => $plan['interval'],
                    'price' => $plan['price'],
                    'currency' => 'eur',
                    'features' => $plan['features'],
                    'is_active' => true,
                    'is_public' => $plan['is_public'] ?? true,
                    'sort_order' => $plan['sort_order'],
                    'trial_days' => 0,
                    'stripe_price_id' => $priceChanged
                        ? ($plan['stripe_price_id'] ?: null)
                        : ($plan['stripe_price_id'] ?: $current?->stripe_price_id),
                    'stripe_product_id' => $priceChanged ? null : $current?->stripe_product_id,
                ]
            );
        }

        Plan::query()
            ->whereIn('slug', ['pro-yearly', 'business-yearly', 'pro-monthly', 'business-monthly'])
            ->update(['is_active' => false]);

        app(\App\Services\Billing\StripeService::class)->revokeUnpaidPaidPlans();
    }
}
