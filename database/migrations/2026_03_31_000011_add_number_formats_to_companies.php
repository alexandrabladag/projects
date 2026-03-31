<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('invoice_prefix')->default('INV')->after('logo_path');
            $table->string('invoice_format')->default('{PREFIX}-{YEAR}-{NUMBER}')->after('invoice_prefix');
            $table->string('proposal_prefix')->default('PROP')->after('invoice_format');
            $table->string('proposal_format')->default('{PREFIX}-{YEAR}-{NUMBER}')->after('proposal_prefix');
            $table->integer('next_invoice_number')->default(1)->after('proposal_format');
            $table->integer('next_proposal_number')->default(1)->after('next_invoice_number');
            $table->integer('number_padding')->default(3)->after('next_proposal_number');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['invoice_prefix', 'invoice_format', 'proposal_prefix', 'proposal_format', 'next_invoice_number', 'next_proposal_number', 'number_padding']);
        });
    }
};
