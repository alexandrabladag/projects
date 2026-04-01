<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete(); // vendor/contractor
            $table->string('number')->nullable(); // vendor's invoice number
            $table->string('status')->default('pending'); // pending | approved | paid
            $table->decimal('amount', 14, 2);
            $table->string('currency', 10)->default('USD');
            $table->date('date');
            $table->date('due_date')->nullable();
            $table->string('description')->nullable();
            $table->string('category')->nullable(); // Design, Development, Hosting, etc.
            $table->decimal('paid_amount', 14, 2)->nullable();
            $table->string('paid_currency', 10)->nullable();
            $table->date('paid_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
