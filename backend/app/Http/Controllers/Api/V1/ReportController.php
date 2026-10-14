<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Billing\PlanEntitlementService;
use App\Services\ReportService;
use App\Services\TenantContext;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function sales(Request $request, ReportService $reportService, TenantContext $tenantContext, PlanEntitlementService $planEntitlements)
    {
        if (! $request->user()->is_platform_admin && ! $request->user()->hasPermission('reports.view')) {
            return $this->forbidden('You cannot view reports.');
        }

        if (! $planEntitlements->canViewReports($tenantContext->company())) {
            return $this->error('Reports are included on Pro and Business. Upgrade to unlock them.', 402);
        }

        $from = $request->date('from');
        $to = $request->date('to');
        if ($from && $to && $to->lt($from)) {
            return $this->error('The "to" date must be on or after the "from" date.', 422);
        }

        return $this->success($reportService->salesSummary(
            $request->input('from'),
            $request->input('to'),
        ));
    }

    public function inventory(ReportService $reportService, TenantContext $tenantContext, PlanEntitlementService $planEntitlements, Request $request)
    {
        if (! $request->user()->is_platform_admin && ! $request->user()->hasPermission('reports.view')) {
            return $this->forbidden('You cannot view reports.');
        }

        if (! $planEntitlements->canViewReports($tenantContext->company())) {
            return $this->error('Reports are included on Pro and Business. Upgrade to unlock them.', 402);
        }
        $report = $reportService->inventoryReport();

        return $this->success([
            'total_skus' => $report['total_skus'],
            'total_stock_value' => $report['total_stock_value'],
            'low_stock_count' => $report['low_stock']->count(),
            'low_stock' => $report['low_stock']->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'stock_quantity' => $product->stock_quantity,
                'min_stock_level' => $product->min_stock_level,
            ])->values(),
        ]);
    }
}
