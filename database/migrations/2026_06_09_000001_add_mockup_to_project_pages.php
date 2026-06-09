<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_pages', function (Blueprint $table) {
            // When set, the page is a multi-file mockup served from disk instead of
            // a single HTML blob in `content`. `mockup_path` is the directory (on the
            // local disk) that acts as the site root; `entry_file` is the landing page.
            $table->string('mockup_path')->nullable()->after('content');
            $table->string('entry_file')->nullable()->after('mockup_path');
        });
    }

    public function down(): void
    {
        Schema::table('project_pages', function (Blueprint $table) {
            $table->dropColumn(['mockup_path', 'entry_file']);
        });
    }
};
