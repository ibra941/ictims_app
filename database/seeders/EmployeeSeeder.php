<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $departments = Department::with('campus')->get();

        $employees = [
            // ICT Staff across campuses
            ['first' => 'Frank', 'last' => 'Minja', 'job' => 'Head of ICT', 'dept_code' => 'CIT', 'emp_no_suffix' => '001'],
            ['first' => 'Diana', 'last' => 'Kimaro', 'job' => 'Senior ICT Officer', 'dept_code' => 'CIT', 'emp_no_suffix' => '002'],
            ['first' => 'Moses', 'last' => 'Njau', 'job' => 'ICT Support Officer', 'dept_code' => 'CIT', 'emp_no_suffix' => '003'],
            
            // Finance staff
            ['first' => 'Grace', 'last' => 'Simbani', 'job' => 'Finance Manager', 'dept_code' => 'ACCT', 'emp_no_suffix' => '050'],
            ['first' => 'Peter', 'last' => 'Kofi', 'job' => 'Accountant', 'dept_code' => 'ACCT', 'emp_no_suffix' => '051'],
            
            // Administration
            ['first' => 'Ruth', 'last' => 'Mwase', 'job' => 'Administration Manager', 'dept_code' => 'ADMIN', 'emp_no_suffix' => '100'],
            ['first' => 'John', 'last' => 'Banda', 'job' => 'Administrative Officer', 'dept_code' => 'ADMIN', 'emp_no_suffix' => '101'],
            
            // HR
            ['first' => 'Elizabeth', 'last' => 'Chuma', 'job' => 'HR Manager', 'dept_code' => 'HR', 'emp_no_suffix' => '150'],
            
            // Procurement
            ['first' => 'Michael', 'last' => 'Mtalimanja', 'job' => 'Procurement Officer', 'dept_code' => 'PROC', 'emp_no_suffix' => '200'],
        ];

        foreach ($employees as $emp) {
            $dept = $departments->first(fn($d) => $d->code === $emp['dept_code']);
            
            if (!$dept) {
                $dept = $departments->first(fn($d) => $d->code === 'CIT');
            }

            if ($dept) {
                Employee::updateOrCreate(
                    ['employee_no' => 'IAA-EMP-' . $emp['emp_no_suffix']],
                    [
                        'dept_id' => $dept->dept_id,
                        'first_name' => $emp['first'],
                        'last_name' => $emp['last'],
                        'email' => strtolower($emp['first'] . '.' . $emp['last'] . '@iaa.ac.tz'),
                        'job_title' => $emp['job'],
                        'phone' => '+255 ' . rand(600, 799) . ' ' . rand(100000, 999999),
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
