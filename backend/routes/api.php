<?php

use App\Http\Controllers\Admin\AdminActivityLogController;
use App\Http\Controllers\Admin\AdminBillingInvoiceController;
use App\Http\Controllers\Admin\AdminCompanyController;
use App\Http\Controllers\Admin\AdminContactMessageController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminPaymentController;
use App\Http\Controllers\Admin\AdminPlanController;
use App\Http\Controllers\Admin\AdminSubscriptionController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Billing\StripeWebhookController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\ContactMessageController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DevToolsController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\IndustryController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\OnboardingController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PerformanceController;
use App\Http\Controllers\Api\V1\PlanController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\PublicCompanyController;
use App\Http\Controllers\Api\V1\RegionController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\TaskController;
use Illuminate\Support\Facades\Route;

Route::post('/webhooks/stripe', StripeWebhookController::class);

Route::prefix('v1')->group(function () {
    Route::get('/plans', [PlanController::class, 'index']);
    Route::get('/regions', [RegionController::class, 'index']);
    Route::get('/industries', [IndustryController::class, 'index']);
    Route::get('/public/companies/{slug}', [PublicCompanyController::class, 'show'])
        ->where('slug', '[A-Za-z0-9\-]+');
    Route::post('/public/companies/{slug}/contact', [PublicCompanyController::class, 'contact'])
        ->middleware('throttle:8,1')
        ->where('slug', '[A-Za-z0-9\-]+');
    Route::post('/contact', [ContactController::class, 'store'])
        ->middleware('throttle:8,1');

    Route::prefix('dev')->middleware('throttle:10,1')->group(function () {
        Route::get('/status', [DevToolsController::class, 'status']);
        Route::post('/wipe-test-users', [DevToolsController::class, 'wipeTestUsers']);
    });

    Route::prefix('auth')->middleware('throttle:8,1')->group(function () {
        Route::get('/providers', [AuthController::class, 'providers']);
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/register/confirm', [AuthController::class, 'confirmRegistration'])
            ->middleware('throttle:8,1');
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/login/confirm', [AuthController::class, 'confirmLogin'])
            ->middleware('throttle:8,1');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
            ->middleware('signed')
            ->name('verification.verify');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::delete('/auth/account', [AuthController::class, 'deleteAccount'])
            ->middleware('throttle:5,1');
        Route::post('/auth/email/verification-notification', [AuthController::class, 'sendVerificationEmail'])
            ->middleware('throttle:6,1');

        Route::post('/onboarding/company', [OnboardingController::class, 'store']);
        Route::get('/onboarding/limits', [OnboardingController::class, 'limits']);
        Route::post('/onboarding/company/request-code', [OnboardingController::class, 'requestCode'])
            ->middleware('throttle:6,1');
        Route::post('/onboarding/company/confirm', [OnboardingController::class, 'confirm'])
            ->middleware('throttle:10,1');
        Route::get('/companies', [CompanyController::class, 'index']);
        Route::get('/companies/{company}', [CompanyController::class, 'show']);

        Route::post('/auth/stop-impersonating', [AuthController::class, 'stopImpersonating']);

        Route::middleware(['company.set', 'company.member'])->group(function () {
            Route::get('/company', [CompanyController::class, 'current']);
            Route::put('/companies/{company}', [CompanyController::class, 'update']);
            Route::post('/companies/{company}/logo', [CompanyController::class, 'uploadLogo']);
            Route::delete('/companies/{company}/logo', [CompanyController::class, 'removeLogo']);
            Route::delete('/companies/{company}', [CompanyController::class, 'destroy']);

            Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
            Route::get('/dashboard/search', [DashboardController::class, 'search']);

            Route::get('/contact-messages', [ContactMessageController::class, 'index']);
            Route::get('/contact-messages/unread-count', [ContactMessageController::class, 'unreadCount']);
            Route::get('/contact-messages/{contactMessage}', [ContactMessageController::class, 'show']);
            Route::post('/contact-messages/{contactMessage}/read', [ContactMessageController::class, 'markRead']);
            Route::patch('/contact-messages/{contactMessage}/status', [ContactMessageController::class, 'updateStatus']);
            Route::post('/contact-messages/{contactMessage}/to-customer', [ContactMessageController::class, 'toCustomer']);

            Route::get('/customers/{customer}/timeline', [CustomerController::class, 'timeline']);
            Route::apiResource('customers', CustomerController::class);
            Route::apiResource('categories', CategoryController::class);
            Route::apiResource('products', ProductController::class);

            Route::get('/inventory', [InventoryController::class, 'index']);
            Route::put('/inventory/{product}', [InventoryController::class, 'adjust']);

            Route::apiResource('orders', OrderController::class);
            Route::apiResource('invoices', InvoiceController::class);
            Route::post('/invoices/from-order/{order}', [InvoiceController::class, 'fromOrder']);
            Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf']);
            Route::post('/invoices/{invoice}/mark-paid', [InvoiceController::class, 'markPaid']);

            Route::apiResource('projects', ProjectController::class);
            Route::apiResource('tasks', TaskController::class);

            Route::get('/employees', [EmployeeController::class, 'index']);
            Route::get('/employees/lookup', [EmployeeController::class, 'lookup']);
            Route::post('/employees', [EmployeeController::class, 'store']);
            Route::put('/employees/{employee}', [EmployeeController::class, 'update']);
            Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy']);
            Route::post('/employees/{employee}/impersonate', [EmployeeController::class, 'impersonate'])
                ->middleware('throttle:10,1');

            Route::get('/roles', [RoleController::class, 'index']);
            Route::get('/performance/me', [PerformanceController::class, 'mine']);
            Route::get('/performance/team', [PerformanceController::class, 'team']);

            Route::get('/reports/sales', [ReportController::class, 'sales']);
            Route::get('/reports/inventory', [ReportController::class, 'inventory']);

            Route::prefix('billing')->middleware(['billing.manage', 'throttle:8,1'])->group(function () {
                Route::get('/subscription', [BillingController::class, 'subscription']);
                Route::get('/invoices', [BillingController::class, 'invoices']);
                Route::post('/portal', [BillingController::class, 'portal']);
                Route::post('/checkout', [BillingController::class, 'checkout']);
                Route::post('/confirm', [BillingController::class, 'confirm']);
                Route::post('/cancel', [BillingController::class, 'cancel']);
                Route::post('/resume', [BillingController::class, 'resume']);
                Route::post('/change-plan', [BillingController::class, 'changePlan']);
            });
        });

        Route::prefix('admin')->middleware('platform.admin')->group(function () {
            Route::get('/stats', [AdminDashboardController::class, 'stats']);
            Route::get('/companies', [AdminCompanyController::class, 'index']);
            Route::get('/companies/{company}', [AdminCompanyController::class, 'show']);
            Route::put('/companies/{company}', [AdminCompanyController::class, 'update']);
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::put('/users/{user}', [AdminUserController::class, 'update']);
            Route::get('/plans', [AdminPlanController::class, 'index']);
            Route::post('/plans', [AdminPlanController::class, 'store']);
            Route::put('/plans/{plan}', [AdminPlanController::class, 'update']);
            Route::get('/contact-messages', [AdminContactMessageController::class, 'index']);
            Route::post('/contact-messages/{message}/read', [AdminContactMessageController::class, 'markRead']);
            Route::get('/subscriptions', [AdminSubscriptionController::class, 'index']);
            Route::get('/payments', [AdminPaymentController::class, 'index']);
            Route::get('/billing-invoices', [AdminBillingInvoiceController::class, 'index']);
            Route::get('/activity-logs', [AdminActivityLogController::class, 'index']);
        });
    });
});
