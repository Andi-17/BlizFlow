<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    use ChecksCompanyAccess;

    public function viewAny(User $user): bool
    {
        return $this->allowsAny($user, ['invoices.view', 'invoices.manage']);
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $this->sameCompany($user, $invoice)
            && $this->allowsAny($user, ['invoices.view', 'invoices.manage']);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'invoices.manage');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $this->sameCompany($user, $invoice) && $this->allows($user, 'invoices.manage');
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $this->sameCompany($user, $invoice) && $this->allows($user, 'invoices.manage');
    }
}
