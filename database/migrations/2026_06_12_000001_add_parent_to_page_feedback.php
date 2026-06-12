<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('page_feedback', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('project_page_id')
                ->constrained('page_feedback')->cascadeOnDelete(); // reply → parent comment
        });
    }

    public function down(): void
    {
        Schema::table('page_feedback', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
        });
    }
};
