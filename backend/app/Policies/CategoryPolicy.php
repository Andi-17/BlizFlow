<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    use ChecksCompanyAccess;

    public function viewAny(User $user): bool
    {
        return $this->allowsAny($user, ['products.view', 'products.manage']);
    }

    public function view(User $user, Category $category): bool
    {
        return $this->sameCompany($user, $category)
            && $this->allowsAny($user, ['products.view', 'products.manage']);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'products.manage');
    }

    public function update(User $user, Category $category): bool
    {
        return $this->sameCompany($user, $category) && $this->allows($user, 'products.manage');
    }

    public function delete(User $user, Category $category): bool
    {
        return $this->sameCompany($user, $category) && $this->allows($user, 'products.manage');
    }
}
