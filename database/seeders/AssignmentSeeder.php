<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Employee;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $assets = Asset::where('status', 'Available')->limit(10)->get();
        $employees = Employee::all();

        if ($assets->isEmpty() || $employees->isEmpty()) {
            return;
        }

        foreach ($assets->take(6) as $asset) {
            $employee = $employees->random();

            DB::table('asset_assignments')->insert([
                'asset_id' => $asset->asset_id,
                'emp_id' => $employee->emp_id,
                'assign_date' => now()->subMonths(rand(1, 12))->toDateString(),
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $asset->update(['status' => 'Assigned']);
        }
    }
}
