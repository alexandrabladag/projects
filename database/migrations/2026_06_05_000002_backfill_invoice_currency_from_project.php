<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Invoices defaulted to 'USD' and never had their currency set, so they
     * mismatched their project's currency. Align each invoice with its project.
     */
    public function up(): void
    {
        DB::statement('
            UPDATE invoices
            SET currency = (
                SELECT currency FROM projects WHERE projects.id = invoices.project_id
            )
            WHERE EXISTS (
                SELECT 1 FROM projects WHERE projects.id = invoices.project_id
            )
        ');
    }

    public function down(): void
    {
        // No-op: original per-invoice currency was never stored.
    }
};
