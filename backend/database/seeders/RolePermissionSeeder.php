<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'Manage Customers', 'slug' => 'customers.manage', 'group' => 'customers'],
            ['name' => 'View Customers', 'slug' => 'customers.view', 'group' => 'customers'],
            ['name' => 'Manage Products', 'slug' => 'products.manage', 'group' => 'products'],
            ['name' => 'View Products', 'slug' => 'products.view', 'group' => 'products'],
            ['name' => 'Manage Orders', 'slug' => 'orders.manage', 'group' => 'orders'],
            ['name' => 'View Orders', 'slug' => 'orders.view', 'group' => 'orders'],
            ['name' => 'Manage Invoices', 'slug' => 'invoices.manage', 'group' => 'invoices'],
            ['name' => 'View Invoices', 'slug' => 'invoices.view', 'group' => 'invoices'],
            ['name' => 'Manage Projects', 'slug' => 'projects.manage', 'group' => 'projects'],
            ['name' => 'View Projects', 'slug' => 'projects.view', 'group' => 'projects'],
            ['name' => 'Manage Tasks', 'slug' => 'tasks.manage', 'group' => 'tasks'],
            ['name' => 'View Tasks', 'slug' => 'tasks.view', 'group' => 'tasks'],
            ['name' => 'Manage Employees', 'slug' => 'employees.manage', 'group' => 'employees'],
            ['name' => 'View Reports', 'slug' => 'reports.view', 'group' => 'reports'],
            ['name' => 'View Own Performance', 'slug' => 'performance.own', 'group' => 'performance'],
            ['name' => 'View Team Performance', 'slug' => 'performance.team', 'group' => 'performance'],
            ['name' => 'Manage Billing', 'slug' => 'billing.manage', 'group' => 'billing'],
            ['name' => 'Manage Settings', 'slug' => 'settings.manage', 'group' => 'settings'],
        ];

        foreach ($permissions as $permission) {
            Permission::query()->updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }

        $all = Permission::query()->pluck('slug')->all();

        $roles = [
            [
                'name' => 'Owner',
                'slug' => 'owner',
                'description' => 'Full company control — manages people, billing, and everything else.',
                'permissions' => $all,
            ],
            [
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Runs the company day-to-day including staff and settings.',
                'permissions' => $all,
            ],
            [
                'name' => 'Manager',
                'slug' => 'manager',
                'description' => 'Manages operations and can see the whole team’s work.',
                'permissions' => [
                    'customers.manage', 'customers.view',
                    'products.manage', 'products.view',
                    'orders.manage', 'orders.view',
                    'invoices.manage', 'invoices.view',
                    'projects.manage', 'projects.view',
                    'tasks.manage', 'tasks.view',
                    'reports.view',
                    'performance.own', 'performance.team',
                ],
            ],
            [
                'name' => 'Worker',
                'slug' => 'employee',
                'description' => 'Sees assigned work and personal performance only.',
                'permissions' => [
                    'customers.view',
                    'products.view',
                    'orders.view',
                    'invoices.view',
                    'projects.view',
                    'tasks.manage', 'tasks.view',
                    'performance.own',
                ],
            ],
        ];

        foreach ($roles as $roleData) {
            $role = Role::query()->updateOrCreate(
                ['company_id' => null, 'slug' => $roleData['slug']],
                [
                    'name' => $roleData['name'],
                    'description' => $roleData['description'],
                ]
            );

            $permissionIds = Permission::query()
                ->whereIn('slug', $roleData['permissions'])
                ->pluck('id');

            $role->permissions()->sync($permissionIds);
        }
    }
}
