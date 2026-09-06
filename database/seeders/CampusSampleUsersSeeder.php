<?php

namespace Database\Seeders;

use App\Models\Campus;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CampusSampleUsersSeeder extends Seeder
{
    // One demo account per role at every campus, so each campus/role combination can be tested end to end.
    private array $roleSlugs = [
        'Overall Administrator' => 'overalladmin',
        'Campus Administrator' => 'campusadmin',
        'ICT Officer' => 'ictofficer',
        'Procurement Officer' => 'procurement',
        'Head of Department' => 'hod',
        'Lab Manager' => 'labmanager',
        'Technician' => 'technician',
        'Employee' => 'employee',
    ];

    public function run(): void
    {
        $roles = Role::all()->keyBy('name');

        foreach (Campus::all() as $campus) {
            $campusCode = Str::lower($campus->code);

            $department = Department::query()->updateOrCreate(
                ['code' => "GA-{$campus->code}"],
                [
                    'campus_id' => $campus->campus_id,
                    'name' => 'General Administration',
                    'description' => "Sample department hosting demo accounts for {$campus->name} Campus",
                ]
            );

            foreach ($this->roleSlugs as $roleName => $slug) {
                $role = $roles->get($roleName);
                if (!$role) {
                    continue;
                }

                $fullName = ucwords(str_replace(['.', '-'], ' ', $slug)) . ' ' . $campus->name;
                $nameParts = explode(' ', $fullName, 2);

                $employee = Employee::query()->updateOrCreate(
                    ['employee_no' => "SMP-{$campus->code}-{$role->role_id}"],
                    [
                        'dept_id' => $department->dept_id,
                        'first_name' => $nameParts[0],
                        'last_name' => $nameParts[1] ?? $campus->name,
                        'email' => "{$slug}.{$campusCode}@iaa.ac.tz",
                        'job_title' => $roleName,
                        'phone' => '+255 700 000 ' . str_pad((string) $role->role_id, 3, '0', STR_PAD_LEFT),
                        'is_active' => true,
                    ]
                );

                User::query()->updateOrCreate(
                    ['username' => "{$slug}.{$campusCode}"],
                    [
                        'emp_id' => $employee->emp_id,
                        'role_id' => $role->role_id,
                        'email' => "{$slug}.{$campusCode}@iaa.ac.tz",
                        'password' => Hash::make('password'),
                        'is_active' => true,
                    ]
                );
            }
        }

        $this->command->info('Sample users created for every campus and role (password: "password").');
    }
}
