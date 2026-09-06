<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create maintenance table
        Schema::create('maintenance', function (Blueprint $table) {
            $table->id('maint_id');
            $table->foreignId('asset_id')->constrained('assets', 'asset_id')->restrictOnDelete();
            $table->foreignId('reported_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->date('maintenance_date');
            $table->enum('type', ['Preventive', 'Corrective', 'Emergency', 'Scheduled'])->default('Scheduled');
            $table->text('description')->nullable();
            $table->decimal('cost', 15, 2)->default(0.00);
            $table->string('technician', 100)->nullable();
            $table->enum('status', ['Scheduled', 'In Progress', 'Completed', 'Cancelled'])->default('Scheduled');
            $table->date('completion_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('asset_id', 'idx_maint_asset');
            $table->index('status', 'idx_maint_status');
            $table->index('maintenance_date', 'idx_maint_date');
            $table->index('type', 'idx_maint_type');
            $table->index(['asset_id', 'maintenance_date'], 'idx_maintenance_asset_date');
            $table->index(['type', 'maintenance_date'], 'idx_maintenance_type_date');
        });

        // Create asset disposal table
        Schema::create('asset_disposal', function (Blueprint $table) {
            $table->id('disposal_id');
            $table->foreignId('asset_id')->constrained('assets', 'asset_id')->restrictOnDelete();
            $table->foreignId('authorized_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->date('disposal_date');
            $table->enum('method', ['Auction', 'Scrap', 'Donation', 'Write-off'])->default('Scrap');
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique('asset_id', 'unique_asset_disposal');
            $table->index('asset_id', 'idx_disposal_asset');
            $table->index('method', 'idx_disposal_method');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_disposal');
        Schema::dropIfExists('maintenance');
    }
};
