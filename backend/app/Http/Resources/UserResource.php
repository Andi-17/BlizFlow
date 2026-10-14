<?php

namespace App\Http\Resources;

use App\Support\PlatformOwner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'is_platform_admin' => (bool) $this->is_platform_admin,
            'is_platform_owner' => PlatformOwner::matches($this->resource),
            'is_active' => $this->is_active === null ? true : (bool) $this->is_active,
            'companies' => CompanyResource::collection($this->whenLoaded('companies')),
            'created_at' => $this->created_at,
        ];
    }
}