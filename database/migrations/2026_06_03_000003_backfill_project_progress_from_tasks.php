<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Set each project's progress from its task completion. Projects with no
        // tasks are left untouched so their manually-set progress is preserved.
        $projectIds = DB::table('projects')->whereNull('deleted_at')->pluck('id');

        foreach ($projectIds as $id) {
            $total = DB::table('tasks')->where('project_id', $id)->count();
            if ($total === 0) {
                continue;
            }
            $completed = DB::table('tasks')
                ->where('project_id', $id)
                ->where('status', 'completed')
                ->count();

            DB::table('projects')->where('id', $id)->update([
                'progress' => (int) round($completed / $total * 100),
            ]);
        }
    }

    public function down(): void
    {
        // No-op: progress is derived data; nothing meaningful to revert.
    }
};
