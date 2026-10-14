<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ConfirmLoginRequest;
use App\Http\Requests\Auth\ConfirmRegistrationRequest;
use App\Http\Requests\Auth\DeleteAccountRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AccountDeletionService;
use App\Services\CompanyOnboardingService;
use App\Services\GoogleAuthService;
use App\Services\LoginChallengeService;
use App\Services\RegistrationService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function providers(GoogleAuthService $googleAuth)
    {
        return $this->success([
            'google' => $googleAuth->isConfigured(),
        ]);
    }

    public function register(RegisterRequest $request, RegistrationService $registrationService)
    {
        $result = $registrationService->sendVerificationCode($request->validated());

        return $this->success($result, 'Verification code sent to your email');
    }

    public function confirmRegistration(ConfirmRegistrationRequest $request, RegistrationService $registrationService)
    {
        $result = $registrationService->confirm(
            $request->string('email')->toString(),
            $request->string('verification_code')->toString(),
        );

        /** @var User $user */
        $user = $result['user'];
        $company = $result['company'];

        event(new Registered($user));
        Auth::login($user);

        $token = null;
        if ($request->filled('device_name') || $request->boolean('issue_token')) {
            $token = $user->createToken($request->input('device_name', 'api'))->plainTextToken;
        }

        return $this->created([
            'user' => new UserResource($user->load('companies')),
            'company' => $company ? new CompanyResource($company) : null,
            'token' => $token,
            'locale' => $result['locale'] ?? null,
            'currency' => $result['currency'] ?? null,
            'country' => $result['country'] ?? null,
        ], 'Welcome to BizFlow — account verified');
    }

    public function login(LoginRequest $request, LoginChallengeService $loginChallenge)
    {
        $result = $loginChallenge->start(
            $request->string('login')->toString(),
            $request->string('password')->toString(),
        );

        return $this->success($result, 'Verification code sent to your email');
    }

    public function confirmLogin(ConfirmLoginRequest $request, LoginChallengeService $loginChallenge)
    {
        $user = $loginChallenge->confirm(
            $request->integer('user_id'),
            $request->string('verification_code')->toString(),
        );

        Auth::login($user, $request->boolean('remember'));

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $token = null;
        if ($request->filled('device_name') || $request->boolean('issue_token') || ! $request->hasSession()) {
            $token = $user->createToken($request->input('device_name', 'api'))->plainTextToken;
        }

        return $this->success([
            'user' => new UserResource($user->load([
                'companies' => fn ($query) => $query->wherePivot('status', 'active'),
            ])),
            'token' => $token,
        ], 'Welcome back — signed in successfully');
    }

    public function logout(Request $request)
    {
        if ($request->hasSession()) {
            $request->session()->forget(['impersonator_id', 'impersonator_company_id']);
        }

        if ($request->user()?->currentAccessToken()) {
            $token = $request->user()->currentAccessToken();
            if (method_exists($token, 'delete')) {
                $token->delete();
            }
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->success(null, 'Logged out');
    }

    public function deleteAccount(DeleteAccountRequest $request, AccountDeletionService $deletionService)
    {
        /** @var User $user */
        $user = $request->user();

        if ($request->session()?->has('impersonator_id')) {
            return $this->error('Stop impersonating before deleting an account.', 422);
        }

        if (! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Password is incorrect.'],
            ]);
        }

        if ($user->is_platform_admin) {
            return $this->error('Platform admin accounts cannot be deleted from here.', 422);
        }

        $deletionService->deleteAccount($user);

        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->success(null, 'Account and owned company data deleted');
    }

    public function me(Request $request)
    {
        $user = $request->user()->load([
            'companies' => fn ($query) => $query->wherePivot('status', 'active'),
            'memberships' => fn ($query) => $query->where('status', 'active')->with('role.permissions'),
        ]);

        $impersonator = null;
        if ($request->hasSession() && $request->session()->has('impersonator_id')) {
            $admin = User::query()->find($request->session()->get('impersonator_id'));
            if ($admin) {
                $impersonator = [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                ];
            }
        }

        return $this->success([
            'user' => new UserResource($user),
            'impersonating' => (bool) $impersonator,
            'impersonator' => $impersonator,
            'memberships' => $user->memberships->map(fn ($membership) => [
                'company_id' => $membership->company_id,
                'is_owner' => (bool) $membership->is_owner,
                'status' => $membership->status,
                'role' => $membership->role ? [
                    'id' => $membership->role->id,
                    'name' => $membership->role->name,
                    'slug' => $membership->is_owner ? 'owner' : $membership->role->slug,
                    'permissions' => $membership->role->permissions->pluck('slug')->values(),
                ] : [
                    'id' => null,
                    'name' => $membership->is_owner ? 'Owner' : 'Member',
                    'slug' => $membership->is_owner ? 'owner' : 'employee',
                    'permissions' => [],
                ],
            ])->values(),
        ]);
    }

    public function stopImpersonating(Request $request)
    {
        if (! $request->hasSession() || ! $request->session()->has('impersonator_id')) {
            return $this->error('You are not impersonating anyone.', 422);
        }

        $adminId = $request->session()->get('impersonator_id');
        $companyId = $request->session()->get('impersonator_company_id');
        $admin = User::query()->find($adminId);

        if (! $admin || ! $admin->is_active) {
            $request->session()->forget(['impersonator_id', 'impersonator_company_id']);

            return $this->error('Original admin account is unavailable.', 422);
        }

        Auth::guard('web')->login($admin);
        $request->session()->forget(['impersonator_id', 'impersonator_company_id']);
        $request->session()->regenerate();

        $admin->load([
            'companies' => fn ($query) => $query->wherePivot('status', 'active'),
            'memberships' => fn ($query) => $query->where('status', 'active')->with('role.permissions'),
        ]);

        return $this->success([
            'user' => new UserResource($admin),
            'company_id' => $companyId,
            'impersonating' => false,
            'impersonator' => null,
            'memberships' => $admin->memberships->map(fn ($membership) => [
                'company_id' => $membership->company_id,
                'is_owner' => (bool) $membership->is_owner,
                'status' => $membership->status,
                'role' => $membership->role ? [
                    'id' => $membership->role->id,
                    'name' => $membership->role->name,
                    'slug' => $membership->is_owner ? 'owner' : $membership->role->slug,
                    'permissions' => $membership->role->permissions->pluck('slug')->values(),
                ] : [
                    'id' => null,
                    'name' => $membership->is_owner ? 'Owner' : 'Member',
                    'slug' => $membership->is_owner ? 'owner' : 'employee',
                    'permissions' => [],
                ],
            ])->values(),
        ], 'Returned to your admin account');
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return $this->success(null, __($status));
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return $this->success(null, __($status));
    }

    public function sendVerificationEmail(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return $this->success(null, 'Email already verified.');
        }

        $request->user()->sendEmailVerificationNotification();

        return $this->success(null, 'Verification link sent.');
    }

    public function verifyEmail(Request $request, int $id, string $hash)
    {
        $user = User::query()->findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return $this->error('Invalid verification link.', 403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return $this->success(null, 'Email verified.');
    }
}
