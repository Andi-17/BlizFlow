<?php

namespace App\Policies;

use App\Models\ContactMessage;
use App\Models\User;

class ContactMessagePolicy
{
    use ChecksCompanyAccess;

    public function viewAny(User $user): bool
    {
        return $this->canManage($user);
    }

    public function view(User $user, ContactMessage $contactMessage): bool
    {
        return $this->sameCompany($user, $contactMessage) && $this->canManage($user);
    }

    public function update(User $user, ContactMessage $contactMessage): bool
    {
        return $this->sameCompany($user, $contactMessage) && $this->canManage($user);
    }
}
