<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The original enum's CHECK constraint would reject the new "pending-approval"
        // value, so relax the column to a plain string. Allowed values are still
        // enforced by validation in TaskController.
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('status')->default('not-started')->change();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', ['not-started', 'in-progress', 'review', 'completed'])
                  ->default('not-started')->change();
        });
    }
};
