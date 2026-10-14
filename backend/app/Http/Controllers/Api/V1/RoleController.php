<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        // Any active company member with staff access can see assignable roles.
        if (
            ! $request->user()->hasPermission('employees.manage')
            && ! $request->user()->hasPermission('performance.team')
            && ! $request->user()->is_platform_admin
        ) {
            return $this->forbidden('You cannot list roles.');
        }

        $roles = Role::query()
            ->whereNull('company_id')
            ->whereIn('slug', ['admin', 'manager', 'employee'])
            ->with('permissions:id,slug,name')
            ->orderByRaw("CASE slug WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 WHEN 'employee' THEN 3 ELSE 4 END")
            ->get(['id', 'name', 'slug', 'description']);

        return $this->success($roles->map(fn (Role $role) => [
            'id' => $role->id,
            'name' => $role->name,
            'slug' => $role->slug,
            'description' => $role->description,
            'permissions' => $role->permissions->pluck('slug')->values(),
        ])->values());
    }
}
