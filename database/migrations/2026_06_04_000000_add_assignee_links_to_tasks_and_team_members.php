<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Link a team member to a login account so that person can see "My Tasks".
        Schema::table('team_members', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        // Assign a task to a team member (the free-text `assignee` is kept as a
        // display snapshot for backward compatibility).
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('assignee_id')->nullable()->after('assignee')->constrained('team_members')->nullOnDelete();
        });

        // Backfill assignee_id by matching the existing assignee name to a team member.
        $members = DB::table('team_members')->get(['id', 'name']);
        foreach ($members as $member) {
            DB::table('tasks')
                ->whereNull('assignee_id')
                ->whereRaw('LOWER(TRIM(assignee)) = ?', [strtolower(trim($member->name))])
                ->update(['assignee_id' => $member->id]);
        }
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assignee_id');
        });
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
