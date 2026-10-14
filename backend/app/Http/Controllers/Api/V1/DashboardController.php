<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use App\Services\SmartSearchService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(ReportService $reportService)
    {
        return $this->success($reportService->dashboardStats());
    }

    public function search(Request $request, SmartSearchService $smartSearch)
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:200'],
        ]);

        return $this->success($smartSearch->search($data['q']));
    }
}
