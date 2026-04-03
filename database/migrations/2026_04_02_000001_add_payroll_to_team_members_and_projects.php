<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add rate info to team members
        Schema::table('team_members', function (Blueprint $table) {
            $table->string('pay_type')->default('monthly')->after('department'); // hourly, monthly, fixed
            $table->decimal('rate', 14, 2)->default(0)->after('pay_type');
            $table->string('rate_currency', 10)->default('PHP')->after('rate');
        });

        // Payroll entries per project
        Schema::create('project_payroll', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_member_id')->constrained()->cascadeOnDelete();
            $table->string('period'); // e.g. "Apr 2026", "Week 14", "Sprint 3"
            $table->string('pay_type'); // hourly, monthly, fixed
            $table->decimal('rate', 14, 2);
            $table->decimal('hours', 8, 2)->nullable(); // for hourly
            $table->decimal('amount', 14, 2);
            $table->string('currency', 10)->default('PHP');
            $table->string('status')->default('pending'); // pending, paid
            $table->date('paid_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_payroll');
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropColumn(['pay_type', 'rate', 'rate_currency']);
        });
    }
};
