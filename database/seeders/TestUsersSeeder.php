<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'email' => 'admin@ictims.local',
                'password' => Hash::make('password'),
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'role_id' => 1,
                'is_active' => true,
            ]
        );

        // Create ICT Officer
        User::updateOrCreate(
            ['username' => 'john.mushi'],
            [
                'email' => 'john.mushi@iaa.ac.tz',
                'password' => Hash::make('password'),
                'first_name' => 'John',
                'last_name' => 'Mushi',
                'role_id' => 2,
                'is_active' => true,
            ]
        );

        // Create another test user
        User::updateOrCreate(
            ['username' => 'mary.kibaya'],
            [
                'email' => 'mary.kibaya@iaa.ac.tz',
                'password' => Hash::make('password'),
                'first_name' => 'Mary',
                'last_name' => 'Kibaya',
                'role_id' => 2,
                'is_active' => true,
            ]
        );

        $this->command->info('Test users created successfully!');
    }
}
