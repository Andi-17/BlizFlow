<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    use ChecksCompanyAccess;

    public function viewAny(User $user): bool
    {
        return $this->allowsAny($user, ['customers.view', 'customers.manage']);
    }

    public function view(User $user, Customer $customer): bool
    {
        return $this->sameCompany($user, $customer) && $this->allowsAny($user, ['customers.view', 'customers.manage']);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'customers.manage');
    }

    public function update(User $user, Customer $customer): bool
    {
        return $this->sameCompany($user, $customer) && $this->allows($user, 'customers.manage');
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $this->sameCompany($user, $customer) && $this->allows($user, 'customers.manage');
    }
}
