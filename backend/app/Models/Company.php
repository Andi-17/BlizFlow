<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'industry',
        'tagline',
        'logo_path',
        'email',
        'phone',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'opening_hours',
        'stripe_customer_id',
        'is_active',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_public' => 'boolean',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot(['role_id', 'is_owner', 'status'])
            ->withTimestamps();
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(CompanyUser::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->withoutGlobalScopes()->latestOfMany();
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->withoutGlobalScopes();
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(CompanySetting::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function billingInvoices(): HasMany
    {
        return $this->hasMany(BillingInvoice::class);
    }

    public function hasActiveSubscription(): bool
    {
        $subscription = $this->subscription;

        if (! $subscription) {
            return false;
        }

        return in_array($subscription->status, ['active', 'trialing', 'past_due'], true)
            && (
                $subscription->plan?->isFree()
                || $subscription->isComplimentaryTrial()
                || ($subscription->isComplimentaryGrant() && $subscription->isWithinPaidPeriod())
                || ($subscription->hasVerifiedPayment() && $subscription->isWithinPaidPeriod())
            );
    }

    public function ownerUser(): ?User
    {
        return $this->users()
            ->wherePivot('is_owner', true)
            ->wherePivot('status', 'active')
            ->first();
    }

    public function contactEmail(): ?string
    {
        if (filled($this->email)) {
            return (string) $this->email;
        }

        return $this->ownerUser()?->email;
    }
}
