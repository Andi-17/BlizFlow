<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'role_id' => $this->role_id,
            'is_owner' => $this->is_owner,
            'status' => $this->status,
            'name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'username' => $this->whenLoaded('user', fn () => $this->user?->username),
            'email' => $this->whenLoaded('user', fn () => $this->user?->email),
            'user' => new UserResource($this->whenLoaded('user')),
            'role' => $this->whenLoaded('role', fn () => [
                'id' => $this->role->id,
                'name' => $this->role->name,
                'slug' => $this->role->slug,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
