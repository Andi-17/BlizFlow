<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $trialEndsAt = $this->trial_ends_at;
        $isTrialing = $this->resource->isComplimentaryTrial();
        $isComplimentary = $this->resource->isComplimentaryGrant();
        $trialExpired = $this->resource->isTrialExpired() && ! $this->resource->hasVerifiedPayment();
        $daysLeft = null;
        if ($isTrialing && $trialEndsAt) {
            $daysLeft = (int) ceil(now()->floatDiffInDays($trialEndsAt, false));
            if ($daysLeft < 1 && $trialEndsAt->isFuture()) {
                $daysLeft = 1;
            }
            $daysLeft = max(0, $daysLeft);
        } elseif ($isComplimentary && $this->current_period_end) {
            $daysLeft = (int) ceil(now()->floatDiffInDays($this->current_period_end, false));
            if ($daysLeft < 1 && $this->current_period_end->isFuture()) {
                $daysLeft = 1;
            }
            $daysLeft = max(0, $daysLeft);
        }

        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'company' => new CompanyResource($this->whenLoaded('company')),
            'status' => $this->status,
            'provider' => $this->provider ?: (filled($this->stripe_subscription_id) ? 'stripe' : 'free'),
            'stripe_subscription_id' => $this->stripe_subscription_id,
            'current_period_start' => $this->current_period_start,
            'current_period_end' => $this->current_period_end,
            'cancel_at' => $this->cancel_at,
            'canceled_at' => $this->canceled_at,
            'trial_ends_at' => $this->trial_ends_at,
            'is_trialing' => $isTrialing,
            'is_complimentary' => $isComplimentary,
            'trial_expired' => $trialExpired,
            'trial_days_left' => $daysLeft,
            'plan' => new PlanResource($this->whenLoaded('plan')),
            'created_at' => $this->created_at,
        ];
    }
}
