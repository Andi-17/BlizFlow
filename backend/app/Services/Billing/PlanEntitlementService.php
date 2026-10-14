<?php

namespace App\Services\Billing;

use App\Models\Company;
use App\Models\CompanyUser;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class PlanEntitlementService
{
    public function freePlan(): Plan
    {
        return Plan::query()->where('slug', 'free')->where('is_active', true)->first()
            ?? Plan::query()->where('slug', 'free')->firstOrFail();
    }

    public function planForCompany(Company $company): Plan
    {
        $this->expireComplimentaryTrialIfNeeded($company);
        $this->expireComplimentaryGrantIfNeeded($company);

        $subscription = $company->fresh(['subscription.plan'])?->subscription
            ?? $company->subscription;

        if (! $this->isPaidOrFreeActive($subscription)) {
            return $this->freePlan();
        }

        $plan = $subscription->plan ?: $subscription->plan()->first();

        return $plan ?: $this->freePlan();
    }

    public function expireComplimentaryTrialIfNeeded(Company $company): void
    {
        $subscription = $company->subscription;
        if (! $subscription || ! $subscription->isTrialExpired()) {
            return;
        }

        if ($subscription->hasVerifiedPayment()) {
            return;
        }

        app(StripeService::class)->assignFreePlan($company);
        $company->unsetRelation('subscription');

        \App\Models\CompanySetting::query()->updateOrCreate(
            [
                'company_id' => $company->id,
                'key' => 'trial_ended_pending',
            ],
            ['value' => '1'],
        );
    }

    public function expireComplimentaryGrantIfNeeded(Company $company): void
    {
        $subscription = $company->subscription;
        if (! $subscription || ! $subscription->isComplimentaryGrantExpired()) {
            return;
        }

        if ($subscription->hasVerifiedPayment()) {
            return;
        }

        app(StripeService::class)->assignFreePlan($company);
        $company->unsetRelation('subscription');
    }

    public function highestOwnedPlan(User $user): Plan
    {
        $companyIds = CompanyUser::query()
            ->where('user_id', $user->id)
            ->where('is_owner', true)
            ->where('status', 'active')
            ->pluck('company_id');

        if ($companyIds->isEmpty()) {
            return $this->freePlan();
        }

        $plans = Subscription::query()
            ->withoutGlobalScopes()
            ->whereIn('company_id', $companyIds)
            ->with('plan')
            ->get()
            ->filter(fn (Subscription $subscription) => $this->isPaidOrFreeActive($subscription))
            ->map(fn (Subscription $subscription) => $subscription->plan)
            ->filter();

        if ($plans->isEmpty()) {
            return $this->freePlan();
        }

        return $plans->sortByDesc(fn (Plan $plan) => (float) $plan->price)->first() ?? $this->freePlan();
    }

    public function maxOwnedCompanies(User $user): int
    {
        return $this->highestOwnedPlan($user)->maxCompanies();
    }

    public function canCreateCompany(User $user): bool
    {
        $plan = $this->highestOwnedPlan($user);
        if ($plan->allowsUnlimitedCompanies()) {
            return true;
        }

        $owned = CompanyUser::query()
            ->where('user_id', $user->id)
            ->where('is_owner', true)
            ->where('status', 'active')
            ->count();

        return $owned < $plan->maxCompanies();
    }

    public function assertCanCreateCompany(User $user): void
    {
        if ($this->canCreateCompany($user)) {
            return;
        }

        $plan = $this->highestOwnedPlan($user);
        $maxCompanies = $plan->maxCompanies();

        throw ValidationException::withMessages([
            'name' => [
                $plan->isFree()
                    ? 'Free includes '.$maxCompanies.' company. Upgrade to Pro to open more workspaces.'
                    : 'Your current plan allows '.$maxCompanies.' companies. Upgrade to Business for more.',
            ],
        ]);
    }

    public function canInvite(Company $company): bool
    {
        $plan = $this->planForCompany($company);
        if ($plan->allowsUnlimitedUsers()) {
            return true;
        }

        return $this->activeMemberCount($company) < $plan->maxUsers();
    }

    public function assertCanInvite(Company $company): void
    {
        if ($this->canInvite($company)) {
            return;
        }

        $plan = $this->planForCompany($company);
        $maxUsers = $plan->maxUsers();

        throw ValidationException::withMessages([
            'email' => [
                $plan->isFree()
                    ? 'Free includes up to '.$maxUsers.' people. Upgrade to Pro for a larger team.'
                    : 'This plan allows up to '.$maxUsers.' people. Upgrade to Business for unlimited seats.',
            ],
        ]);
    }

    public function canViewReports(Company $company): bool
    {
        return $this->planForCompany($company)->allowsReports();
    }

    public function activeMemberCount(Company $company): int
    {
        return CompanyUser::query()
            ->where('company_id', $company->id)
            ->where('status', 'active')
            ->count();
    }

    /**
     * @return array{owned_companies: int, max_companies: int, can_create: bool, plan: string}
     */
    public function companyLimitsForUser(User $user): array
    {
        $owned = CompanyUser::query()
            ->where('user_id', $user->id)
            ->where('is_owner', true)
            ->where('status', 'active')
            ->count();
        $plan = $this->highestOwnedPlan($user);

        return [
            'owned_companies' => $owned,
            'max_companies' => $plan->maxCompanies(),
            'can_create' => $this->canCreateCompany($user),
            'plan' => $plan->slug,
        ];
    }

    protected function isPaidOrFreeActive(?Subscription $subscription): bool
    {
        if (! $subscription || ! in_array($subscription->status, ['active', 'trialing', 'past_due'], true)) {
            return false;
        }

        $plan = $subscription->plan ?: $subscription->plan()->first();
        if (! $plan) {
            return false;
        }

        if ($plan->isFree()) {
            return true;
        }

        if ($subscription->isComplimentaryTrial()) {
            return true;
        }

        if ($subscription->isComplimentaryGrant()) {
            return $subscription->isWithinPaidPeriod();
        }

        return $subscription->hasVerifiedPayment() && $subscription->isWithinPaidPeriod();
    }
}