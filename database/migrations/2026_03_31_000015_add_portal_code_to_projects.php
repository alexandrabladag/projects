<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('portal_code', 32)->nullable()->unique()->after('client_user_id');
            $table->boolean('portal_enabled')->default(false)->after('portal_code');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['portal_code', 'portal_enabled']);
        });
    }
};
