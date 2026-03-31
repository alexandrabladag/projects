<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/auth.php';

Route::get('/', function () {
    $user = auth()->user();
    if ($user && $user->isClient()) {
        return redirect()->route('portal.dashboard');
    }
    return redirect()->route('dashboard');
});

// ── Public Client Portal (no auth needed) ────────────────────────────────────
Route::get('/p/{code}', [\App\Http\Controllers\PublicPortalController::class, 'show'])->name('portal.public');

// ── Client Portal (auth) ─────────────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->prefix('portal')->name('portal.')->group(function () {
    Route::get('/',              [PortalController::class, 'dashboard'])->name('dashboard');
    Route::get('/project/{project}', [PortalController::class, 'project'])->name('project');
});

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('projects', ProjectController::class);
    Route::resource('directory', ClientController::class)->parameters(['directory' => 'client'])->names('clients');
    Route::post('directory/{client}/contacts', [ContactController::class, 'store'])->name('clients.contacts.store');
    Route::put('contacts/{contact}', [ContactController::class, 'update'])->name('contacts.update');
    Route::delete('contacts/{contact}', [ContactController::class, 'destroy'])->name('contacts.destroy');

    Route::get('settings/company', [CompanyController::class, 'edit'])->name('company.edit');
    Route::post('settings/company', [CompanyController::class, 'update'])->name('company.update');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('settings/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

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

        Route::post('client-access',         [\App\Http\Controllers\ClientAccessController::class, 'store'])->name('client-access.store');
        Route::delete('client-access',       [\App\Http\Controllers\ClientAccessController::class, 'destroy'])->name('client-access.destroy');
        Route::patch('portal-toggle',        [ProjectController::class, 'togglePortal'])->name('portal-toggle');

        Route::post('members',               [\App\Http\Controllers\ProjectMemberController::class, 'store'])->name('members.store');
        Route::delete('members/{member}',    [\App\Http\Controllers\ProjectMemberController::class, 'destroy'])->name('members.destroy');

        Route::post('tasks',                 [TaskController::class, 'store'])->name('tasks.store');
        Route::put('tasks/{task}',           [TaskController::class, 'update'])->name('tasks.update');
        Route::delete('tasks/{task}',        [TaskController::class, 'destroy'])->name('tasks.destroy');
    });

    Route::patch('proposals/{proposal}/status', [ProposalController::class, 'updateStatus'])
        ->name('proposals.status')->middleware('role:admin|manager');
    Route::patch('invoices/{invoice}/payment',   [InvoiceController::class, 'recordPayment'])
        ->name('invoices.payment');
    Route::patch('invoices/{invoice}/status',   [InvoiceController::class, 'updateStatus'])
        ->name('invoices.status')->middleware('role:admin|manager');
    Route::patch('meetings/{meeting}/status',   [MeetingController::class, 'updateStatus'])
        ->name('meetings.status')->middleware('role:admin|manager');
    Route::patch('tasks/{task}/status',         [TaskController::class, 'updateStatus'])
        ->name('tasks.status');
    Route::get('documents/{document}/download', [DocumentController::class, 'download'])
        ->name('documents.download');

    Route::get('invoices/{invoice}/view', [InvoiceController::class, 'show'])->name('invoices.view');
    Route::get('proposals/{proposal}/view', [ProposalController::class, 'show'])->name('proposals.view');
});
