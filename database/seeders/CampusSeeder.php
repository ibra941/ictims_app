<?php

namespace Database\Seeders;

use App\Models\Campus;
use Illuminate\Database\Seeder;

class CampusSeeder extends Seeder
{
    public function run(): void
    {
        $campuses = [
            ['name' => 'Arusha', 'code' => 'AR', 'location' => 'Arusha', 'description' => 'Main campus'],
            ['name' => 'Babati', 'code' => 'BA', 'location' => 'Babati', 'description' => 'Regional campus'],
            ['name' => 'Dar es Salaam', 'code' => 'DSM', 'location' => 'Dar es Salaam', 'description' => 'Head office and urban campus'],
            ['name' => 'Dodoma', 'code' => 'DO', 'location' => 'Dodoma', 'description' => 'Central campus'],
            ['name' => 'Songea', 'code' => 'SO', 'location' => 'Songea', 'description' => 'Southern campus'],
            ['name' => 'Bukombe', 'code' => 'BU', 'location' => 'Bukombe', 'description' => 'Western campus'],
            ['name' => 'Zanzibar', 'code' => 'ZN', 'location' => 'Zanzibar', 'description' => 'Island campus'],
        ];

        foreach ($campuses as $campus) {
            Campus::query()->updateOrCreate(
                ['code' => $campus['code']],
                [
                    'name' => $campus['name'],
                    'location' => $campus['location'],
                    'description' => $campus['description'],
                ]
            );
        }
    }
}
