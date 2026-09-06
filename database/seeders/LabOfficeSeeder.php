<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LabOfficeSeeder extends Seeder
{
    public function run(): void
    {
        $campuses = DB::table('campuses')->get();

        foreach ($campuses as $campus) {
            $departmentId = DB::table('departments')
                ->where('campus_id', $campus->campus_id)
                ->orderBy('dept_id')
                ->value('dept_id');

            if (!$departmentId) {
                continue;
            }

            foreach (['ICT Laboratory 1', 'ICT Laboratory 2'] as $labName) {
                DB::table('labs')->updateOrInsert(
                    ['campus_id' => $campus->campus_id, 'name' => $labName],
                    ['dept_id' => $departmentId, 'created_at' => now(), 'updated_at' => now()]
                );
            }

            foreach (['Administration Office', 'ICT Office'] as $officeName) {
                DB::table('offices')->updateOrInsert(
                    ['campus_id' => $campus->campus_id, 'name' => $officeName],
                    ['dept_id' => $departmentId, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }
}
