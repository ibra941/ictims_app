<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'Simba Computer Systems Ltd',
                'contact_person' => 'Mwangi Njoroge',
                'email' => 'sales@simba-computers.co.tz',
                'phone' => '+255 22 211 3456',
                'address' => 'Dar es Salaam, Tanzania',
                'tin' => '104-558-921',
            ],
            [
                'name' => 'Tanzania Telecommunications Ltd (Vodacom)',
                'contact_person' => 'Anna Mwangi',
                'email' => 'corporate@vodacom.co.tz',
                'phone' => '+255 22 201 8888',
                'address' => 'Dar es Salaam, Tanzania',
                'tin' => '104-123-456',
            ],
            [
                'name' => 'Stationery Plus Ltd',
                'contact_person' => 'Samuel Kamau',
                'email' => 'orders@stationery-plus.co.tz',
                'phone' => '+255 22 212 5000',
                'address' => 'Dar es Salaam, Tanzania',
                'tin' => '104-234-567',
            ],
            [
                'name' => 'Furniture Experts Ltd',
                'contact_person' => 'Christine Ochieng',
                'email' => 'sales@furniture-experts.co.tz',
                'phone' => '+255 22 213 1111',
                'address' => 'Dar es Salaam, Tanzania',
                'tin' => '104-345-678',
            ],
            [
                'name' => 'East African IT Solutions',
                'contact_person' => 'Rashid Hassan',
                'email' => 'support@ea-it-solutions.co.tz',
                'phone' => '+255 22 214 2222',
                'address' => 'Arusha, Tanzania',
                'tin' => '104-456-789',
            ],
            [
                'name' => 'National Security Services Ltd',
                'contact_person' => 'David Kipchoge',
                'email' => 'quotation@nss-security.co.tz',
                'phone' => '+255 22 215 3333',
                'address' => 'Dar es Salaam, Tanzania',
                'tin' => '104-567-890',
            ],
        ];

        foreach ($suppliers as $supp) {
            Supplier::updateOrCreate(
                ['tin' => $supp['tin']],
                $supp
            );
        }
    }
}
