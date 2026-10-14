<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Employee\StoreEmployeeRequest;
use App\Http\Requests\Api\Employee\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Http\Resources\UserResource;
use App\Mail\WorkerJoinedCompanyMail;
use App\Models\CompanyUser;
use App\Models\Role;
use App\Models\User;
use App\Services\Billing\PlanEntitlementService;
use App\Services\TenantContext;
use App\Support\UsernameRules;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class EmployeeController extends Controller
{
    public function index(Request $request, TenantContext $tenantContext)
    {
        if (
            ! $request->user()->hasPermission('employees.manage')
            && ! $request->user()->hasPermission('performance.team')
            && ! $request->user()->hasPermission('tasks.manage')
        ) {
            return $this->forbidden('You cannot list company employees.');
        }

        $search = trim((string) $request->input('search', ''));

        $employees = CompanyUser::query()
            ->with(['user', 'role'])
            ->where('company_id', $tenantContext->companyId())
            ->when($search !== '', function ($query) use ($search) {
                $query->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery
                        ->where('name', 'like', '%'.$search.'%')
                        ->orWhere('username', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%');
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->success(EmployeeResource::collection($employees)->response()->getData(true));
    }

    public function lookup(Request $request, TenantContext $tenantContext)
    {
        if (! $request->user()->is_platform_admin && ! $request->user()->hasPermission('employees.manage')) {
            return $this->forbidden('Only admins can search workers.');
        }

        $search = trim((string) $request->input('q', $request->input('search', '')));

        if (strlen($search) < 2) {
            return $this->success([]);
        }

        $companyId = $tenantContext->companyId();
        $normalizedUsername = UsernameRules::normalize($search);

        $users = User::query()
            ->where('is_active', true)
            ->where('is_platform_admin', false)
            ->where(function ($query) use ($search, $normalizedUsername) {
                $query
                    ->where('username', $normalizedUsername)
                    ->orWhere('email', mb_strtolower($search));
            })
            ->whereDoesntHave('memberships', function ($query) use ($companyId) {
                $query->where('company_id', $companyId);
            })
            ->orderBy('name')
            ->limit(12)
            ->get(['id', 'name', 'username']);

        return $this->success(
            UserResource::collection($users)->resolve()
        );
    }

    public function store(StoreEmployeeRequest $request, TenantContext $tenantContext, PlanEntitlementService $planEntitlements)
    {
        $company = $tenantContext->company();

        if (! $request->user()->is_platform_admin && ! $request->user()->hasPermission('employees.manage')) {
            return $this->forbidden('Only admins can invite employees.');
        }

        $planEntitlements->assertCanInvite($company);

        if ($request->filled('user_id')) {
            $user = User::query()->findOrFail($request->integer('user_id'));
            if (! $user->is_active || $user->is_platform_admin) {
                throw ValidationException::withMessages([
                    'user_id' => ['This account cannot be added to the company.'],
                ]);
            }
        } else {
            $user = new User();
            $user->forceFill([
                'name' => $request->string('name')->toString(),
                'username' => $request->string('username')->toString(),
                'email' => $request->string('email')->toString(),
                'password' => $request->string('password')->toString(),
                'email_verified_at' => now(),
                'is_active' => true,
                'is_platform_admin' => false,
            ])->save();
        }

        $roleId = $request->input('role_id');
        if ($roleId) {
            $role = Role::query()->find($roleId);
            if (! $role || $role->slug === 'owner' || ($role->company_id && (int) $role->company_id !== (int) $company->id)) {
                throw ValidationException::withMessages([
                    'role_id' => ['Invalid role.'],
                ]);
            }
        } else {
            $roleId = Role::query()
                ->whereNull('company_id')
                ->where('slug', 'employee')
                ->value('id');
        }

        $existing = CompanyUser::query()
            ->where('company_id', $company->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'user_id' => ['This worker is already in the company.'],
            ]);
        }

        $employee = CompanyUser::query()->create([
            'company_id' => $company->id,
            'user_id' => $user->id,
            'role_id' => $roleId,
            'is_owner' => false,
            'status' => $request->input('status', 'active'),
        ]);

        $employee->load(['user', 'role']);

        if ($employee->user?->email) {
            Mail::to($employee->user->email)->send(new WorkerJoinedCompanyMail(
                $employee->user,
                $company,
                $employee->role?->name ?: 'Worker',
                $request->user(),
            ));
        }

        return $this->created(new EmployeeResource($employee));
    }

    public function update(UpdateEmployeeRequest $request, CompanyUser $employee, TenantContext $tenantContext)
    {
        if ((int) $employee->company_id !== (int) $tenantContext->companyId()) {
            return $this->notFound('Employee not found.');
        }

        if (! $request->user()->is_platform_admin && ! $request->user()->hasPermission('employees.manage')) {
            return $this->forbidden('Only admins can update employees.');
        }

        if ($employee->is_owner) {
            return $this->error('Cannot change the company owner membership here.', 422);
        }

        $data = $request->validated();

        if (array_key_exists('role_id', $data) && $data['role_id']) {
            $role = Role::query()->find($data['role_id']);
            if (! $role || $role->slug === 'owner' || ($role->company_id && (int) $role->company_id !== (int) $tenantContext->companyId())) {
                throw ValidationException::withMessages([
                    'role_id' => ['Invalid role.'],
                ]);
            }
        }

        $employee->update(collect($data)->only(['role_id', 'status'])->all());

        if ($request->filled('name')) {
            $employee->user->update(['name' => $request->string('name')->toString()]);
        }

        return $this->success(new EmployeeResource($employee->fresh(['user', 'role'])), 'Employee updated');
    }

    public function destroy(CompanyUser $employee, TenantContext $tenantContext, Request $request)
    {
        if ((int) $employee->company_id !== (int) $tenantContext->companyId()) {
            return $this->notFound('Employee not found.');
        }

        if (! $request->user()->is_platform_admin && ! $request->user()->hasPermission('employees.manage')) {
            return $this->forbidden('Only admins can remove employees.');
        }

        if ($employee->is_owner) {
            return $this->error('Cannot remove the company owner.', 422);
        }

        $employee->delete();

        return $this->success(null, 'Employee removed');
    }

    public function impersonate(Request $request, CompanyUser $employee, TenantContext $tenantContext)
    {
        if ((int) $employee->company_id !== (int) $tenantContext->companyId()) {
            return $this->notFound('Employee not found.');
        }

        $actor = $request->user();

        if (! $actor->is_platform_admin && ! $actor->hasPermission('employees.manage') && ! $actor->isCompanyAdmin()) {
            return $this->forbidden('Only company admins can enter a worker account.');
        }

        if ($employee->is_owner) {
            return $this->error('You cannot enter the owner account.', 422);
        }

        if ($employee->status !== 'active') {
            return $this->error('This team member is inactive.', 422);
        }

        $target = $employee->user;
        if (! $target || ! $target->is_active || $target->is_platform_admin) {
            return $this->error('Worker account is unavailable.', 422);
        }

        if ((int) $target->id === (int) $actor->id) {
            return $this->error('You are already this user.', 422);
        }

        if (! $request->hasSession()) {
            return $this->error('Impersonation requires a browser session.', 422);
        }

        if ($request->session()->has('impersonator_id')) {
            return $this->error('Stop the current impersonation first.', 422);
        }

        $request->session()->put('impersonator_id', $actor->id);
        $request->session()->put('impersonator_company_id', $tenantContext->companyId());

        Auth::guard('web')->login($target);
        $request->session()->regenerate();

        $target->load([
            'companies' => fn ($query) => $query->wherePivot('status', 'active'),
            'memberships' => fn ($query) => $query->where('status', 'active')->with('role.permissions'),
        ]);

        return $this->success([
            'user' => new \App\Http\Resources\UserResource($target),
            'company_id' => $tenantContext->companyId(),
            'impersonating' => true,
            'impersonator' => [
                'id' => $actor->id,
                'name' => $actor->name,
                'email' => $actor->email,
            ],
        ], 'Now viewing as '.$target->name);
    }
}
