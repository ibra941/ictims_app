<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE audit_logs MODIFY action ENUM('INSERT', 'UPDATE', 'DELETE', 'ASSIGN', 'TRANSFER', 'RETURN', 'DISPOSE', 'LOGIN') NOT NULL");
    }

    public function down(): void
    {
        DB::table('audit_logs')->where('action', 'LOGIN')->delete();
        DB::statement("ALTER TABLE audit_logs MODIFY action ENUM('INSERT', 'UPDATE', 'DELETE', 'ASSIGN', 'TRANSFER', 'RETURN', 'DISPOSE') NOT NULL");
    }
};