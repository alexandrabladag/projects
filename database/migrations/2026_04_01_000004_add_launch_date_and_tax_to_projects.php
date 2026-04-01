<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->date('launch_date')->nullable()->after('end_date');
            $table->string('tax_type')->nullable()->after('currency'); // none, vat, gst, sales_tax, withholding
            $table->decimal('tax_rate', 5, 2)->default(0)->after('tax_type'); // e.g. 12.00 for 12%
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['launch_date', 'tax_type', 'tax_rate']);
        });
    }
};
