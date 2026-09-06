<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create campuses table
        Schema::create('campuses', function (Blueprint $table) {
            $table->id('campus_id');
            $table->string('name', 100);
            $table->string('code', 20)->unique();
            $table->text('location')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index('code', 'idx_campus_code');
        });

        // Create departments table
        Schema::create('departments', function (Blueprint $table) {
            $table->id('dept_id');
            $table->foreignId('campus_id')->constrained('campuses', 'campus_id')->restrictOnDelete();
            $table->string('name', 100);
            $table->string('code', 20)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index('campus_id', 'idx_dept_campus');
            $table->index('code', 'idx_dept_code');
        });

        // Create employees table
        Schema::create('employees', function (Blueprint $table) {
            $table->id('emp_id');
            $table->foreignId('dept_id')->constrained('departments', 'dept_id')->restrictOnDelete();
            $table->string('employee_no', 20)->unique();
            $table->string('first_name', 50);
            $table->string('last_name', 50);
            $table->string('email', 100)->unique();
            $table->string('phone', 20)->nullable();
            $table->string('job_title', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('dept_id', 'idx_emp_dept');
            $table->index('email', 'idx_emp_email');
            $table->index('employee_no', 'idx_emp_no');
        });

        // Create roles table
        Schema::create('roles', function (Blueprint $table) {
            $table->id('role_id');
            $table->string('name', 50)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index('name', 'idx_role_name');
        });

        // Create users table (extended from Laravel's default)
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');
            $table->foreignId('emp_id')->nullable()->constrained('employees', 'emp_id')->nullOnDelete();
            $table->foreignId('role_id')->constrained('roles', 'role_id')->restrictOnDelete();
            $table->string('username', 50)->unique();
            $table->string('password');
            $table->string('email', 100)->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('last_login')->nullable();
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
            $table->index('username', 'idx_user_username');
            $table->index('email', 'idx_user_email');
            $table->index('role_id', 'idx_user_role');
        });

        // Create permissions table
        Schema::create('permissions', function (Blueprint $table) {
            $table->id('perm_id');
            $table->foreignId('role_id')->constrained('roles', 'role_id')->cascadeOnDelete();
            $table->string('module', 50);
            $table->string('action', 50);
            $table->string('resource', 100)->nullable();
            $table->timestamps();
            $table->unique(['role_id', 'module', 'action', 'resource'], 'unique_permission');
            $table->index('role_id', 'idx_perm_role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('campuses');
    }
};
