<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    use ChecksCompanyAccess;

    public function viewAny(User $user): bool
    {
        return $this->allowsAny($user, ['orders.view', 'orders.manage']);
    }

    public function view(User $user, Order $order): bool
    {
        if (! $this->sameCompany($user, $order)) {
            return false;
        }

        if ($this->allows($user, 'orders.manage') || $this->allows($user, 'performance.team')) {
            return true;
        }

        // Workers may only view orders assigned to them.
        return (int) $order->assigned_to === (int) $user->id;
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'orders.manage');
    }

    public function update(User $user, Order $order): bool
    {
        if (! $this->sameCompany($user, $order)) {
            return false;
        }

        if ($this->allows($user, 'orders.manage')) {
            return true;
        }

        return (int) $order->assigned_to === (int) $user->id && $this->allows($user, 'orders.view');
    }

    public function delete(User $user, Order $order): bool
    {
        return $this->sameCompany($user, $order) && $this->allows($user, 'orders.manage');
    }
}
