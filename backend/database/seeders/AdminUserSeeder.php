<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->firstOrNew(['email' => 'admin@bizflow.test']);
        $user->forceFill([
            'name' => 'Platform Admin',
            'username' => 'admin',
            'password' => 'password',
            'email_verified_at' => now(),
            'is_platform_admin' => true,
            'is_active' => true,
        ])->save();
    }
}
