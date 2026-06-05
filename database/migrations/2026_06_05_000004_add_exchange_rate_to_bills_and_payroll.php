<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bills and payroll can be in a different currency than the project.
     * exchange_rate converts the entry's currency into the project currency
     * (1 unit of the entry currency = exchange_rate units of project currency),
     * so project-level totals (spent, vendor bills) stay in one currency.
     */
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->decimal('exchange_rate', 14, 6)->default(1)->after('currency');
        });

        Schema::table('project_payroll', function (Blueprint $table) {
            $table->decimal('exchange_rate', 14, 6)->default(1)->after('currency');
        });
    }

    public function down(): void
    {
        Schema::table('bills', fn (Blueprint $t) => $t->dropColumn('exchange_rate'));
        Schema::table('project_payroll', fn (Blueprint $t) => $t->dropColumn('exchange_rate'));
    }
};
