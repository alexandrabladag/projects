<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('currency', 10)->default('USD')->after('budget');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('currency', 10)->default('USD')->after('description');
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->string('currency', 10)->default('USD')->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('projects', fn ($t) => $t->dropColumn('currency'));
        Schema::table('invoices', fn ($t) => $t->dropColumn('currency'));
        Schema::table('proposals', fn ($t) => $t->dropColumn('currency'));
    }
};
