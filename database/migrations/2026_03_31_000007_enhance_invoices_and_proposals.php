<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('payment_stage')->nullable()->after('description');
            $table->text('payment_notes')->nullable()->after('payment_stage');
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->text('sections')->nullable()->after('notes'); // JSON array of {title, content}
            $table->text('exclusions')->nullable()->after('sections');
            $table->text('timeline')->nullable()->after('exclusions'); // JSON array of {phase, description, duration}
            $table->text('payment_schedule')->nullable()->after('timeline'); // JSON array of {phase, milestone, amount}
            $table->string('prepared_by')->nullable()->after('payment_schedule');
            $table->string('prepared_by_title')->nullable()->after('prepared_by');
            $table->string('approved_by')->nullable()->after('prepared_by_title');
            $table->string('approved_by_title')->nullable()->after('approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['payment_stage', 'payment_notes']);
        });
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropColumn(['sections', 'exclusions', 'timeline', 'payment_schedule', 'prepared_by', 'prepared_by_title', 'approved_by', 'approved_by_title']);
        });
    }
};
