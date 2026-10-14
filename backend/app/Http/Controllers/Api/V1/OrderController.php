<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Order\StoreOrderRequest;
use App\Http\Requests\Api\Order\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Order::class);

        $orders = Order::query()
            ->with(['customer', 'items', 'assignee:id,name,email'])
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->customer_id, fn ($query, $customerId) => $query->where('customer_id', $customerId))
            ->when(
                ! $request->user()->hasPermission('orders.manage') && ! $request->user()->hasPermission('performance.team'),
                fn ($query) => $query->where('assigned_to', $request->user()->id)
            )
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->success(OrderResource::collection($orders)->response()->getData(true));
    }

    public function store(StoreOrderRequest $request, OrderService $orderService)
    {
        Gate::authorize('create', Order::class);

        $order = $orderService->create($request->validated());

        return $this->created(new OrderResource($order));
    }

    public function show(Order $order)
    {
        Gate::authorize('view', $order);

        return $this->success(new OrderResource($order->load(['customer', 'items', 'assignee:id,name,email'])));
    }

    public function update(UpdateOrderRequest $request, Order $order, OrderService $orderService)
    {
        Gate::authorize('update', $order);

        $order = $orderService->update($order, $request->validated());

        return $this->success(new OrderResource($order), 'Order updated');
    }

    public function destroy(Order $order)
    {
        Gate::authorize('delete', $order);

        $order->delete();

        return $this->success(null, 'Order deleted');
    }
}
