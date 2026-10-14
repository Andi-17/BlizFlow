<?php

use App\Http\Middleware\EnsureActiveSubscription;
use App\Http\Middleware\EnsureCanManageBilling;
use App\Http\Middleware\EnsureCompanyMember;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsurePlatformAdmin;
use App\Http\Middleware\EnsurePlatformOwner;
use App\Http\Middleware\SetCurrentCompany;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
        ]);

        // Company scope must be active before route-model binding resolves tenant models.
        $middleware->prependToPriorityList(
            before: \Illuminate\Routing\Middleware\SubstituteBindings::class,
            prepend: SetCurrentCompany::class,
        );
        $middleware->appendToPriorityList(
            after: SetCurrentCompany::class,
            append: EnsureCompanyMember::class,
        );

        $middleware->alias([
            'verified' => EnsureEmailIsVerified::class,
            'company.set' => SetCurrentCompany::class,
            'company.member' => EnsureCompanyMember::class,
            'platform.admin' => EnsurePlatformAdmin::class,
            'platform.owner' => EnsurePlatformOwner::class,
            'subscription.active' => EnsureActiveSubscription::class,
            'billing.manage' => EnsureCanManageBilling::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'api/webhooks/stripe',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(function (Request $request, \Throwable $exception) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();
