<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('received_currency', 10)->nullable()->after('currency');
            $table->decimal('exchange_rate', 14, 6)->nullable()->after('received_currency');
            $table->decimal('received_amount', 14, 2)->nullable()->after('exchange_rate');
            $table->date('received_date')->nullable()->after('received_amount');
            $table->text('received_notes')->nullable()->after('received_date');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['received_currency', 'exchange_rate', 'received_amount', 'received_date', 'received_notes']);
        });
    }
};
