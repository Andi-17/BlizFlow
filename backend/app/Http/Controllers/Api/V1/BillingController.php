<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Billing\ChangePlanRequest;
use App\Http\Requests\Api\Billing\CheckoutRequest;
use App\Http\Requests\Api\Billing\ConfirmCheckoutRequest;
use App\Http\Requests\Api\Billing\PortalRequest;
use App\Http\Resources\BillingInvoiceResource;
use App\Http\Resources\SubscriptionResource;
use App\Models\BillingInvoice;
use App\Models\Plan;
use App\Services\Billing\StripeService;
use App\Services\TenantContext;
use App\Support\CheckoutRedirectGuard;
use Illuminate\Http\Request;
use UnexpectedValueException;

class BillingController extends Controller
{
    public function subscription(TenantContext $tenantContext)
    {
        $company = $tenantContext->company();
        $subscription = $company->subscription?->load('plan');

        return $this->success($subscription ? new SubscriptionResource($subscription) : null);
    }

    public function invoices(Request $request, TenantContext $tenantContext)
    {
        $invoices = BillingInvoice::query()
            ->where('company_id', $tenantContext->companyId())
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->success(BillingInvoiceResource::collection($invoices)->response()->getData(true));
    }

    public function portal(
        PortalRequest $request,
        TenantContext $tenantContext,
        StripeService $stripeService,
    ) {
        if (! $stripeService->isConfigured()) {
            return $this->error('Stripe is not configured.', 503);
        }

        $returnUrl = $request->string('return_url')->toString();
        if (! CheckoutRedirectGuard::allowed($returnUrl)) {
            return $this->error('Portal return URL is not allowed.', 422);
        }

        try {
            $portal = $stripeService->createBillingPortalSession(
                $tenantContext->company(),
                $returnUrl,
            );
        } catch (UnexpectedValueException $exception) {
            return $this->error($exception->getMessage(), 422);
        }

        return $this->success([
            'mode' => 'portal',
            'portal' => $portal,
        ], 'Stripe portal ready');
    }

    public function checkout(
        CheckoutRequest $request,
        TenantContext $tenantContext,
        StripeService $stripeService,
    ) {
        $plan = Plan::query()->where('is_active', true)->findOrFail($request->integer('plan_id'));
        $company = $tenantContext->company();
        $successUrl = $request->string('success_url')->toString();
        $cancelUrl = $request->string('cancel_url')->toString();

        if (! CheckoutRedirectGuard::allowed($successUrl) || ! CheckoutRedirectGuard::allowed($cancelUrl)) {
            return $this->error('Checkout return URLs are not allowed.', 422);
        }

        if ($plan->isFree()) {
            if (! $plan->isPublic() || $plan->isFreeUltra()) {
                return $this->error('This plan can only be assigned by the creator via Stripe.', 422);
            }

            $subscription = $stripeService->assignFreePlan($company, $plan);

            return $this->success([
                'mode' => 'free',
                'subscription' => new SubscriptionResource($subscription->load('plan')),
            ], 'Switched to free plan');
        }

        if (! $stripeService->isConfigured()) {
            return $this->error('Stripe is not configured. Add STRIPE_SECRET from your Stripe test account.', 503);
        }

        try {
            $session = $stripeService->createCheckoutSession($company, $plan, $successUrl, $cancelUrl);
        } catch (UnexpectedValueException $exception) {
            return $this->error($exception->getMessage(), 422);
        }

        return $this->success(['mode' => 'checkout', 'checkout' => $session]);
    }

    public function confirm(
        ConfirmCheckoutRequest $request,
        TenantContext $tenantContext,
        StripeService $stripeService,
    ) {
        $sessionId = $request->string('session_id')->toString();
        $company = $tenantContext->company();

        try {
            $subscription = $stripeService->confirmPayment($company, $sessionId);
        } catch (UnexpectedValueException $exception) {
            return $this->error($exception->getMessage(), 422);
        }

        return $this->success(new SubscriptionResource($subscription->load('plan')), 'Payment confirmed');
    }

    public function cancel(Request $request, TenantContext $tenantContext, StripeService $stripeService)
    {
        $subscription = $tenantContext->company()->subscription;
        if (! $subscription) {
            return $this->error('No active subscription found.', 404);
        }

        try {
            $subscription = $stripeService->cancelSubscription($subscription, $request->boolean('at_period_end', true));
        } catch (UnexpectedValueException $exception) {
            return $this->error($exception->getMessage(), 422);
        }

        return $this->success(new SubscriptionResource($subscription->load('plan')), 'Subscription canceled');
    }

    public function resume(TenantContext $tenantContext, StripeService $stripeService)
    {
        $subscription = $tenantContext->company()->subscription;
        if (! $subscription) {
            return $this->error('No subscription found.', 404);
        }

        try {
            $subscription = $stripeService->resumeSubscription($subscription);
        } catch (UnexpectedValueException $exception) {
            return $this->error($exception->getMessage(), 422);
        }

        return $this->success(new SubscriptionResource($subscription->load('plan')), 'Subscription resumed');
    }

    public function changePlan(ChangePlanRequest $request, TenantContext $tenantContext, StripeService $stripeService)
    {
        $subscription = $tenantContext->company()->subscription;
        if (! $subscription) {
            return $this->error('No subscription found.', 404);
        }

        $plan = Plan::query()->where('is_active', true)->findOrFail($request->integer('plan_id'));

        if (! $plan->isFree() && ! $subscription->hasVerifiedPayment()) {
            return $this->error('Upgrade to a paid plan through Checkout.', 422);
        }

        try {
            $subscription = $stripeService->changePlan($subscription, $plan);
        } catch (UnexpectedValueException $exception) {
            return $this->error($exception->getMessage(), 422);
        }

        return $this->success(new SubscriptionResource($subscription->load('plan')), 'Plan changed');
    }
}
