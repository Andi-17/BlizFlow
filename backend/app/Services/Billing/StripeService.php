<?php

namespace App\Services\Billing;

use App\Models\BillingInvoice;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\StripeWebhookEvent;
use App\Models\Subscription;
use App\Models\SubscriptionItem;
use App\Services\ActivityLogger;
use App\Support\PlanPricing;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Stripe;
use Stripe\StripeClient;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeService
{
    protected ?StripeClient $client = null;

    public function __construct(protected ActivityLogger $activityLogger)
    {
        $secret = config('services.stripe.secret');
        if ($secret) {
            Stripe::setApiKey($secret);
            $this->client = new StripeClient($secret);
        }
    }

    public function client(): StripeClient
    {
        if (! $this->client) {
            throw new UnexpectedValueException('Stripe is not configured.');
        }

        return $this->client;
    }

    public function ensureCustomer(Company $company): string
    {
        if ($company->stripe_customer_id) {
            return $company->stripe_customer_id;
        }

        try {
            $customer = $this->client()->customers->create([
                'email' => filled($company->email) ? $company->email : null,
                'name' => $company->name,
                'metadata' => [
                    'company_id' => (string) $company->id,
                ],
            ]);
        } catch (ApiErrorException $exception) {
            throw new UnexpectedValueException('Stripe customer error: '.$exception->getMessage(), 0, $exception);
        }

        $company->update(['stripe_customer_id' => $customer->id]);

        return $customer->id;
    }

    /**
     * Stripe Customer Portal — hosted page to manage card, invoices, cancel.
     *
     * @return array{url: string, provider: string}
     */
    public function createBillingPortalSession(Company $company, string $returnUrl): array
    {
        if (! $this->isConfigured()) {
            throw new UnexpectedValueException('Stripe is not configured.');
        }

        $customerId = $this->ensureCustomer($company);

        try {
            $session = $this->client()->billingPortal->sessions->create([
                'customer' => $customerId,
                'return_url' => $returnUrl,
            ]);
        } catch (ApiErrorException $exception) {
            throw new UnexpectedValueException(
                'Stripe portal error: '.$exception->getMessage().' Activate Customer Portal in Stripe Dashboard → Settings → Billing → Customer portal.',
                0,
                $exception
            );
        }

        if (! filled($session->url)) {
            throw new UnexpectedValueException('Stripe did not return a portal URL.');
        }

        return [
            'url' => (string) $session->url,
            'provider' => 'stripe',
        ];
    }

    public function isConfigured(): bool
    {
        return $this->client !== null;
    }

    public function canCheckout(Plan $plan, ?Company $company = null): bool
    {
        if (! $this->isConfigured() || $plan->isFree() || ! in_array($plan->interval, ['monthly', 'yearly'], true)) {
            return false;
        }

        $currency = $company ? PlanPricing::companyCurrency($company) : 'EUR';
        $priced = PlanPricing::resolve($plan, $currency);

        return (float) $priced['price'] > 0 && filled($priced['stripe_price_id']);
    }

    public function createCheckoutSession(Company $company, Plan $plan, string $successUrl, string $cancelUrl): array
    {
        if (! $this->canCheckout($plan, $company)) {
            throw new UnexpectedValueException('This plan cannot be purchased.');
        }

        $currency = PlanPricing::companyCurrency($company);
        $priced = PlanPricing::resolve($plan, $currency);
        $stripePriceId = $priced['stripe_price_id'];

        if (! filled($stripePriceId)) {
            $suffix = strtoupper($currency) === 'EUR' ? '' : '_'.strtoupper($currency);
            throw new UnexpectedValueException(
                'This plan is missing a Stripe price for '.$currency.'. Set STRIPE_PRICE_'.strtoupper($plan->family()).'_MONTHLY'.$suffix.' in the backend environment.'
            );
        }

        $customerId = $this->ensureCustomer($company);

        $payload = [
            'customer' => $customerId,
            'items' => [[
                'price' => $stripePriceId,
                'quantity' => 1,
            ]],
            'payment_behavior' => 'default_incomplete',
            'payment_settings' => [
                'save_default_payment_method' => 'on_subscription',
                'payment_method_types' => ['card'],
            ],
            'expand' => ['latest_invoice.confirmation_secret', 'latest_invoice.payment_intent'],
            'metadata' => [
                'company_id' => (string) $company->id,
                'plan_id' => (string) $plan->id,
            ],
        ];

        if ($plan->trial_days > 0) {
            $payload['trial_period_days'] = $plan->trial_days;
        }

        try {
            $stripeSubscription = $this->client()->subscriptions->create($payload);
        } catch (ApiErrorException $exception) {
            throw new UnexpectedValueException('Stripe checkout error: '.$exception->getMessage(), 0, $exception);
        }

        $clientSecret = $this->clientSecretFromSubscription($stripeSubscription);
        if (! filled($clientSecret)) {
            throw new UnexpectedValueException('Stripe did not return a payment secret for this subscription.');
        }

        return [
            'id' => $stripeSubscription->id,
            'client_secret' => $clientSecret,
            'publishable_key' => (string) config('services.stripe.key'),
            'provider' => 'stripe',
            'ui_mode' => 'react_elements',
            'amount' => (float) $priced['price'],
            'currency' => strtolower((string) $priced['currency']),
            'interval' => $plan->interval,
            'plan_name' => $plan->name,
        ];
    }

    public function confirmPayment(Company $company, string $reference): Subscription
    {
        if (str_starts_with($reference, 'cs_')) {
            return $this->confirmCheckoutSession($company, $reference);
        }

        if (str_starts_with($reference, 'sub_')) {
            return $this->confirmSubscriptionPayment($company, $reference);
        }

        throw new UnexpectedValueException('Unknown payment reference.');
    }

    public function confirmSubscriptionPayment(Company $company, string $stripeSubscriptionId): Subscription
    {
        try {
            $stripeSubscription = $this->client()->subscriptions->retrieve($stripeSubscriptionId, [
                'expand' => ['latest_invoice.confirmation_secret', 'latest_invoice.payment_intent'],
            ]);
        } catch (ApiErrorException $exception) {
            throw new UnexpectedValueException('Stripe confirm error: '.$exception->getMessage(), 0, $exception);
        }

        $metadata = json_decode(json_encode($stripeSubscription->metadata ?? []), true) ?: [];
        $subscriptionCompanyId = (int) ($metadata['company_id'] ?? 0);
        if ($subscriptionCompanyId !== (int) $company->id) {
            throw new UnexpectedValueException('Subscription does not belong to this company.');
        }

        $status = (string) ($stripeSubscription->status ?? '');
        if (! in_array($status, ['active', 'trialing'], true)) {
            $paymentIntent = $this->paymentIntentFromSubscription($stripeSubscription);
            $paymentStatus = is_object($paymentIntent) ? (string) ($paymentIntent->status ?? '') : '';
            if (! in_array($paymentStatus, ['succeeded', 'processing'], true)) {
                throw new UnexpectedValueException('Payment is not complete.');
            }
        }

        $planId = isset($metadata['plan_id']) ? (int) $metadata['plan_id'] : null;
        $subscription = $this->syncSubscriptionFromStripe($stripeSubscription, $company->id, $planId ?: null);

        $paymentIntent = $this->paymentIntentFromSubscription($stripeSubscription);
        $amount = null;
        $currency = 'eur';
        $paymentIntentId = $stripeSubscriptionId;

        if (is_object($paymentIntent)) {
            $amount = isset($paymentIntent->amount_received)
                ? ((int) $paymentIntent->amount_received) / 100
                : (isset($paymentIntent->amount) ? ((int) $paymentIntent->amount) / 100 : null);
            $currency = strtolower((string) ($paymentIntent->currency ?: 'eur'));
            $paymentIntentId = (string) ($paymentIntent->id ?: $stripeSubscriptionId);
        }

        if ($amount !== null) {
            Payment::query()->withoutGlobalScopes()->updateOrCreate(
                ['stripe_payment_intent_id' => $paymentIntentId],
                [
                    'company_id' => $company->id,
                    'subscription_id' => $subscription->id,
                    'provider' => 'stripe',
                    'provider_reference' => $stripeSubscriptionId,
                    'amount' => $amount,
                    'currency' => $currency,
                    'status' => 'succeeded',
                    'paid_at' => now(),
                    'meta' => [
                        'stripe_subscription_id' => $stripeSubscriptionId,
                        'source' => 'react_elements',
                    ],
                ]
            );
        }

        return $subscription;
    }

    protected function clientSecretFromSubscription(mixed $stripeSubscription): ?string
    {
        $invoice = $stripeSubscription->latest_invoice ?? null;
        if (is_string($invoice) && $invoice !== '') {
            try {
                $invoice = $this->client()->invoices->retrieve($invoice, [
                    'expand' => ['confirmation_secret', 'payment_intent'],
                ]);
            } catch (ApiErrorException) {
                $invoice = null;
            }
        }

        if (is_object($invoice)) {
            $confirmationSecret = $invoice->confirmation_secret->client_secret
                ?? (is_array($invoice->confirmation_secret ?? null) ? ($invoice->confirmation_secret['client_secret'] ?? null) : null);
            if (filled($confirmationSecret)) {
                return (string) $confirmationSecret;
            }
        }

        $paymentIntent = $this->paymentIntentFromSubscription($stripeSubscription);
        if (is_object($paymentIntent) && filled($paymentIntent->client_secret ?? null)) {
            return (string) $paymentIntent->client_secret;
        }

        return null;
    }

    protected function paymentIntentFromSubscription(mixed $stripeSubscription): mixed
    {
        $invoice = $stripeSubscription->latest_invoice ?? null;
        if (is_string($invoice) && $invoice !== '') {
            try {
                $invoice = $this->client()->invoices->retrieve($invoice, [
                    'expand' => ['payment_intent', 'confirmation_secret'],
                ]);
            } catch (ApiErrorException) {
                return null;
            }
        }

        if (! is_object($invoice)) {
            return null;
        }

        $paymentIntent = $invoice->payment_intent ?? null;
        if (is_string($paymentIntent) && $paymentIntent !== '') {
            try {
                return $this->client()->paymentIntents->retrieve($paymentIntent);
            } catch (ApiErrorException) {
                return null;
            }
        }

        if (is_object($paymentIntent)) {
            return $paymentIntent;
        }

        $confirmationSecret = $invoice->confirmation_secret->client_secret
            ?? (is_array($invoice->confirmation_secret ?? null) ? ($invoice->confirmation_secret['client_secret'] ?? null) : null);

        if (is_string($confirmationSecret) && preg_match('/^(pi_[A-Za-z0-9]+)_secret_/', $confirmationSecret, $matches) === 1) {
            try {
                return $this->client()->paymentIntents->retrieve($matches[1]);
            } catch (ApiErrorException) {
                return null;
            }
        }

        return null;
    }

    public function cancelSubscription(Subscription $subscription, bool $atPeriodEnd = true): Subscription
    {
        if (! $subscription->stripe_subscription_id) {
            $subscription->update([
                'status' => 'canceled',
                'canceled_at' => now(),
                'ended_at' => $atPeriodEnd ? $subscription->current_period_end : now(),
            ]);

            return $subscription->fresh('plan');
        }

        $stripeSubscription = $this->client()->subscriptions->update($subscription->stripe_subscription_id, [
            'cancel_at_period_end' => $atPeriodEnd,
        ]);

        if (! $atPeriodEnd) {
            $stripeSubscription = $this->client()->subscriptions->cancel($subscription->stripe_subscription_id);
        }

        return $this->syncSubscriptionFromStripe($stripeSubscription);
    }

    public function resumeSubscription(Subscription $subscription): Subscription
    {
        if (! $subscription->stripe_subscription_id) {
            $subscription->update([
                'status' => 'active',
                'cancel_at' => null,
                'canceled_at' => null,
                'ended_at' => null,
            ]);

            return $subscription->fresh('plan');
        }

        $stripeSubscription = $this->client()->subscriptions->update($subscription->stripe_subscription_id, [
            'cancel_at_period_end' => false,
        ]);

        return $this->syncSubscriptionFromStripe($stripeSubscription);
    }

    public function changePlan(Subscription $subscription, Plan $plan): Subscription
    {
        if ($plan->isFree()) {
            return $this->assignFreePlan($subscription->company ?? Company::query()->findOrFail($subscription->company_id));
        }

        if (! $this->isConfigured()) {
            throw new UnexpectedValueException('Stripe is not configured.');
        }

        $company = $subscription->company ?? Company::query()->findOrFail($subscription->company_id);
        $currency = PlanPricing::companyCurrency($company);
        $priced = PlanPricing::resolve($plan, $currency);
        $stripePriceId = $priced['stripe_price_id'];

        if (! filled($stripePriceId) || ! $subscription->stripe_subscription_id) {
            throw new UnexpectedValueException('Paid plan changes require an active Stripe subscription. Use Checkout to upgrade.');
        }

        $stripeSubscription = $this->client()->subscriptions->retrieve($subscription->stripe_subscription_id);
        $itemId = $stripeSubscription->items->data[0]->id ?? null;

        $updated = $this->client()->subscriptions->update($subscription->stripe_subscription_id, [
            'items' => [[
                'id' => $itemId,
                'price' => $stripePriceId,
            ]],
            'proration_behavior' => 'create_prorations',
            'metadata' => [
                'company_id' => $subscription->company_id,
                'plan_id' => $plan->id,
            ],
        ]);

        $subscription->update(['plan_id' => $plan->id]);

        return $this->syncSubscriptionFromStripe($updated);
    }

    public function handleWebhook(string $payload, ?string $signature): array
    {
        $secret = (string) config('services.stripe.webhook_secret');
        if ($secret === '') {
            throw new UnexpectedValueException('Stripe webhook secret is not configured.');
        }

        if (! $signature) {
            throw new UnexpectedValueException('Missing Stripe-Signature header.');
        }

        try {
            $event = Webhook::constructEvent($payload, $signature, $secret);
        } catch (SignatureVerificationException|UnexpectedValueException $exception) {
            Log::warning('Stripe webhook signature failed', ['error' => $exception->getMessage()]);
            throw $exception;
        }

        $eventId = is_array($event) ? ($event['id'] ?? null) : $event->id;
        $eventType = is_array($event) ? ($event['type'] ?? null) : $event->type;
        $eventData = json_decode($payload, true);

        if (! $eventId) {
            throw new UnexpectedValueException('Stripe webhook missing event id.');
        }

        $existing = StripeWebhookEvent::query()->where('stripe_event_id', $eventId)->first();
        if ($existing?->processed_at) {
            return ['status' => 'duplicate', 'event_id' => $eventId];
        }

        try {
            $webhookEvent = $existing ?? StripeWebhookEvent::query()->create([
                'stripe_event_id' => $eventId,
                'type' => $eventType,
                'payload' => $eventData,
            ]);
        } catch (\Illuminate\Database\UniqueConstraintViolationException) {
            return ['status' => 'duplicate', 'event_id' => $eventId];
        }

        $processed = false;

        DB::transaction(function () use ($eventType, $eventData, $webhookEvent, &$processed) {
            $locked = StripeWebhookEvent::query()
                ->whereKey($webhookEvent->id)
                ->lockForUpdate()
                ->first();

            if (! $locked || $locked->processed_at) {
                return;
            }

            match ($eventType) {
                'checkout.session.completed' => $this->handleCheckoutSessionCompleted($eventData['data']['object'] ?? []),
                'customer.subscription.created',
                'customer.subscription.updated' => $this->handleSubscriptionUpdated($eventData['data']['object'] ?? []),
                'customer.subscription.deleted' => $this->handleSubscriptionDeleted($eventData['data']['object'] ?? []),
                'invoice.paid',
                'invoice.payment_succeeded' => $this->handleInvoicePaid($eventData['data']['object'] ?? []),
                'invoice.payment_failed' => $this->handleInvoicePaymentFailed($eventData['data']['object'] ?? []),
                default => null,
            };

            $locked->update(['processed_at' => now()]);
            $processed = true;
        });

        return [
            'status' => $processed ? 'processed' : 'duplicate',
            'event_id' => $eventId,
            'type' => $eventType,
        ];
    }

    protected function handleCheckoutSessionCompleted(array $session): void
    {
        $companyId = $session['metadata']['company_id'] ?? $session['client_reference_id'] ?? null;
        $planId = $session['metadata']['plan_id'] ?? null;
        $stripeSubscriptionId = $session['subscription'] ?? null;

        if (! $companyId || ! $stripeSubscriptionId) {
            return;
        }

        $stripeSubscription = $this->client()->subscriptions->retrieve($stripeSubscriptionId);
        $this->syncSubscriptionFromStripe($stripeSubscription, $companyId ? (int) $companyId : null, $planId ? (int) $planId : null);
    }

    protected function handleSubscriptionUpdated(array $object): void
    {
        $this->syncSubscriptionFromStripe((object) $object);
    }

    protected function handleSubscriptionDeleted(array $object): void
    {
        $subscription = Subscription::query()
            ->withoutGlobalScopes()
            ->where('stripe_subscription_id', $object['id'] ?? null)
            ->first();

        if (! $subscription) {
            return;
        }

        $subscription->update([
            'status' => 'canceled',
            'canceled_at' => now(),
            'ended_at' => now(),
        ]);
    }

    protected function handleInvoicePaid(array $invoice): void
    {
        $customerId = $invoice['customer'] ?? null;
        $company = Company::query()->where('stripe_customer_id', $customerId)->first();
        if (! $company) {
            return;
        }

        $subscription = null;
        if (! empty($invoice['subscription'])) {
            $subscription = Subscription::query()
                ->withoutGlobalScopes()
                ->where('stripe_subscription_id', $invoice['subscription'])
                ->first();
        }

        BillingInvoice::query()->updateOrCreate(
            ['stripe_invoice_id' => $invoice['id']],
            [
                'company_id' => $company->id,
                'subscription_id' => $subscription?->id,
                'number' => $invoice['number'] ?? null,
                'amount_due' => ($invoice['amount_due'] ?? 0) / 100,
                'amount_paid' => ($invoice['amount_paid'] ?? 0) / 100,
                'currency' => $invoice['currency'] ?? 'eur',
                'status' => $invoice['status'] ?? 'paid',
                'hosted_invoice_url' => $invoice['hosted_invoice_url'] ?? null,
                'invoice_pdf' => $invoice['invoice_pdf'] ?? null,
                'period_start' => isset($invoice['period_start']) ? Carbon::createFromTimestamp($invoice['period_start']) : null,
                'period_end' => isset($invoice['period_end']) ? Carbon::createFromTimestamp($invoice['period_end']) : null,
                'paid_at' => now(),
            ]
        );

        Payment::query()->updateOrCreate(
            ['stripe_invoice_id' => $invoice['id']],
            [
                'company_id' => $company->id,
                'subscription_id' => $subscription?->id,
                'stripe_payment_intent_id' => $invoice['payment_intent'] ?? null,
                'amount' => ($invoice['amount_paid'] ?? 0) / 100,
                'currency' => $invoice['currency'] ?? 'eur',
                'status' => 'succeeded',
                'paid_at' => now(),
                'meta' => ['stripe_invoice' => $invoice['id']],
            ]
        );
    }

    protected function handleInvoicePaymentFailed(array $invoice): void
    {
        $customerId = $invoice['customer'] ?? null;
        $company = Company::query()->where('stripe_customer_id', $customerId)->first();
        if (! $company) {
            return;
        }

        $subscription = null;
        if (! empty($invoice['subscription'])) {
            $subscription = Subscription::query()
                ->withoutGlobalScopes()
                ->where('stripe_subscription_id', $invoice['subscription'])
                ->first();

            if ($subscription) {
                $subscription->update(['status' => 'past_due']);
            }
        }

        BillingInvoice::query()->updateOrCreate(
            ['stripe_invoice_id' => $invoice['id']],
            [
                'company_id' => $company->id,
                'subscription_id' => $subscription?->id,
                'number' => $invoice['number'] ?? null,
                'amount_due' => ($invoice['amount_due'] ?? 0) / 100,
                'amount_paid' => ($invoice['amount_paid'] ?? 0) / 100,
                'currency' => $invoice['currency'] ?? 'eur',
                'status' => $invoice['status'] ?? 'open',
                'hosted_invoice_url' => $invoice['hosted_invoice_url'] ?? null,
                'invoice_pdf' => $invoice['invoice_pdf'] ?? null,
            ]
        );
    }

    /**
     * @param  mixed  $stripeSubscription  Stripe subscription object or webhook array payload
     */
    public function syncSubscriptionFromStripe(mixed $stripeSubscription, ?int $companyId = null, ?int $planId = null): Subscription
    {
        if (! is_array($stripeSubscription) && ! is_object($stripeSubscription)) {
            throw new UnexpectedValueException('Invalid Stripe subscription payload.');
        }

        $data = is_array($stripeSubscription)
            ? $stripeSubscription
            : json_decode(json_encode($stripeSubscription), true);

        if (! is_array($data)) {
            throw new UnexpectedValueException('Unable to normalize Stripe subscription payload.');
        }

        $companyId = $companyId
            ?? ($data['metadata']['company_id'] ?? null)
            ?? Company::query()->where('stripe_customer_id', $data['customer'] ?? null)->value('id');

        $planId = $planId
            ?? ($data['metadata']['plan_id'] ?? null)
            ?? PlanPricing::planIdFromStripePriceId($data['items']['data'][0]['price']['id'] ?? null);

        if (! $companyId || ! $planId) {
            throw new UnexpectedValueException('Unable to resolve company/plan for Stripe subscription.');
        }

        $customerId = $data['customer'] ?? null;
        if ($customerId) {
            $customerCompanyId = Company::query()->where('stripe_customer_id', $customerId)->value('id');
            if ($customerCompanyId && (int) $customerCompanyId !== (int) $companyId) {
                throw new UnexpectedValueException('Stripe customer does not belong to this company.');
            }
        }

        $existing = Subscription::query()
            ->withoutGlobalScopes()
            ->where('stripe_subscription_id', $data['id'])
            ->first();

        if ($existing && (int) $existing->company_id !== (int) $companyId) {
            throw new UnexpectedValueException('Stripe subscription already belongs to another company.');
        }

        $subscription = $existing ?: Subscription::query()
            ->withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->latest('id')
            ->first();

        $payload = [
            'company_id' => $companyId,
            'plan_id' => $planId,
            'provider' => 'stripe',
            'stripe_subscription_id' => $data['id'],
            'status' => $data['status'] ?? 'active',
            'current_period_start' => isset($data['current_period_start']) ? Carbon::createFromTimestamp($data['current_period_start']) : null,
            'current_period_end' => isset($data['current_period_end']) ? Carbon::createFromTimestamp($data['current_period_end']) : null,
            'cancel_at' => isset($data['cancel_at']) ? Carbon::createFromTimestamp($data['cancel_at']) : null,
            'canceled_at' => isset($data['canceled_at']) ? Carbon::createFromTimestamp($data['canceled_at']) : null,
            'ended_at' => isset($data['ended_at']) ? Carbon::createFromTimestamp($data['ended_at']) : null,
            'trial_ends_at' => isset($data['trial_end']) ? Carbon::createFromTimestamp($data['trial_end']) : null,
        ];

        if ($subscription) {
            $subscription->update($payload);
        } else {
            $subscription = Subscription::query()->withoutGlobalScopes()->create($payload);
        }

        $items = $data['items']['data'] ?? [];
        foreach ($items as $item) {
            if (empty($item['id'])) {
                continue;
            }

            SubscriptionItem::query()->updateOrCreate(
                ['stripe_subscription_item_id' => $item['id']],
                [
                    'subscription_id' => $subscription->id,
                    'stripe_price_id' => $item['price']['id'] ?? null,
                    'quantity' => $item['quantity'] ?? 1,
                ]
            );
        }

        return $subscription->fresh('plan');
    }

    public function assignFreePlan(Company $company, ?Plan $plan = null): Subscription
    {
        $plan = $plan ?? Plan::query()->where('slug', 'free')->where('is_active', true)->firstOrFail();
        if (! $plan->isFree() || $plan->isFreeUltra() || ! $plan->isPublic()) {
            throw new UnexpectedValueException('Only the public Free plan can be assigned without Stripe.');
        }

        return $this->assignPlan($company, $plan);
    }

    /**
     * Start a card-free Pro trial (default 7 days). After expiry, entitlements fall back to Free.
     */
    public function startComplimentaryTrial(Company $company, ?int $days = null): Subscription
    {
        $days = $days ?? max(1, (int) config('billing.trial_days', 7));
        $planSlug = (string) config('billing.trial_plan', 'pro');
        $plan = Plan::query()->where('slug', $planSlug)->where('is_active', true)->first()
            ?? Plan::query()->where('slug', 'pro')->where('is_active', true)->firstOrFail();

        if ($plan->isFree()) {
            throw new UnexpectedValueException('Trial plan must be a paid catalog plan.');
        }

        $subscription = Subscription::query()
            ->withoutGlobalScopes()
            ->where('company_id', $company->id)
            ->latest('id')
            ->first();

        $payload = [
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'provider' => 'trial',
            'status' => 'trialing',
            'stripe_subscription_id' => null,
            'current_period_start' => now(),
            'current_period_end' => now()->addDays($days),
            'trial_ends_at' => now()->addDays($days),
            'canceled_at' => null,
            'ended_at' => null,
            'cancel_at' => null,
        ];

        if ($subscription) {
            $subscription->update($payload);

            return $subscription->fresh('plan');
        }

        return Subscription::query()->withoutGlobalScopes()->create($payload)->fresh('plan');
    }

    public function assignPlan(Company $company, Plan $plan): Subscription
    {
        if (! $plan->isFree()) {
            throw new UnexpectedValueException('Paid plans can only be activated after a verified payment.');
        }

        $subscription = Subscription::query()
            ->withoutGlobalScopes()
            ->where('company_id', $company->id)
            ->latest('id')
            ->first();

        $payload = [
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'provider' => 'free',
            'status' => 'active',
            'stripe_subscription_id' => null,
            'current_period_start' => now(),
            'current_period_end' => null,
            'trial_ends_at' => null,
            'canceled_at' => null,
            'ended_at' => null,
            'cancel_at' => null,
        ];

        if ($subscription?->stripe_subscription_id && $this->isConfigured()) {
            $this->client()->subscriptions->cancel($subscription->stripe_subscription_id);
        }

        if ($subscription) {
            $subscription->update($payload);

            return $subscription->fresh('plan');
        }

        return Subscription::query()->withoutGlobalScopes()->create($payload)->fresh('plan');
    }

    /**
     * Platform-admin gift: paid plan without Stripe (forever or for N days).
     */
    public function grantComplimentaryPlan(Company $company, Plan $plan, ?int $days = null): Subscription
    {
        if ($plan->isFree()) {
            throw new UnexpectedValueException('Choose a paid plan to gift.');
        }

        if (! $plan->is_active) {
            throw new UnexpectedValueException('That plan is not active.');
        }

        $subscription = Subscription::query()
            ->withoutGlobalScopes()
            ->where('company_id', $company->id)
            ->latest('id')
            ->first();

        if ($subscription?->stripe_subscription_id && $this->isConfigured()) {
            try {
                $this->client()->subscriptions->cancel($subscription->stripe_subscription_id);
            } catch (ApiErrorException) {
                // Local/test: still apply the grant even if Stripe cancel fails.
            }
        }

        $endsAt = $days !== null && $days > 0 ? now()->addDays($days) : null;

        $payload = [
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'provider' => 'complimentary',
            'status' => 'active',
            'stripe_subscription_id' => null,
            'current_period_start' => now(),
            'current_period_end' => $endsAt,
            'trial_ends_at' => null,
            'canceled_at' => null,
            'ended_at' => null,
            'cancel_at' => null,
        ];

        if ($subscription) {
            $subscription->update($payload);

            return $subscription->fresh('plan');
        }

        return Subscription::query()->withoutGlobalScopes()->create($payload)->fresh('plan');
    }

    public function confirmCheckoutSession(Company $company, string $sessionId): Subscription
    {
        try {
            $session = $this->client()->checkout->sessions->retrieve($sessionId, [
                'expand' => ['subscription'],
            ]);
        } catch (ApiErrorException $exception) {
            throw new UnexpectedValueException('Stripe confirm error: '.$exception->getMessage(), 0, $exception);
        }

        $metadata = json_decode(json_encode($session->metadata ?? []), true) ?: [];
        $sessionCompanyId = (int) ($metadata['company_id'] ?? $session->client_reference_id ?? 0);
        if ($sessionCompanyId !== (int) $company->id) {
            throw new UnexpectedValueException('Checkout session does not belong to this company.');
        }

        $isComplete = in_array((string) $session->status, ['complete'], true)
            || in_array((string) $session->payment_status, ['paid', 'no_payment_required'], true);

        if (! $isComplete) {
            throw new UnexpectedValueException('Payment is not complete.');
        }

        $stripeSubscription = $session->subscription;
        if (is_string($stripeSubscription) && $stripeSubscription !== '') {
            try {
                $stripeSubscription = $this->client()->subscriptions->retrieve($stripeSubscription);
            } catch (ApiErrorException $exception) {
                throw new UnexpectedValueException('Stripe subscription error: '.$exception->getMessage(), 0, $exception);
            }
        }

        // Stripe sometimes returns the session before the subscription object is ready.
        if (! $stripeSubscription) {
            for ($attempt = 0; $attempt < 4; $attempt++) {
                usleep(400000);
                try {
                    $session = $this->client()->checkout->sessions->retrieve($sessionId, [
                        'expand' => ['subscription'],
                    ]);
                } catch (ApiErrorException $exception) {
                    throw new UnexpectedValueException('Stripe confirm error: '.$exception->getMessage(), 0, $exception);
                }

                $stripeSubscription = $session->subscription;
                if (is_string($stripeSubscription) && $stripeSubscription !== '') {
                    $stripeSubscription = $this->client()->subscriptions->retrieve($stripeSubscription);
                }
                if ($stripeSubscription) {
                    break;
                }
            }
        }

        if (! $stripeSubscription) {
            throw new UnexpectedValueException('No Stripe subscription found for this checkout.');
        }

        $planId = isset($metadata['plan_id']) ? (int) $metadata['plan_id'] : null;
        $subscription = $this->syncSubscriptionFromStripe($stripeSubscription, $company->id, $planId ?: null);

        $amountTotal = isset($session->amount_total) ? ((int) $session->amount_total) / 100 : null;
        if ($amountTotal !== null) {
            Payment::query()->withoutGlobalScopes()->updateOrCreate(
                ['stripe_payment_intent_id' => (string) ($session->payment_intent ?: $session->id)],
                [
                    'company_id' => $company->id,
                    'subscription_id' => $subscription->id,
                    'provider' => 'stripe',
                    'provider_reference' => $session->id,
                    'amount' => $amountTotal,
                    'currency' => strtolower((string) ($session->currency ?: 'eur')),
                    'status' => 'succeeded',
                    'paid_at' => now(),
                    'meta' => [
                        'checkout_session_id' => $session->id,
                        'payment_status' => $session->payment_status,
                    ],
                ]
            );
        }

        return $subscription;
    }

    public function revokeUnpaidPaidPlans(): int
    {
        $free = Plan::query()->where('slug', 'free')->first();
        if (! $free) {
            return 0;
        }

        $paidPlanIds = Plan::query()->where('price', '>', 0)->pluck('id');

        return Subscription::query()
            ->withoutGlobalScopes()
            ->whereIn('plan_id', $paidPlanIds)
            ->where(function ($query) {
                $query->whereNull('stripe_subscription_id')
                    ->orWhere('stripe_subscription_id', '');
            })
            ->where('provider', '!=', 'complimentary')
            ->where(function ($query) {
                $query->where('provider', '!=', 'trial')
                    ->orWhereNull('trial_ends_at')
                    ->orWhere('trial_ends_at', '<=', now());
            })
            ->update([
                'plan_id' => $free->id,
                'provider' => 'free',
                'status' => 'active',
                'stripe_subscription_id' => null,
                'trial_ends_at' => null,
            ]);
    }
    protected function withCheckoutSessionPlaceholder(string $url): string
    {
        if (str_contains($url, '{CHECKOUT_SESSION_ID}')) {
            return $url;
        }

        $separator = str_contains($url, '?') ? '&' : '?';

        return $url.$separator.'session_id={CHECKOUT_SESSION_ID}';
    }
}
