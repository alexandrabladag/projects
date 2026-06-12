<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('page_feedback', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('author_name'); // reply authored by the team
        });
    }

    public function down(): void
    {
        Schema::table('page_feedback', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
