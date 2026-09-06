<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roleId = DB::table('roles')->where('name', 'ICT Officer')->value('role_id');
        if (!$roleId) {
            return;
        }

        DB::table('permissions')->updateOrInsert(
            ['role_id' => $roleId, 'module' => 'audit', 'action' => 'view', 'resource' => null],
            ['created_at' => now(), 'updated_at' => now()]
        );
    }

    public function down(): void
    {
        $roleId = DB::table('roles')->where('name', 'ICT Officer')->value('role_id');
        if ($roleId) {
            DB::table('permissions')->where(['role_id' => $roleId, 'module' => 'audit', 'action' => 'view'])->delete();
        }
    }
};