<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance', function (Blueprint $table) {
            $table->text('request_reason')->nullable()->after('description');
            $table->string('requester_name', 150)->nullable()->after('request_reason');
            $table->string('requester_department', 150)->nullable()->after('requester_name');
            $table->string('requester_contact', 150)->nullable()->after('requester_department');
            $table->string('requester_signature', 150)->nullable()->after('requester_contact');
        });
    }

    public function down(): void
    {
        Schema::table('maintenance', function (Blueprint $table) {
            $table->dropColumn(['request_reason', 'requester_name', 'requester_department', 'requester_contact', 'requester_signature']);
        });
    }
};