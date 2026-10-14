<?php

namespace App\Services;

use App\Models\CompanyUser;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function __construct(private readonly TenantContext $tenantContext)
    {
    }

    public function dashboardStats(): array
    {
        return [
            'customers_count' => Customer::query()->count(),
            'products_count' => Product::query()->count(),
            'orders_count' => Order::query()->count(),
            'invoices_count' => Invoice::query()->count(),
            'projects_count' => Project::query()->count(),
            'employees_count' => CompanyUser::query()
                ->where('company_id', $this->tenantContext->companyId())
                ->where('status', 'active')
                ->count(),
            'open_tasks_count' => Task::query()->whereNotIn('status', ['done', 'cancelled'])->count(),
            'revenue_total' => (float) Invoice::query()->where('status', 'paid')->sum('total'),
            'orders_total' => (float) Order::query()->sum('total'),
            'low_stock_count' => Product::query()
                ->whereColumn('stock_quantity', '<=', 'min_stock_level')
                ->count(),
            'outstanding_invoices' => (float) Invoice::query()
                ->whereIn('status', ['sent', 'overdue'])
                ->sum('total'),
        ];
    }

    public function salesSummary(?string $from = null, ?string $to = null): array
    {
        $ordersQuery = Order::query();
        $invoicesQuery = Invoice::query()->where('status', 'paid');

        if ($from) {
            $ordersQuery->whereDate('ordered_at', '>=', $from);
            $invoicesQuery->whereDate('paid_at', '>=', $from);
        }

        if ($to) {
            $ordersQuery->whereDate('ordered_at', '<=', $to);
            $invoicesQuery->whereDate('paid_at', '<=', $to);
        }

        return [
            'orders_count' => (clone $ordersQuery)->count(),
            'orders_total' => (float) (clone $ordersQuery)->sum('total'),
            'paid_invoices_count' => (clone $invoicesQuery)->count(),
            'paid_invoices_total' => (float) (clone $invoicesQuery)->sum('total'),
            'by_day' => (clone $ordersQuery)
                ->select(DB::raw('DATE(ordered_at) as day'), DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as total'))
                ->groupBy('day')
                ->orderBy('day')
                ->get(),
        ];
    }

    public function inventoryReport(): array
    {
        $products = Product::query()->with('category')->orderBy('name')->get();

        return [
            'total_skus' => $products->count(),
            'total_stock_value' => (float) $products->sum(fn (Product $product) => $product->stock_quantity * (float) $product->cost),
            'low_stock' => $products->filter->isLowStock()->values(),
            'products' => $products,
        ];
    }
}
