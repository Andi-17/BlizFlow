<?php

namespace App\Http\Middleware;

use App\Support\PlatformOwner;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! PlatformOwner::matches($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Only the application creator can grant complimentary subscriptions.',
            ], 403);
        }

        app(\App\Services\TenantContext::class)->bypassCompanyScope();

        return $next($request);
    }
}
