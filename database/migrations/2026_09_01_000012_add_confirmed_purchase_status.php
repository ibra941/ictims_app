<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE purchases MODIFY status ENUM('Draft', 'Ordered', 'Received', 'Confirmed', 'Cancelled') NOT NULL DEFAULT 'Draft'");
    }

    public function down(): void
    {
        DB::table('purchases')->where('status', 'Confirmed')->update(['status' => 'Received']);
        DB::statement("ALTER TABLE purchases MODIFY status ENUM('Draft', 'Ordered', 'Received', 'Cancelled') NOT NULL DEFAULT 'Draft'");
    }
};
