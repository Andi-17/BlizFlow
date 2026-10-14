<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use Illuminate\Http\Request;

class AdminCompanyController extends Controller
{
    public function index(Request $request)
    {
        $companies = Company::query()
            ->with('subscription.plan')
            ->when($request->search, fn ($query, $search) => $query->where(function ($inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->success(CompanyResource::collection($companies)->response()->getData(true));
    }

    public function show(Company $company)
    {
        return $this->success(new CompanyResource($company->load(['subscription.plan', 'settings', 'users'])));
    }

    public function update(Request $request, Company $company)
    {
        $data = $request->validate([
            'is_active' => ['sometimes', 'boolean'],
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
        ]);

        $company->update($data);

        return $this->success(new CompanyResource($company->fresh('subscription.plan')), 'Company updated');
    }
}
