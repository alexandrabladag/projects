<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A project member can now reference either a directory client
     * (contractor/vendor) OR an internal team member.
     */
    public function up(): void
    {
        Schema::table('project_members', function (Blueprint $table) {
            $table->foreignId('team_member_id')->nullable()->after('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('project_members', function (Blueprint $table) {
            $table->dropConstrainedForeignId('team_member_id');
        });
    }
};
