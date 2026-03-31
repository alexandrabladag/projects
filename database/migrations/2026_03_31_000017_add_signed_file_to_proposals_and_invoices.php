<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->string('signed_file_path')->nullable()->after('signed_date');
            $table->string('signed_file_name')->nullable()->after('signed_file_path');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('signed_file_path')->nullable()->after('received_notes');
            $table->string('signed_file_name')->nullable()->after('signed_file_path');
        });
    }

    public function down(): void
    {
        Schema::table('proposals', fn ($t) => $t->dropColumn(['signed_file_path', 'signed_file_name']));
        Schema::table('invoices', fn ($t) => $t->dropColumn(['signed_file_path', 'signed_file_name']));
    }
};
