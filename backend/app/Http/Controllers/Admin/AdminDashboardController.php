<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\ContactMessage;
use App\Models\Subscription;
use App\Models\User;

class AdminDashboardController extends Controller
{
    public function stats()
    {
        return $this->success([
            'users_count' => User::query()->count(),
            'companies_count' => Company::query()->count(),
            'active_subscriptions' => Subscription::query()->withoutGlobalScopes()->whereIn('status', ['active', 'trialing'])->count(),
            'unread_messages' => ContactMessage::query()->where('is_read', false)->count(),
        ]);
    }
}
