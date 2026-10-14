<?php

namespace App\Http\Middleware;

use App\Models\Company;
use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentCompany
{
    public function __construct(protected TenantContext $tenantContext)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $companyId = $request->header('X-Company-Id');

        if ($companyId) {
            $company = Company::query()->find($companyId);

            if (! $company || ! $company->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or inactive company.',
                ], 404);
            }

            $this->tenantContext->setCompany($company);
        }

        return $next($request);
    }
}
