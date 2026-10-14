<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use App\Services\TenantContext;
use App\Support\PlanPricing;
use App\Support\RegionDefaults;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index(Request $request, TenantContext $tenantContext)
    {
        $currency = $this->resolveCurrency($request, $tenantContext);

        $plans = Plan::query()
            ->where('is_active', true)
            ->where('is_public', true)
            ->orderBy('sort_order')
            ->orderBy('price')
            ->get()
            ->map(function (Plan $plan) use ($currency) {
                $priced = PlanPricing::resolve($plan, $currency);
                $plan->setAttribute('display_price', $priced['price']);
                $plan->setAttribute('display_currency', $priced['currency']);

                return $plan;
            });

        return $this->success(PlanResource::collection($plans));
    }

    protected function resolveCurrency(Request $request, TenantContext $tenantContext): string
    {
        if ($tenantContext->company()) {
            return PlanPricing::companyCurrency($tenantContext->company());
        }

        if ($request->filled('currency')) {
            return strtoupper($request->string('currency')->toString());
        }

        if ($request->filled('country')) {
            return RegionDefaults::currencyForCountry($request->string('country')->toString());
        }

        return 'EUR';
    }
}
