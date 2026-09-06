<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disposal_batches', function (Blueprint $table) {
            $table->id('batch_id');
            $table->foreignId('authorized_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->string('disposal_officer', 150);
            $table->string('recipient_name', 150);
            $table->string('recipient_contact', 150)->nullable();
            $table->date('disposal_date');
            $table->string('method', 50);
            $table->text('reason');
            $table->string('procurement_signatory', 150)->nullable();
            $table->string('campus_admin_signatory', 150)->nullable();
            $table->timestamps();
        });

        Schema::table('asset_disposal', function (Blueprint $table) {
            $table->dropForeign(['asset_id']);
            $table->foreignId('batch_id')->nullable()->after('disposal_id')->constrained('disposal_batches', 'batch_id')->nullOnDelete();
            $table->json('asset_snapshot')->nullable()->after('asset_id');
        });
    }

    public function down(): void
    {
        Schema::table('asset_disposal', function (Blueprint $table) {
            $table->dropConstrainedForeignId('batch_id');
            $table->dropColumn('asset_snapshot');
            $table->foreign('asset_id')->references('asset_id')->on('assets')->restrictOnDelete();
        });

        Schema::dropIfExists('disposal_batches');
    }
};
