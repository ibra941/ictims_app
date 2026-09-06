<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('disposal_batches', function (Blueprint $table) {
            $table->string('disposal_officer_role', 100)->nullable()->after('disposal_officer');
            $table->string('disposal_officer_campus', 150)->nullable()->after('disposal_officer_role');
            $table->string('disposal_officer_signature', 150)->nullable()->after('disposal_officer_campus');
            $table->string('destination', 255)->nullable()->after('reason');
            $table->string('recipient_organization', 150)->nullable()->after('recipient_name');
            $table->string('recipient_position', 150)->nullable()->after('recipient_organization');
            $table->string('recipient_signature', 150)->nullable()->after('recipient_contact');
            $table->string('procurement_officer_email', 150)->nullable()->after('procurement_signatory');
            $table->string('campus_admin_email', 150)->nullable()->after('campus_admin_signatory');
        });
    }

    public function down(): void
    {
        Schema::table('disposal_batches', function (Blueprint $table) {
            $table->dropColumn(['disposal_officer_role', 'disposal_officer_campus', 'disposal_officer_signature', 'destination', 'recipient_organization', 'recipient_position', 'recipient_signature', 'procurement_officer_email', 'campus_admin_email']);
        });
    }
};