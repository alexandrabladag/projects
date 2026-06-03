<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('color', 20)->default('#6b7280');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['workspace_id', 'name']);
        });

        // Backfill the catalog from categories already used on existing tasks.
        $rows = DB::table('tasks')
            ->join('projects', 'tasks.project_id', '=', 'projects.id')
            ->select('projects.workspace_id', 'tasks.category')
            ->whereNotNull('tasks.category')
            ->where('tasks.category', '!=', '')
            ->distinct()
            ->get();

        $now = now();
        $seen = [];
        foreach ($rows as $row) {
            $key = $row->workspace_id . '|' . $row->category;
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;

            DB::table('task_categories')->insert([
                'workspace_id' => $row->workspace_id,
                'name'         => $row->category,
                'color'        => '#6b7280',
                'position'     => 0,
                'created_at'   => $now,
                'updated_at'   => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('task_categories');
    }
};
