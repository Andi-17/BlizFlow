<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'google_id',
        'avatar_url',
        'password',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_platform_admin' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class)
            ->withPivot(['role_id', 'is_owner', 'status'])
            ->withTimestamps();
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(CompanyUser::class)->withoutGlobalScopes();
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function assignedOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'assigned_to');
    }

    public function isMemberOf(Company|int $company): bool
    {
        $companyId = $company instanceof Company ? $company->id : $company;

        return $this->memberships()
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->exists();
    }

    public function membershipFor(Company|int $company): ?CompanyUser
    {
        $companyId = $company instanceof Company ? $company->id : $company;

        return $this->memberships()
            ->with('role.permissions')
            ->where('company_id', $companyId)
            ->first();
    }

    public function roleSlugFor(Company|int $company): ?string
    {
        $membership = $this->membershipFor($company);

        if (! $membership) {
            return null;
        }

        if ($membership->is_owner) {
            return 'owner';
        }

        return $membership->role?->slug;
    }

    public function hasPermission(string $permission, Company|int|null $company = null): bool
    {
        if ($this->is_platform_admin) {
            return true;
        }

        $companyId = $company instanceof Company
            ? $company->id
            : ($company ?? app(\App\Services\TenantContext::class)->companyId());

        if (! $companyId) {
            return false;
        }

        $membership = $this->membershipFor($companyId);

        if (! $membership || $membership->status !== 'active') {
            return false;
        }

        if ($membership->is_owner) {
            return true;
        }

        $role = $membership->role;

        if (! $role) {
            return false;
        }

        if (in_array($role->slug, ['owner', 'admin'], true)) {
            return true;
        }

        return $role->permissions->contains('slug', $permission);
    }

    public function isCompanyAdmin(Company|int|null $company = null): bool
    {
        $slug = $this->roleSlugFor(
            $company ?? app(\App\Services\TenantContext::class)->companyId() ?? 0
        );

        return in_array($slug, ['owner', 'admin'], true);
    }

    public function canManageTeam(Company|int|null $company = null): bool
    {
        return $this->hasPermission('employees.manage', $company)
            || $this->hasPermission('performance.team', $company);
    }
}
