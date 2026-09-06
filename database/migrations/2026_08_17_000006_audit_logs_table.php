<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create audit logs table
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('log_id');
            $table->foreignId('user_id')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->string('table_name', 50);
            $table->integer('record_id');
            $table->enum('action', ['INSERT', 'UPDATE', 'DELETE', 'ASSIGN', 'TRANSFER', 'RETURN', 'DISPOSE']);
            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('user_id', 'idx_audit_user');
            $table->index('table_name', 'idx_audit_table');
            $table->index('record_id', 'idx_audit_record');
            $table->index('action', 'idx_audit_action');
            $table->index('created_at', 'idx_audit_created');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
