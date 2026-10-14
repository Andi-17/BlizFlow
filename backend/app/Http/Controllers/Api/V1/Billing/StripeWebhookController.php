<?php

namespace App\Http\Controllers\Api\V1\Billing;

use App\Http\Controllers\Controller;
use App\Services\Billing\StripeService;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use UnexpectedValueException;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, StripeService $stripeService, TenantContext $tenantContext)
    {
        $tenantContext->bypassCompanyScope();

        try {
            $result = $stripeService->handleWebhook(
                $request->getContent(),
                $request->header('Stripe-Signature')
            );
        } catch (SignatureVerificationException|UnexpectedValueException $exception) {
            return $this->error($exception->getMessage(), 400);
        }

        return $this->success($result);
    }
}
