<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\Campus;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    public function run(): void
    {
        $categories = AssetCategory::all()->keyBy('code');
        $campuses = Campus::all();
        $suppliers = Supplier::all();

        $assetTemplates = [
            [
                'category_code' => 'COMP',
                'name' => 'Dell Latitude 5520 Laptop',
                'model' => 'L5520-2024',
                'status' => 'Available',
                'cost' => 1500000,
                'count' => 3,
            ],
            [
                'category_code' => 'COMP',
                'name' => 'HP ProBook 450 G9',
                'model' => 'G9-2024',
                'status' => 'Available',
                'cost' => 1200000,
                'count' => 2,
            ],
            [
                'category_code' => 'PRINT',
                'name' => 'Canon ImageRunner Advance 5075',
                'model' => 'iR5075',
                'status' => 'Available',
                'cost' => 8500000,
                'count' => 1,
            ],
            [
                'category_code' => 'NET',
                'name' => 'Cisco Catalyst 2960X-48LPS',
                'model' => '2960X-48LPS',
                'status' => 'Available',
                'cost' => 6000000,
                'count' => 1,
            ],
            [
                'category_code' => 'AV',
                'name' => 'Epson EB-2250U Projector',
                'model' => 'EB-2250U',
                'status' => 'Available',
                'cost' => 3500000,
                'count' => 2,
            ],
            [
                'category_code' => 'FURN',
                'name' => 'Executive Office Desk',
                'model' => 'OD-EXEC-2024',
                'status' => 'Available',
                'cost' => 450000,
                'count' => 5,
            ],
            [
                'category_code' => 'OFFICE',
                'name' => 'Shredder Machine',
                'model' => 'SHRED-5000',
                'status' => 'Available',
                'cost' => 250000,
                'count' => 2,
            ],
            [
                'category_code' => 'OS',
                'name' => 'Microsoft Windows 11 Pro License',
                'model' => 'Win11-Pro-2024',
                'status' => 'Available',
                'cost' => 350000,
                'count' => 5,
            ],
            [
                'category_code' => 'PROD-SW',
                'name' => 'Microsoft Office 365 Business',
                'model' => 'O365-Biz-2024',
                'status' => 'Available',
                'cost' => 180000,
                'count' => 5,
            ],
            [
                'category_code' => 'SEC-SW',
                'name' => 'Kaspersky Endpoint Security',
                'model' => 'KES-2024',
                'status' => 'Available',
                'cost' => 220000,
                'count' => 3,
            ],
            [
                'category_code' => 'DESIGN-SW',
                'name' => 'Autodesk AutoCAD License',
                'model' => 'ACAD-2024',
                'status' => 'Available',
                'cost' => 950000,
                'count' => 2,
            ],
        ];

        foreach ($assetTemplates as $template) {
            $category = $categories->get($template['category_code']);
            if (!$category) continue;

            $supplier = $suppliers->random();

            for ($i = 0; $i < $template['count']; $i++) {
                $serial = 'IAA-' . $template['category_code'] . '-' . str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT);
                if (Asset::where('serial_number', $serial)->exists()) continue;

                $campus = $campuses->random();
                $dept = $campus->departments()->inRandomOrder()->first();

                Asset::create([
                    'cat_id' => $category->cat_id,
                    'campus_id' => $campus->campus_id,
                    'dept_id' => $dept->dept_id ?? null,
                    'supp_id' => $supplier->supp_id,
                    'serial_number' => $serial,
                    'name' => $template['name'],
                    'model' => $template['model'],
                    'cost' => $template['cost'],
                    'purchase_date' => now()->subMonths(rand(1, 24))->toDateString(),
                    'warranty_expiry' => now()->addMonths(rand(6, 24))->toDateString(),
                    'status' => $template['status'],
                    'description' => "{$template['name']} at {$campus->name} Campus",
                ]);
            }
        }
    }
}
