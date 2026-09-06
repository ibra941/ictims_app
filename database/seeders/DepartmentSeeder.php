<?php

namespace Database\Seeders;

use App\Models\Campus;
use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $campuses = Campus::all();

        $departmentStructure = [
            'Arusha' => [
                ['name' => 'Computing and Information Technology', 'code' => 'CIT'],
                ['name' => 'Accounting and Finance', 'code' => 'ACCT'],
                ['name' => 'Administration', 'code' => 'ADMIN'],
            ],
            'Babati' => [
                ['name' => 'Computing and Information Technology', 'code' => 'CIT'],
                ['name' => 'Student Support Services', 'code' => 'SSS'],
            ],
            'Dar es Salaam' => [
                ['name' => 'Computing and Information Technology', 'code' => 'CIT'],
                ['name' => 'Procurement and Supplies', 'code' => 'PROC'],
                ['name' => 'Human Resources', 'code' => 'HR'],
            ],
            'Dodoma' => [
                ['name' => 'Computing and Information Technology', 'code' => 'CIT'],
                ['name' => 'Finance and Accounting', 'code' => 'FAC'],
            ],
            'Songea' => [
                ['name' => 'Computing and Information Technology', 'code' => 'CIT'],
                ['name' => 'Administrative Support', 'code' => 'ADM-SUP'],
            ],
            'Bukombe' => [
                ['name' => 'Computing and Information Technology', 'code' => 'CIT'],
                ['name' => 'Finance', 'code' => 'FIN'],
            ],
            'Zanzibar' => [
                ['name' => 'Computing and Information Technology', 'code' => 'CIT'],
                ['name' => 'Administration', 'code' => 'ADMIN'],
            ],
        ];

        foreach ($campuses as $campus) {
            $depts = $departmentStructure[$campus->name] ?? $departmentStructure['Arusha'];

            foreach ($depts as $dept) {
                // Department codes are scoped per campus so the same department name can exist at every campus.
                Department::updateOrCreate(
                    ['code' => "{$dept['code']}-{$campus->code}"],
                    [
                        'campus_id' => $campus->campus_id,
                        'name' => $dept['name'],
                        'description' => "{$dept['name']} at {$campus->name} Campus",
                    ]
                );
            }
        }
    }
}
