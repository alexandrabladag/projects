<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique(); // used as subdomain
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // Link users to workspaces
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('workspace_id')->nullable()->after('id')->constrained('workspaces')->nullOnDelete();
        });

        // Add workspace_id to all tenant-scoped tables
        $tables = ['companies', 'clients', 'projects'];
        foreach ($tables as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->foreignId('workspace_id')->nullable()->after('id')->constrained('workspaces')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (['projects', 'clients', 'companies', 'users'] as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->dropConstrainedForeignId('workspace_id');
            });
        }
        Schema::dropIfExists('workspaces');
    }
};
