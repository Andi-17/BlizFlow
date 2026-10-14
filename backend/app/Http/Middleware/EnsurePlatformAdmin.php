<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->is_platform_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Platform admin access required.',
            ], 403);
        }

        app(\App\Services\TenantContext::class)->bypassCompanyScope();

        return $next($request);
    }
}
