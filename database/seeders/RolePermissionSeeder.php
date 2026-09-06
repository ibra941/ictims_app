<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Overall Administrator' => 'Global system owner with full access across all campuses and governance settings.',
            'Campus Administrator' => 'Local campus owner with authority over campus users, assets, transfers, and approvals within one campus.',
            'Audit Officer' => 'Monitors audit logs, investigates suspicious activity, and generates security reports for one campus.',
            'ICT Officer' => 'Handles asset registry, assignments, maintenance, operational support, and system records.',
            'Procurement Officer' => 'Manages suppliers, purchases, and procurement workflows across the institution.',
            'Head of Department' => 'Approves local departmental requests, transfers, and operating-level decisions for assigned staff.',
            'Lab Manager' => 'Manages lab assets, inventory movement, and technical operations for a lab unit.',
            'Technician' => 'Maintains assets and resolves maintenance tickets across assigned campuses.',
            'Employee' => 'Views assets, submits requests, and manages their own assigned equipment.',
        ];

        $permissionMatrix = [
            'Overall Administrator' => [
                ['module' => '*', 'action' => '*'],
            ],
            'Campus Administrator' => [
                ['module' => 'dashboard', 'action' => 'view'],
                ['module' => 'assets', 'action' => 'manage'],
                ['module' => 'assignments', 'action' => 'manage'],
                ['module' => 'maintenance', 'action' => 'manage'],
                ['module' => 'disposal', 'action' => 'manage'],
                ['module' => 'transfers', 'action' => 'manage'],
                ['module' => 'employees', 'action' => 'manage'],
                ['module' => 'users', 'action' => 'manage'],
                ['module' => 'system', 'action' => 'manage'],
                ['module' => 'audit', 'action' => 'manage'],
                ['module' => 'reports', 'action' => 'view'],
            ],
            'Audit Officer' => [
                ['module' => 'dashboard', 'action' => 'view'],
                ['module' => 'audit', 'action' => 'manage'],
                ['module' => 'reports', 'action' => 'view'],
            ],
            'ICT Officer' => [
                ['module' => 'dashboard', 'action' => 'view'],
                ['module' => 'assets', 'action' => 'manage'],
                ['module' => 'assignments', 'action' => 'manage'],
                ['module' => 'maintenance', 'action' => 'manage'],
                ['module' => 'procurement', 'action' => 'manage'],
                ['module' => 'suppliers', 'action' => 'manage'],
                ['module' => 'disposal', 'action' => 'manage'],
                ['module' => 'transfers', 'action' => 'manage'],
                ['module' => 'employees', 'action' => 'view'],
                ['module' => 'requests', 'action' => 'view'],
                ['module' => 'requests', 'action' => 'approve'],
                ['module' => 'audit', 'action' => 'view'],
            ],
            'Procurement Officer' => [
                ['module' => 'dashboard', 'action' => 'view'],
                ['module' => 'procurement', 'action' => 'manage'],
                ['module' => 'suppliers', 'action' => 'manage'],
                ['module' => 'assets', 'action' => 'view'],
                ['module' => 'reports', 'action' => 'view'],
            ],
            'Head of Department' => [
                ['module' => 'dashboard', 'action' => 'view'],
                ['module' => 'assets', 'action' => 'view'],
                ['module' => 'assignments', 'action' => 'view'],
                ['module' => 'maintenance', 'action' => 'view'],
                ['module' => 'transfers', 'action' => 'approve'],
                ['module' => 'requests', 'action' => 'approve'],
                ['module' => 'employees', 'action' => 'view'],
            ],
            'Lab Manager' => [
                ['module' => 'dashboard', 'action' => 'view'],
                ['module' => 'assets', 'action' => 'manage'],
                ['module' => 'maintenance', 'action' => 'manage'],
                ['module' => 'requests', 'action' => 'approve'],
            ],
            'Technician' => [
                ['module' => 'dashboard', 'action' => 'view'],
                ['module' => 'assets', 'action' => 'view'],
                ['module' => 'maintenance', 'action' => 'manage'],
                ['module' => 'requests', 'action' => 'view'],
            ],
            'Employee' => [
                ['module' => 'dashboard', 'action' => 'view'],
                ['module' => 'assets', 'action' => 'view'],
                ['module' => 'my-assets', 'action' => 'view'],
                ['module' => 'requests', 'action' => 'create'],
                ['module' => 'requests', 'action' => 'view'],
                ['module' => 'maintenance', 'action' => 'view'],
                ['module' => 'maintenance', 'action' => 'create'],
            ],
        ];

        foreach ($roles as $name => $description) {
            $role = Role::query()->updateOrCreate(
                ['name' => $name],
                ['description' => $description]
            );

            foreach ($permissionMatrix[$name] as $permission) {
                Permission::query()->updateOrCreate(
                    [
                        'role_id' => $role->role_id,
                        'module' => $permission['module'],
                        'action' => $permission['action'],
                        'resource' => $permission['resource'] ?? null,
                    ],
                    []
                );
            }
        }
    }
}