<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('page_feedback', function (Blueprint $table) {
            // Owner of a client comment. Admin replies (is_admin) leave this null.
            // Editing a comment now requires being signed in as its owner — the
            // per-comment edit_token flow is retired in favour of accounts.
            $table->foreignId('page_commenter_id')->nullable()->after('project_page_id')
                ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('page_feedback', function (Blueprint $table) {
            $table->dropConstrainedForeignId('page_commenter_id');
        });
    }
};
