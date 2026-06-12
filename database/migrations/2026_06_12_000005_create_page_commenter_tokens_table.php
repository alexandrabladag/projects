<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per active login (per device/browser). Stores only the SHA-256 of the
        // bearer token the commenter's browser holds — the raw token is shown once at login.
        Schema::create('page_commenter_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_commenter_id')->constrained()->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_commenter_tokens');
    }
};
