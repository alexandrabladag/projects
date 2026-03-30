<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/auth.php';

Route::get('/', fn () => redirect()->route('dashboard'));

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('projects', ProjectController::class);

    Route::patch('projects/{project}/progress', [ProjectController::class, 'updateProgress'])
        ->name('projects.progress')
        ->middleware('role:admin|manager');

    Route::prefix('projects/{project}')->name('projects.')->group(function () {
        Route::post('proposals',              [ProposalController::class, 'store'])->name('proposals.store');
        Route::put('proposals/{proposal}',    [ProposalController::class, 'update'])->name('proposals.update');
        Route::delete('proposals/{proposal}', [ProposalController::class, 'destroy'])->name('proposals.destroy');

        Route::post('invoices',              [InvoiceController::class, 'store'])->name('invoices.store');
        Route::put('invoices/{invoice}',     [InvoiceController::class, 'update'])->name('invoices.update');
        Route::delete('invoices/{invoice}',  [InvoiceController::class, 'destroy'])->name('invoices.destroy');

        Route::post('meetings',              [MeetingController::class, 'store'])->name('meetings.store');
        Route::put('meetings/{meeting}',     [MeetingController::class, 'update'])->name('meetings.update');
        Route::delete('meetings/{meeting}',  [MeetingController::class, 'destroy'])->name('meetings.destroy');

        Route::post('documents',             [DocumentController::class, 'store'])->name('documents.store');
        Route::delete('documents/{document}',[DocumentController::class, 'destroy'])->name('documents.destroy');

        Route::post('tasks',                 [TaskController::class, 'store'])->name('tasks.store');
        Route::put('tasks/{task}',           [TaskController::class, 'update'])->name('tasks.update');
        Route::delete('tasks/{task}',        [TaskController::class, 'destroy'])->name('tasks.destroy');
    });

    Route::patch('proposals/{proposal}/status', [ProposalController::class, 'updateStatus'])
        ->name('proposals.status')->middleware('role:admin|manager');
    Route::patch('invoices/{invoice}/status',   [InvoiceController::class, 'updateStatus'])
        ->name('invoices.status')->middleware('role:admin|manager');
    Route::patch('meetings/{meeting}/status',   [MeetingController::class, 'updateStatus'])
        ->name('meetings.status')->middleware('role:admin|manager');
    Route::patch('tasks/{task}/status',         [TaskController::class, 'updateStatus'])
        ->name('tasks.status');
    Route::get('documents/{document}/download', [DocumentController::class, 'download'])
        ->name('documents.download');
});
