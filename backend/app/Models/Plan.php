<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'interval',
        'price',
        'currency',
        'stripe_price_id',
        'stripe_product_id',
        'features',
        'is_active',
        'is_public',
        'sort_order',
        'trial_days',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'features' => 'array',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'sort_order' => 'integer',
            'trial_days' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function isFree(): bool
    {
        return (float) $this->price <= 0;
    }

    public function isPublic(): bool
    {
        return $this->is_public !== false;
    }

    public function isFreeUltra(): bool
    {
        return $this->slug === 'free-ultra' || str_contains((string) $this->slug, 'free-ultra');
    }

    public function family(): string
    {
        $slug = (string) $this->slug;
        if ($this->isFreeUltra()) {
            return 'free_ultra';
        }
        if (str_contains($slug, 'business')) {
            return 'business';
        }
        if (str_contains($slug, 'pro')) {
            return 'pro';
        }
        if ($this->isFree() || str_contains($slug, 'free')) {
            return 'free';
        }

        return 'custom';
    }

    public function isFeatured(): bool
    {
        return $this->family() === 'pro';
    }

    /**
     * @return list<string>
     */
    public function highlightItems(): array
    {
        $features = is_array($this->features) ? $this->features : [];
        if (isset($features['items']) && is_array($features['items'])) {
            return array_values(array_filter($features['items'], 'is_string'));
        }

        return array_values(array_filter($features, 'is_string'));
    }

    /**
     * @return array{max_companies: int, max_users: int, reports: bool}
     */
    public function limits(): array
    {
        $features = is_array($this->features) ? $this->features : [];
        $defaults = match ($this->family()) {
            'free_ultra', 'business' => ['max_companies' => 10, 'max_users' => 0, 'reports' => true],
            'pro' => ['max_companies' => 3, 'max_users' => 15, 'reports' => true],
            default => ['max_companies' => 1, 'max_users' => 3, 'reports' => false],
        };

        return [
            'max_companies' => (int) ($features['max_companies'] ?? $defaults['max_companies']),
            'max_users' => (int) ($features['max_users'] ?? $defaults['max_users']),
            'reports' => (bool) ($features['reports'] ?? $defaults['reports']),
        ];
    }

    public function maxCompanies(): int
    {
        return $this->limits()['max_companies'];
    }

    public function maxUsers(): int
    {
        return $this->limits()['max_users'];
    }

    public function allowsUnlimitedUsers(): bool
    {
        return $this->maxUsers() === 0;
    }

    public function allowsUnlimitedCompanies(): bool
    {
        return $this->maxCompanies() === 0;
    }

    public function allowsReports(): bool
    {
        return $this->limits()['reports'];
    }
}
