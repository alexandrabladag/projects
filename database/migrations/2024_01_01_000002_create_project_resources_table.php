<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Proposals ─────────────────────────────────────────────────────────
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->enum('status', ['draft', 'sent', 'approved', 'rejected'])->default('draft');
            $table->decimal('amount', 12, 2)->default(0);
            $table->date('date');
            $table->date('valid_until')->nullable();
            $table->text('summary')->nullable();
            $table->text('scope')->nullable();
            $table->json('deliverables')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── Invoices ──────────────────────────────────────────────────────────
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('number')->unique();
            $table->enum('status', ['draft', 'sent', 'paid', 'overdue'])->default('draft');
            $table->date('date');
            $table->date('due_date')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // ── Invoice Items ─────────────────────────────────────────────────────
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('rate', 12, 2)->default(0);
            $table->timestamps();
        });

        // ── Meetings ──────────────────────────────────────────────────────────
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['kickoff', 'review', 'checkin', 'presentation', 'discovery', 'other'])
                  ->default('checkin');
            $table->string('title');
            $table->date('date');
            $table->string('time')->nullable();
            $table->string('duration')->nullable();
            $table->string('location')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->json('attendees')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── Documents ─────────────────────────────────────────────────────────
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['contract', 'brief', 'report', 'asset', 'other'])->default('other');
            $table->string('file_path')->nullable();
            $table->string('file_size')->nullable();
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // ── Tasks ─────────────────────────────────────────────────────────────
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('assignee')->nullable();
            $table->date('due_date')->nullable();
            $table->enum('priority', ['high', 'medium', 'low'])->default('medium');
            $table->enum('status', ['not-started', 'in-progress', 'review', 'completed'])
                  ->default('not-started');
            $table->string('category')->default('General');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('meetings');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('proposals');
    }
};
