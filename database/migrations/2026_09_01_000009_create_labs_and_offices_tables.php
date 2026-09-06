<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labs', function (Blueprint $table) {
            $table->id('lab_id');
            $table->foreignId('campus_id')->constrained('campuses', 'campus_id')->restrictOnDelete();
            $table->foreignId('dept_id')->nullable()->constrained('departments', 'dept_id')->nullOnDelete();
            $table->string('name', 100);
            $table->timestamps();
            $table->unique(['campus_id', 'name']);
        });

        Schema::create('offices', function (Blueprint $table) {
            $table->id('office_id');
            $table->foreignId('campus_id')->constrained('campuses', 'campus_id')->restrictOnDelete();
            $table->foreignId('dept_id')->nullable()->constrained('departments', 'dept_id')->nullOnDelete();
            $table->string('name', 100);
            $table->timestamps();
            $table->unique(['campus_id', 'name']);
        });

        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->foreignId('lab_id')->nullable()->after('location_id')->constrained('labs', 'lab_id')->nullOnDelete();
            $table->foreignId('office_id')->nullable()->after('lab_id')->constrained('offices', 'office_id')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('office_id');
            $table->dropConstrainedForeignId('lab_id');
        });

        Schema::dropIfExists('offices');
        Schema::dropIfExists('labs');
    }
};
