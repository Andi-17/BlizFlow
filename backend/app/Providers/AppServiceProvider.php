<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Company;
use App\Models\ContactMessage;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use App\Models\Project;
use App\Models\Task;
use App\Policies\CategoryPolicy;
use App\Policies\CompanyPolicy;
use App\Policies\ContactMessagePolicy;
use App\Policies\CustomerPolicy;
use App\Policies\InvoicePolicy;
use App\Policies\OrderPolicy;
use App\Policies\ProductPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\TaskPolicy;
use App\Services\TenantContext;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TenantContext::class, fn () => new TenantContext);
    }

    public function boot(): void
    {
        Password::defaults(function () {
            return Password::min(8)->mixedCase()->numbers();
        });

        Gate::policy(Company::class, CompanyPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(ContactMessage::class, ContactMessagePolicy::class);
        Gate::policy(Customer::class, CustomerPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
    }
}
