<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create purchases table
        Schema::create('purchases', function (Blueprint $table) {
            $table->id('purch_id');
            $table->foreignId('supp_id')->constrained('suppliers', 'supp_id')->restrictOnDelete();
            $table->string('po_number', 50)->unique();
            $table->date('purch_date');
            $table->date('expected_delivery')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0.00);
            $table->enum('status', ['Draft', 'Ordered', 'Received', 'Cancelled'])->default('Draft');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('po_number', 'idx_purch_po');
            $table->index('supp_id', 'idx_purch_supp');
            $table->index('status', 'idx_purch_status');
            $table->index(['purch_date', 'status'], 'idx_purchases_date_status');
        });

        // Create purchase items table
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id('item_id');
            $table->foreignId('purch_id')->constrained('purchases', 'purch_id')->cascadeOnDelete();
            $table->foreignId('asset_id')->nullable()->constrained('assets', 'asset_id')->nullOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 15, 2)->default(0.00);
            $table->decimal('total_price', 15, 2)->default(0.00);
            $table->timestamps();
            $table->index('purch_id', 'idx_item_purch');
            $table->index('asset_id', 'idx_item_asset');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
    }
};
