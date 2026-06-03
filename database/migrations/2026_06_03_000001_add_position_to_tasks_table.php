<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->unsignedInteger('position')->default(0)->after('category');
        });

        // Seed positions from current id order so existing tasks keep a stable order.
        $tasks = DB::table('tasks')->orderBy('project_id')->orderBy('id')->get(['id', 'project_id']);
        $perProject = [];
        foreach ($tasks as $task) {
            $i = $perProject[$task->project_id] ?? 0;
            DB::table('tasks')->where('id', $task->id)->update(['position' => $i]);
            $perProject[$task->project_id] = $i + 1;
        }
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('position');
        });
    }
};
