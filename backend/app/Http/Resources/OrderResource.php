<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'assigned_to' => $this->assigned_to,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'tax' => $this->tax,
            'total' => $this->total,
            'notes' => $this->notes,
            'ordered_at' => $this->ordered_at,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee?->only(['id', 'name', 'email'])),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
        ];
    }
}