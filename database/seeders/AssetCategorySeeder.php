<?php

namespace Database\Seeders;

use App\Models\AssetCategory;
use Illuminate\Database\Seeder;

class AssetCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Laptops & Computers', 'code' => 'COMP', 'type' => 'Hardware'],
            ['name' => 'Printers & Scanners', 'code' => 'PRINT', 'type' => 'Hardware'],
            ['name' => 'Networking Equipment', 'code' => 'NET', 'type' => 'Hardware'],
            ['name' => 'Furniture', 'code' => 'FURN', 'type' => 'Hardware'],
            ['name' => 'Office Equipment', 'code' => 'OFFICE', 'type' => 'Hardware'],
            ['name' => 'Laboratory Equipment', 'code' => 'LAB', 'type' => 'Hardware'],
            ['name' => 'Vehicles', 'code' => 'VEHICLE', 'type' => 'Hardware'],
            ['name' => 'Projectors & Displays', 'code' => 'AV', 'type' => 'Hardware'],
            ['name' => 'Operating Systems', 'code' => 'OS', 'type' => 'Software'],
            ['name' => 'Productivity & Office Software', 'code' => 'PROD-SW', 'type' => 'Software'],
            ['name' => 'Security & Antivirus Software', 'code' => 'SEC-SW', 'type' => 'Software'],
            ['name' => 'Design & Engineering Software', 'code' => 'DESIGN-SW', 'type' => 'Software'],
        ];

        foreach ($categories as $cat) {
            AssetCategory::updateOrCreate(
                ['code' => $cat['code']],
                ['name' => $cat['name'], 'type' => $cat['type']]
            );
        }
    }
}
