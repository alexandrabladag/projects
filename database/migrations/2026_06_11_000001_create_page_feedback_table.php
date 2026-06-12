<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_page_id')->constrained()->cascadeOnDelete();
            $table->string('author_name')->nullable();
            $table->text('body');
            $table->string('page_path')->nullable(); // which sub-page/URL of a multi-page mockup
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_feedback');
    }
};
