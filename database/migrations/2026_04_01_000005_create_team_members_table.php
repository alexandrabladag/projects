<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('role')->nullable(); // e.g. Project Manager, Developer, Designer
            $table->string('department')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add project lead (internal team member) to projects
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('lead_id')->nullable()->after('manager_id')->constrained('team_members')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lead_id');
        });
        Schema::dropIfExists('team_members');
    }
};
