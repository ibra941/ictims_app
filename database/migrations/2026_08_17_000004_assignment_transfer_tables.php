<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create asset assignments table
        Schema::create('asset_assignments', function (Blueprint $table) {
            $table->id('assign_id');
            $table->foreignId('asset_id')->constrained('assets', 'asset_id')->restrictOnDelete();
            $table->foreignId('emp_id')->constrained('employees', 'emp_id')->restrictOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->date('assign_date');
            $table->date('expected_return_date')->nullable();
            $table->date('actual_return_date')->nullable();
            $table->enum('status', ['Active', 'Returned', 'Overdue'])->default('Active');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('asset_id', 'idx_assign_asset');
            $table->index('emp_id', 'idx_assign_emp');
            $table->index('status', 'idx_assign_status');
            $table->index('assign_date', 'idx_assign_date');
            $table->index(['emp_id', 'status'], 'idx_assignments_emp_status');
            $table->index(['emp_id', 'created_at'], 'idx_assignments_emp_created');
        });

        // Create asset transfers table
        Schema::create('asset_transfers', function (Blueprint $table) {
            $table->id('trans_id');
            $table->foreignId('asset_id')->constrained('assets', 'asset_id')->restrictOnDelete();
            $table->foreignId('from_dept_id')->nullable()->constrained('departments', 'dept_id')->nullOnDelete();
            $table->foreignId('from_campus_id')->nullable()->constrained('campuses', 'campus_id')->nullOnDelete();
            $table->foreignId('to_dept_id')->constrained('departments', 'dept_id')->restrictOnDelete();
            $table->foreignId('to_campus_id')->constrained('campuses', 'campus_id')->restrictOnDelete();
            $table->date('transfer_date');
            $table->text('reason')->nullable();
            $table->enum('status', ['Pending', 'Approved', 'Rejected', 'Completed'])->default('Pending');
            $table->foreignId('approved_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->timestamps();
            $table->index('asset_id', 'idx_trans_asset');
            $table->index('from_dept_id', 'idx_trans_from_dept');
            $table->index('to_dept_id', 'idx_trans_to_dept');
            $table->index('status', 'idx_trans_status');
            $table->index(['status', 'transfer_date'], 'idx_transfers_status_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_transfers');
        Schema::dropIfExists('asset_assignments');
    }
};
