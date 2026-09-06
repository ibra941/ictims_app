<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_locations', function (Blueprint $table) {
            $table->id('location_id');
            $table->foreignId('campus_id')->constrained('campuses', 'campus_id')->restrictOnDelete();
            $table->foreignId('dept_id')->nullable()->constrained('departments', 'dept_id')->nullOnDelete();
            $table->enum('type', ['Lab', 'Office']);
            $table->string('name', 100);
            $table->timestamps();
            $table->unique(['campus_id', 'type', 'name']);
        });

        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->foreignId('dept_id')->nullable()->after('emp_id')->constrained('departments', 'dept_id')->nullOnDelete();
            $table->foreignId('location_id')->nullable()->after('dept_id')->constrained('asset_locations', 'location_id')->nullOnDelete();
            $table->enum('assignment_type', ['Department', 'Lab', 'Office'])->default('Department')->after('location_id');
        });
    }

    public function down(): void
    {
        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('location_id');
            $table->dropConstrainedForeignId('dept_id');
            $table->dropColumn('assignment_type');
        });

        Schema::dropIfExists('asset_locations');
    }
};
