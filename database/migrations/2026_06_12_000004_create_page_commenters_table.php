<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Lightweight "client" accounts used only to leave feedback on a project's shared
        // pages. Separate from the team/client-portal `users` table — these never sign into
        // the app. Scoped to one project, so the same email may register under each project.
        Schema::create('page_commenters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->timestamps();
            $table->unique(['project_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_commenters');
    }
};
