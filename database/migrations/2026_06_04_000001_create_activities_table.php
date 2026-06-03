<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->nullable()->index();
            $table->foreignId('project_id')->nullable()->index();
            $table->foreignId('user_id')->nullable();   // who performed the action
            $table->string('causer_name')->nullable();  // snapshot in case the user is removed
            $table->nullableMorphs('subject');          // the model the action was on
            $table->string('event');                    // created | updated | deleted
            $table->string('description');
            $table->json('properties')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
