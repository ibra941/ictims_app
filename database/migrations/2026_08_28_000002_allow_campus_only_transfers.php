<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE asset_transfers DROP FOREIGN KEY asset_transfers_to_dept_id_foreign');
        DB::statement('ALTER TABLE asset_transfers MODIFY to_dept_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE asset_transfers ADD CONSTRAINT asset_transfers_to_dept_id_foreign FOREIGN KEY (to_dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE asset_transfers DROP FOREIGN KEY asset_transfers_to_dept_id_foreign');
        DB::statement('ALTER TABLE asset_transfers MODIFY to_dept_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE asset_transfers ADD CONSTRAINT asset_transfers_to_dept_id_foreign FOREIGN KEY (to_dept_id) REFERENCES departments(dept_id) ON DELETE RESTRICT');
    }
};