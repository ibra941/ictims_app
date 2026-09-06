<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create asset categories table
        Schema::create('asset_categories', function (Blueprint $table) {
            $table->id('cat_id');
            $table->string('name', 100);
            $table->string('code', 20)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index('code', 'idx_cat_code');
        });

        // Create suppliers table
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id('supp_id');
            $table->string('name', 150);
            $table->string('contact_person', 100)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            $table->string('tin', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('name', 'idx_supp_name');
            $table->index('email', 'idx_supp_email');
        });

        // Create assets table
        Schema::create('assets', function (Blueprint $table) {
            $table->id('asset_id');
            $table->foreignId('cat_id')->constrained('asset_categories', 'cat_id')->restrictOnDelete();
            $table->foreignId('campus_id')->nullable()->constrained('campuses', 'campus_id')->nullOnDelete();
            $table->foreignId('dept_id')->nullable()->constrained('departments', 'dept_id')->nullOnDelete();
            $table->foreignId('supp_id')->nullable()->constrained('suppliers', 'supp_id')->nullOnDelete();
            $table->string('serial_number', 50)->unique();
            $table->string('name', 200);
            $table->string('model', 100)->nullable();
            $table->text('description')->nullable();
            $table->decimal('cost', 15, 2)->default(0.00);
            $table->date('purchase_date')->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->enum('status', ['Available', 'Assigned', 'Under Maintenance', 'Disposed', 'Lost'])->default('Available');
            $table->string('image_url', 500)->nullable();
            $table->text('qr_code')->nullable();
            $table->timestamps();
            $table->index('serial_number', 'idx_asset_serial');
            $table->index('status', 'idx_asset_status');
            $table->index('cat_id', 'idx_asset_cat');
            $table->index('campus_id', 'idx_asset_campus');
            $table->index('dept_id', 'idx_asset_dept');
            $table->index('supp_id', 'idx_asset_supp');
            $table->index(['status', 'dept_id'], 'idx_assets_status_dept');
            $table->index(['campus_id', 'dept_id'], 'idx_assets_campus_dept');
            $table->index(['status', 'created_at'], 'idx_assets_status_created');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('asset_categories');
    }
};
