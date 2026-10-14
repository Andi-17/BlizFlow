<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Customer\StoreCustomerRequest;
use App\Http\Requests\Api\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\ActivityLogger;
use App\Services\CustomerTimelineService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Customer::class);

        $customers = Customer::query()
            ->when($request->search, fn ($query, $search) => $query->where(function ($inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->success(CustomerResource::collection($customers)->response()->getData(true));
    }

    public function store(StoreCustomerRequest $request, ActivityLogger $activityLogger)
    {
        Gate::authorize('create', Customer::class);

        $customer = Customer::query()->create($request->validated());
        $activityLogger->log('customer.created', $customer);

        return $this->created(new CustomerResource($customer));
    }

    public function show(Customer $customer)
    {
        Gate::authorize('view', $customer);

        return $this->success(new CustomerResource($customer));
    }

    public function timeline(Customer $customer, CustomerTimelineService $timelineService)
    {
        Gate::authorize('view', $customer);

        return $this->success([
            'customer_id' => $customer->id,
            'events' => $timelineService->forCustomer($customer),
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer, ActivityLogger $activityLogger)
    {
        Gate::authorize('update', $customer);

        $customer->update($request->validated());
        $activityLogger->log('customer.updated', $customer);

        return $this->success(new CustomerResource($customer), 'Customer updated');
    }

    public function destroy(Customer $customer, ActivityLogger $activityLogger)
    {
        Gate::authorize('delete', $customer);

        $customer->delete();
        $activityLogger->log('customer.deleted', $customer);

        return $this->success(null, 'Customer deleted');
    }
}
