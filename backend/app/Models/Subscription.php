<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'plan_id',
        'stripe_subscription_id',
        'provider',
        'status',
        'current_period_start',
        'current_period_end',
        'cancel_at',
        'canceled_at',
        'ended_at',
        'trial_ends_at',
    ];

    protected function casts(): array
    {
        return [
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
            'cancel_at' => 'datetime',
            'canceled_at' => 'datetime',
            'ended_at' => 'datetime',
            'trial_ends_at' => 'datetime',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SubscriptionItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function billingInvoices(): HasMany
    {
        return $this->hasMany(BillingInvoice::class);
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['active', 'trialing'], true);
    }

    public function hasVerifiedPayment(): bool
    {
        return filled($this->stripe_subscription_id);
    }

    public function isComplimentaryTrial(): bool
    {
        return $this->provider === 'trial'
            && $this->status === 'trialing'
            && $this->trial_ends_at
            && $this->trial_ends_at->isFuture();
    }

    public function isComplimentaryGrant(): bool
    {
        return $this->provider === 'complimentary'
            && in_array($this->status, ['active', 'trialing'], true);
    }

    public function isComplimentaryGrantExpired(): bool
    {
        return $this->provider === 'complimentary'
            && $this->current_period_end
            && $this->current_period_end->isPast();
    }

    public function isTrialExpired(): bool
    {
        return $this->provider === 'trial'
            && $this->trial_ends_at
            && $this->trial_ends_at->isPast();
    }

    public function isWithinPaidPeriod(): bool
    {
        if (! $this->current_period_end) {
            return true;
        }

        return $this->current_period_end->isFuture();
    }
}