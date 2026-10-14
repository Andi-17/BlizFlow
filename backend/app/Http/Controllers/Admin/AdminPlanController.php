<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Http\Request;

class AdminPlanController extends Controller
{
    public function index()
    {
        return $this->success(PlanResource::collection(Plan::query()->orderBy('sort_order')->get()));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:plans,slug'],
            'description' => ['nullable', 'string'],
            'interval' => ['required', 'in:monthly,yearly,lifetime'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'stripe_price_id' => ['nullable', 'string'],
            'stripe_product_id' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
            'is_public' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'trial_days' => ['nullable', 'integer', 'min:0'],
        ]);

        $plan = Plan::query()->create($data);

        return $this->created(new PlanResource($plan));
    }

    public function update(Request $request, Plan $plan)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:plans,slug,'.$plan->id],
            'description' => ['nullable', 'string'],
            'interval' => ['sometimes', 'in:monthly,yearly,lifetime'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'stripe_price_id' => ['nullable', 'string'],
            'stripe_product_id' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
            'is_public' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'trial_days' => ['nullable', 'integer', 'min:0'],
        ]);

        $plan->update($data);

        return $this->success(new PlanResource($plan), 'Plan updated');
    }
}
