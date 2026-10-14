<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Task;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    public function mine(Request $request, TenantContext $tenantContext)
    {
        $user = $request->user();
        $companyId = $tenantContext->companyId();

        if (! $user->hasPermission('performance.own', $companyId) && ! $user->hasPermission('performance.team', $companyId)) {
            return $this->forbidden('You cannot view performance for this company.');
        }

        $period = $request->string('period', 'month')->toString();
        if (! in_array($period, ['day', 'month', 'year'], true)) {
            $period = 'month';
        }

        [$start, $end] = $this->rangeFor($period);
        $scopeUserId = $user->id;

        // Admins/managers can optionally inspect another worker when allowed.
        if ($request->filled('user_id') && $user->hasPermission('performance.team', $companyId)) {
            $scopeUserId = (int) $request->integer('user_id');
        }

        $tasksCompleted = Task::query()
            ->where('company_id', $companyId)
            ->where('assigned_to', $scopeUserId)
            ->where('status', 'done')
            ->whereBetween('updated_at', [$start, $end])
            ->count();

        $tasksOpen = Task::query()
            ->where('company_id', $companyId)
            ->where('assigned_to', $scopeUserId)
            ->whereNotIn('status', ['done', 'cancelled'])
            ->count();

        $ordersCompleted = Order::query()
            ->where('company_id', $companyId)
            ->where('assigned_to', $scopeUserId)
            ->whereIn('status', ['completed', 'delivered', 'paid', 'closed'])
            ->whereBetween('updated_at', [$start, $end])
            ->count();

        $ordersActive = Order::query()
            ->where('company_id', $companyId)
            ->where('assigned_to', $scopeUserId)
            ->whereNotIn('status', ['cancelled', 'completed', 'delivered', 'closed'])
            ->count();

        $orderRevenue = Order::query()
            ->where('company_id', $companyId)
            ->where('assigned_to', $scopeUserId)
            ->whereBetween('ordered_at', [$start, $end])
            ->sum('total');

        $recentTasks = Task::query()
            ->where('company_id', $companyId)
            ->where('assigned_to', $scopeUserId)
            ->latest('updated_at')
            ->limit(8)
            ->get(['id', 'title', 'status', 'priority', 'due_date', 'updated_at']);

        $recentOrders = Order::query()
            ->where('company_id', $companyId)
            ->where('assigned_to', $scopeUserId)
            ->latest('updated_at')
            ->limit(8)
            ->get(['id', 'order_number', 'status', 'total', 'ordered_at', 'updated_at']);

        return $this->success([
            'period' => $period,
            'from' => $start->toIso8601String(),
            'to' => $end->toIso8601String(),
            'user_id' => $scopeUserId,
            'summary' => [
                'tasks_completed' => $tasksCompleted,
                'tasks_open' => $tasksOpen,
                'orders_completed' => $ordersCompleted,
                'orders_active' => $ordersActive,
                'order_revenue' => (float) $orderRevenue,
            ],
            'recent_tasks' => $recentTasks,
            'recent_orders' => $recentOrders,
        ]);
    }

    public function team(Request $request, TenantContext $tenantContext)
    {
        $user = $request->user();
        $companyId = $tenantContext->companyId();

        if (! $user->hasPermission('performance.team', $companyId)) {
            return $this->forbidden('Only managers and admins can view team performance.');
        }

        $period = $request->string('period', 'month')->toString();
        if (! in_array($period, ['day', 'month', 'year'], true)) {
            $period = 'month';
        }

        [$start, $end] = $this->rangeFor($period);

        $workers = \App\Models\CompanyUser::query()
            ->with('user:id,name,email')
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->get();

        $rows = $workers->map(function ($membership) use ($companyId, $start, $end) {
            $userId = $membership->user_id;

            return [
                'user_id' => $userId,
                'name' => $membership->user?->name,
                'email' => $membership->user?->email,
                'role' => $membership->role?->name ?? ($membership->is_owner ? 'Owner' : 'Worker'),
                'tasks_completed' => Task::query()
                    ->where('company_id', $companyId)
                    ->where('assigned_to', $userId)
                    ->where('status', 'done')
                    ->whereBetween('updated_at', [$start, $end])
                    ->count(),
                'orders_completed' => Order::query()
                    ->where('company_id', $companyId)
                    ->where('assigned_to', $userId)
                    ->whereIn('status', ['completed', 'delivered', 'paid', 'closed'])
                    ->whereBetween('updated_at', [$start, $end])
                    ->count(),
                'order_revenue' => (float) Order::query()
                    ->where('company_id', $companyId)
                    ->where('assigned_to', $userId)
                    ->whereBetween('ordered_at', [$start, $end])
                    ->sum('total'),
            ];
        })->sortByDesc('tasks_completed')->values();

        return $this->success([
            'period' => $period,
            'from' => $start->toIso8601String(),
            'to' => $end->toIso8601String(),
            'workers' => $rows,
        ]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function rangeFor(string $period): array
    {
        $now = now();

        return match ($period) {
            'day' => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            default => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
        };
    }
}
