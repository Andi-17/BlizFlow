<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    use ChecksCompanyAccess;

    public function viewAny(User $user): bool
    {
        return $this->allowsAny($user, ['products.view', 'products.manage']);
    }

    public function view(User $user, Product $product): bool
    {
        return $this->sameCompany($user, $product) && $this->allowsAny($user, ['products.view', 'products.manage']);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'products.manage');
    }

    public function update(User $user, Product $product): bool
    {
        return $this->sameCompany($user, $product) && $this->allows($user, 'products.manage');
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->sameCompany($user, $product) && $this->allows($user, 'products.manage');
    }
}
