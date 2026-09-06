<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            CampusSeeder::class,
            DepartmentSeeder::class,
            LabOfficeSeeder::class,
            EmployeeSeeder::class,
            CampusSampleUsersSeeder::class,
            AssetCategorySeeder::class,
            SupplierSeeder::class,
            AssetSeeder::class,
            AssignmentSeeder::class,
        ]);

        $managerRole = Role::query()->where('name', 'Overall Administrator')->first();

        User::query()->firstOrCreate(
            ['username' => 'admin'],
            [
                'email' => 'admin@myapp.local',
                'password' => Hash::make('password'),
                'role_id' => $managerRole?->role_id,
                'is_active' => true,
            ]
        );
    }
}
