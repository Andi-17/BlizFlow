<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use Illuminate\Http\Request;

class AdminSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $subscriptions = Subscription::query()
            ->withoutGlobalScopes()
            ->with(['company', 'plan'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->whereHas('company', fn ($companyQuery) => $companyQuery->where('name', 'like', "%{$search}%"));
            })
            ->latest()
            ->paginate((int) $request->integer('per_page', 20));

        return $this->success(SubscriptionResource::collection($subscriptions)->response()->getData(true));
    }
}
