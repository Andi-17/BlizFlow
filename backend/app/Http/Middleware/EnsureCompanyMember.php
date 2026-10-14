<?php

namespace App\Http\Middleware;

use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyMember
{
    public function __construct(protected TenantContext $tenantContext)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $company = $this->tenantContext->company();

        if (! $user || ! $company) {
            return response()->json([
                'success' => false,
                'message' => 'Company context required. Send X-Company-Id header.',
            ], 400);
        }

        if ($user->is_platform_admin) {
            return $next($request);
        }

        if (! $user->isMemberOf($company)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this company.',
            ], 403);
        }

        return $next($request);
    }
}
