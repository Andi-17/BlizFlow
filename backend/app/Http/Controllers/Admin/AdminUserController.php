<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\PlatformOwner;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()
            ->when($request->search, fn ($query, $search) => $query->where(function ($inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->success(UserResource::collection($users)->response()->getData(true));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'is_active' => ['sometimes', 'boolean'],
            'is_platform_admin' => ['sometimes', 'boolean'],
            'name' => ['sometimes', 'string', 'max:255'],
        ]);

        if (array_key_exists('is_platform_admin', $data) && ! PlatformOwner::matches($request->user())) {
            return $this->error('Only the application creator can change platform admin access.', 403);
        }

        $user->forceFill($data)->save();

        return $this->success(new UserResource($user), 'User updated');
    }
}
