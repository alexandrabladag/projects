<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('page_feedback', function (Blueprint $table) {
            // SHA-256 of a per-comment secret held in the author's browser. Lets the author
            // (and only the author) edit their own anonymous comment. Never exposed in responses.
            $table->string('edit_token', 64)->nullable()->after('is_admin');
        });
    }

    public function down(): void
    {
        Schema::table('page_feedback', function (Blueprint $table) {
            $table->dropColumn('edit_token');
        });
    }
};
