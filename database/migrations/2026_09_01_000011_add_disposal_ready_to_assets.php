<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->boolean('disposal_ready')->default(false)->after('status');
            $table->index('disposal_ready', 'idx_assets_disposal_ready');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropIndex('idx_assets_disposal_ready');
            $table->dropColumn('disposal_ready');
        });
    }
};
