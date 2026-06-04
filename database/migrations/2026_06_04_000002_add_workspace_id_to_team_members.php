<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Team members were never scoped to a workspace, so the Settings → Team Members
 * list leaked every workspace's members (names, emails, phones, pay rates).
 * This adds workspace_id and backfills it from each member's relationships.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->foreignId('workspace_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        // Resolve each member's workspace from the projects they lead, or the
        // projects they were paid on.
        $resolved = [];
        foreach (DB::table('team_members')->pluck('id') as $id) {
            $ws = DB::table('projects')->where('lead_id', $id)->value('workspace_id')
                ?? DB::table('project_payroll')
                    ->join('projects', 'projects.id', '=', 'project_payroll.project_id')
                    ->where('project_payroll.team_member_id', $id)
                    ->value('projects.workspace_id');

            if ($ws) {
                $resolved[$id] = $ws;
            }
        }

        // If every attributable member belongs to a single workspace, the rest
        // (with no relational signal) almost certainly do too — fall back to it.
        $distinct  = array_values(array_unique($resolved));
        $fallback  = count($distinct) === 1 ? $distinct[0] : null;

        foreach (DB::table('team_members')->pluck('id') as $id) {
            $ws = $resolved[$id] ?? $fallback;
            if ($ws) {
                DB::table('team_members')->where('id', $id)->update(['workspace_id' => $ws]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropConstrainedForeignId('workspace_id');
        });
    }
};
