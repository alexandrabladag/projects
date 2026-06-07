<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Company-level payment defaults (set once, pre-fill each invoice).
        Schema::table('companies', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('tax_id');
            $table->string('bank_account_name')->nullable()->after('bank_name');
            $table->string('bank_account_number')->nullable()->after('bank_account_name');
            $table->string('cheque_payable_to')->nullable()->after('bank_account_number');
        });

        // Per-invoice payment details (default from company, editable per invoice).
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('payment_notes');
            $table->string('bank_account_name')->nullable()->after('bank_name');
            $table->string('bank_account_number')->nullable()->after('bank_account_name');
            $table->string('cheque_payable_to')->nullable()->after('bank_account_number');
            $table->text('notes')->nullable()->after('cheque_payable_to');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'bank_account_name', 'bank_account_number', 'cheque_payable_to']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'bank_account_name', 'bank_account_number', 'cheque_payable_to', 'notes']);
        });
    }
};
