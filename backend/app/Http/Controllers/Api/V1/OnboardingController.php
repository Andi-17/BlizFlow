<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Onboarding\ConfirmCompanyRequest;
use App\Http\Requests\Api\Onboarding\OnboardCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Services\Billing\PlanEntitlementService;
use App\Services\CompanyOnboardingService;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function limits(Request $request, PlanEntitlementService $planEntitlements)
    {
        return $this->success($planEntitlements->companyLimitsForUser($request->user()));
    }

    public function requestCode(OnboardCompanyRequest $request, CompanyOnboardingService $onboardingService)
    {
        $result = $onboardingService->sendVerificationCode(
            $request->user(),
            $request->validated()
        );

        return $this->success($result, 'Verification code sent to your email.');
    }

    public function confirm(ConfirmCompanyRequest $request, CompanyOnboardingService $onboardingService)
    {
        $data = $request->validated();
        $code = $data['verification_code'];
        unset($data['verification_code']);

        $company = $onboardingService->confirmVerificationCode(
            $request->user(),
            $code,
            $data
        );

        return $this->created(new CompanyResource($company), 'Company created and verified');
    }

    /**
     * Legacy endpoint — still requires email verification code.
     */
    public function store(ConfirmCompanyRequest $request, CompanyOnboardingService $onboardingService)
    {
        return $this->confirm($request, $onboardingService);
    }
}
