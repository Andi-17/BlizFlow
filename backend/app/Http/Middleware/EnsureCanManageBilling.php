<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanManageBilling
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasPermission('billing.manage')) {
            return response()->json([
                'success' => false,
                'message' => 'Only company admins can manage billing.',
            ], 403);
        }

        return $next($request);
    }
}
