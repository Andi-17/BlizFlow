<?php

namespace App\Http\Middleware;

use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveSubscription
{
    public function __construct(protected TenantContext $tenantContext)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $company = $this->tenantContext->company();

        if (! $company) {
            return response()->json([
                'success' => false,
                'message' => 'Company context required.',
            ], 400);
        }

        if (! $company->hasActiveSubscription()) {
            return response()->json([
                'success' => false,
                'message' => 'An active subscription is required for this action.',
            ], 402);
        }

        return $next($request);
    }
}
