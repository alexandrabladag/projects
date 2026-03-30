<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Meeting;
use App\Models\Document;
use App\Models\Project;
use App\Models\Proposal;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Create Roles ──────────────────────────────────────────────────────
        $adminRole   = Role::firstOrCreate(['name' => 'admin']);
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $clientRole  = Role::firstOrCreate(['name' => 'client']);

        // ── Create Users ──────────────────────────────────────────────────────
        $admin = User::firstOrCreate(['email' => 'admin@projectflow.com'], [
            'name'     => 'Alex Rivera',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole($adminRole);

        $manager = User::firstOrCreate(['email' => 'manager@projectflow.com'], [
            'name'     => 'Jennifer Wu',
            'password' => Hash::make('password'),
        ]);
        $manager->assignRole($managerRole);

        $client1 = User::firstOrCreate(['email' => 'sarah.chen@meridiancg.com'], [
            'name'     => 'Sarah Chen',
            'password' => Hash::make('password'),
        ]);
        $client1->assignRole($clientRole);

        $client2 = User::firstOrCreate(['email' => 'm.williams@coastalrealty.com'], [
            'name'     => 'Marcus Williams',
            'password' => Hash::make('password'),
        ]);
        $client2->assignRole($clientRole);

        // ── Project 1: Meridian Brand Refresh ────────────────────────────────
        $p1 = Project::firstOrCreate(['name' => 'Meridian Brand Refresh'], [
            'client'         => 'Meridian Capital Group',
            'contact_name'   => 'Sarah Chen',
            'contact_email'  => 'sarah.chen@meridiancg.com',
            'contact_phone'  => '+1 (415) 555-0182',
            'status'         => 'active',
            'start_date'     => '2026-01-15',
            'end_date'       => '2026-06-30',
            'budget'         => 85000,
            'spent'          => 42500,
            'progress'       => 55,
            'phase'          => 'Design Phase',
            'description'    => 'Complete brand identity refresh including logo redesign, brand guidelines, marketing collateral, and digital presence update. The project aims to reposition Meridian as the premier boutique investment firm in the Pacific Northwest.',
            'tags'           => ['Branding', 'Design'],
            'manager_id'     => $admin->id,
            'client_user_id' => $client1->id,
        ]);

        // Proposal
        Proposal::firstOrCreate(['project_id' => $p1->id, 'title' => 'Brand Refresh Proposal'], [
            'status'       => 'approved',
            'amount'       => 85000,
            'date'         => '2025-12-15',
            'valid_until'  => '2026-01-15',
            'summary'      => 'We propose a comprehensive brand identity refresh that will position Meridian Capital Group as the premier boutique investment firm in the Pacific Northwest, reflecting their values of precision, trust, and long-term thinking.',
            'scope'        => "Logo redesign and identity system\nBrand guidelines document (80+ pages)\nBusiness card and stationery suite\nDigital asset library (web, social, print)\nWebsite redesign consultation",
            'deliverables' => ['Brand Strategy Document', 'Logo Suite (all formats)', 'Brand Guidelines', 'Stationery Suite', 'Digital Asset Library'],
            'notes'        => 'Payment: 40% on signing, 30% at design approval, 30% on final delivery.',
        ]);

        // Invoices
        $inv1 = Invoice::firstOrCreate(['number' => 'INV-2026-001'], [
            'project_id'  => $p1->id,
            'status'      => 'paid',
            'date'        => '2026-01-16',
            'due_date'    => '2026-02-15',
            'description' => 'Initial retainer — 40% of project total',
        ]);
        if ($inv1->wasRecentlyCreated) {
            $inv1->items()->createMany([
                ['description' => 'Brand Strategy & Discovery', 'quantity' => 1, 'rate' => 15000],
                ['description' => 'Logo Design & Identity System', 'quantity' => 1, 'rate' => 12000],
                ['description' => 'Project Management', 'quantity' => 1, 'rate' => 7000],
            ]);
        }

        $inv2 = Invoice::firstOrCreate(['number' => 'INV-2026-004'], [
            'project_id'  => $p1->id,
            'status'      => 'paid',
            'date'        => '2026-03-01',
            'due_date'    => '2026-03-31',
            'description' => 'Design approval milestone — 30%',
        ]);
        if ($inv2->wasRecentlyCreated) {
            $inv2->items()->createMany([
                ['description' => 'Brand Guidelines Document', 'quantity' => 1, 'rate' => 12000],
                ['description' => 'Stationery & Collateral Suite', 'quantity' => 1, 'rate' => 8500],
                ['description' => 'Digital Asset Library', 'quantity' => 1, 'rate' => 5000],
            ]);
        }

        $inv3 = Invoice::firstOrCreate(['number' => 'INV-2026-009'], [
            'project_id'  => $p1->id,
            'status'      => 'draft',
            'date'        => '2026-06-30',
            'due_date'    => '2026-07-30',
            'description' => 'Final delivery milestone — 30%',
        ]);
        if ($inv3->wasRecentlyCreated) {
            $inv3->items()->createMany([
                ['description' => 'Final Deliverables & Handoff', 'quantity' => 1, 'rate' => 20000],
                ['description' => 'Revisions & Amendments', 'quantity' => 1, 'rate' => 5500],
            ]);
        }

        // Meetings
        Meeting::firstOrCreate(['project_id' => $p1->id, 'title' => 'Project Kickoff Meeting'], [
            'type'      => 'kickoff',
            'date'      => '2026-01-20',
            'time'      => '10:00 AM',
            'duration'  => '2 hrs',
            'location'  => 'Zoom',
            'status'    => 'completed',
            'attendees' => ['Sarah Chen', 'David Park', 'Jennifer Wu', 'Alex Rivera'],
            'notes'     => 'Reviewed scope, timeline, and deliverables. Sarah confirmed approval of initial mood boards. Next: brand strategy document by Feb 1.',
        ]);
        Meeting::firstOrCreate(['project_id' => $p1->id, 'title' => 'Logo Concepts Review'], [
            'type'      => 'review',
            'date'      => '2026-02-12',
            'time'      => '2:00 PM',
            'duration'  => '1.5 hrs',
            'location'  => 'Meridian Offices, 4F',
            'status'    => 'completed',
            'attendees' => ['Sarah Chen', 'James Meridian', 'Alex Rivera'],
            'notes'     => 'Presented 3 logo directions. Client preferred Direction B. Approved move to brand guidelines phase.',
        ]);
        Meeting::firstOrCreate(['project_id' => $p1->id, 'title' => 'Final Brand Presentation'], [
            'type'      => 'presentation',
            'date'      => '2026-06-15',
            'time'      => '3:00 PM',
            'duration'  => '2 hrs',
            'location'  => 'Meridian Boardroom',
            'status'    => 'scheduled',
            'attendees' => ['Sarah Chen', 'James Meridian', 'Board Members', 'Alex Rivera'],
            'notes'     => '',
        ]);

        // Documents
        Document::firstOrCreate(['project_id' => $p1->id, 'name' => 'Signed Contract — Meridian Brand Refresh'], [
            'type'      => 'contract',
            'file_size' => '2.4 MB',
            'added_by'  => $admin->id,
        ]);
        Document::firstOrCreate(['project_id' => $p1->id, 'name' => 'Brand Strategy Document v1.0'], [
            'type'      => 'report',
            'file_size' => '5.8 MB',
            'added_by'  => $admin->id,
        ]);
        Document::firstOrCreate(['project_id' => $p1->id, 'name' => 'Logo Concepts — Direction A, B, C'], [
            'type'      => 'asset',
            'file_size' => '24.1 MB',
            'added_by'  => $manager->id,
        ]);

        // Tasks
        Task::firstOrCreate(['project_id' => $p1->id, 'title' => 'Finalize Brand Guidelines Document'], [
            'assignee' => 'Jennifer Wu',
            'due_date' => '2026-05-15',
            'priority' => 'high',
            'status'   => 'in-progress',
            'category' => 'Deliverable',
        ]);
        Task::firstOrCreate(['project_id' => $p1->id, 'title' => 'Complete Digital Asset Library'], [
            'assignee' => 'Alex Rivera',
            'due_date' => '2026-05-30',
            'priority' => 'high',
            'status'   => 'in-progress',
            'category' => 'Deliverable',
        ]);
        Task::firstOrCreate(['project_id' => $p1->id, 'title' => 'Prepare Final Presentation Deck'], [
            'assignee' => 'Alex Rivera',
            'due_date' => '2026-06-10',
            'priority' => 'medium',
            'status'   => 'not-started',
            'category' => 'Client Communication',
        ]);
        Task::firstOrCreate(['project_id' => $p1->id, 'title' => 'Client Review: Stationery Suite'], [
            'assignee' => 'Sarah Chen',
            'due_date' => '2026-04-20',
            'priority' => 'medium',
            'status'   => 'completed',
            'category' => 'Client Approval',
        ]);

        // ── Project 2: Coastal Properties Platform ────────────────────────────
        $p2 = Project::firstOrCreate(['name' => 'Coastal Properties Platform'], [
            'client'         => 'Coastal Realty Partners',
            'contact_name'   => 'Marcus Williams',
            'contact_email'  => 'm.williams@coastalrealty.com',
            'contact_phone'  => '+1 (310) 555-0247',
            'status'         => 'active',
            'start_date'     => '2026-02-01',
            'end_date'       => '2026-08-15',
            'budget'         => 120000,
            'spent'          => 28000,
            'progress'       => 25,
            'phase'          => 'Discovery',
            'description'    => 'Custom property listing platform with CRM integration, virtual tour capabilities, and automated marketing tools for Coastal Realty\'s expanding portfolio.',
            'tags'           => ['Web', 'Platform'],
            'manager_id'     => $manager->id,
            'client_user_id' => $client2->id,
        ]);

        Proposal::firstOrCreate(['project_id' => $p2->id, 'title' => 'Custom Platform Development Proposal'], [
            'status'       => 'approved',
            'amount'       => 120000,
            'date'         => '2026-01-10',
            'valid_until'  => '2026-02-10',
            'summary'      => 'Coastal Realty Partners requires a scalable, modern platform to streamline property listings, client management, and marketing automation across their growing portfolio.',
            'scope'        => "Platform architecture and development\nCRM integration (Salesforce)\nVirtual tour module\nMarketing automation tools\nAdmin dashboard\nTraining and documentation",
            'deliverables' => ['Technical Specification', 'Custom Web Platform', 'CRM Integration', 'Virtual Tour Module', 'Admin Dashboard', 'Training Docs'],
            'notes'        => 'Hosting and maintenance to be billed separately at $2,400/year.',
        ]);

        $inv4 = Invoice::firstOrCreate(['number' => 'INV-2026-002'], [
            'project_id'  => $p2->id,
            'status'      => 'paid',
            'date'        => '2026-02-02',
            'due_date'    => '2026-03-01',
            'description' => 'Project kickoff — 40% retainer',
        ]);
        if ($inv4->wasRecentlyCreated) {
            $inv4->items()->createMany([
                ['description' => 'Platform Architecture & Planning', 'quantity' => 1, 'rate' => 25000],
                ['description' => 'Discovery & Requirements', 'quantity' => 1, 'rate' => 15000],
                ['description' => 'Project Setup', 'quantity' => 1, 'rate' => 8000],
            ]);
        }

        $inv5 = Invoice::firstOrCreate(['number' => 'INV-2026-007'], [
            'project_id'  => $p2->id,
            'status'      => 'sent',
            'date'        => '2026-03-15',
            'due_date'    => '2026-04-14',
            'description' => 'Development Milestone 1',
        ]);
        if ($inv5->wasRecentlyCreated) {
            $inv5->items()->createMany([
                ['description' => 'Core Platform Development — Sprint 1 & 2', 'quantity' => 1, 'rate' => 28000],
                ['description' => 'QA & Testing', 'quantity' => 1, 'rate' => 8000],
            ]);
        }

        Meeting::firstOrCreate(['project_id' => $p2->id, 'title' => 'Platform Kickoff & Discovery'], [
            'type'      => 'kickoff',
            'date'      => '2026-02-05',
            'time'      => '9:00 AM',
            'duration'  => '3 hrs',
            'location'  => 'Coastal Realty HQ',
            'status'    => 'completed',
            'attendees' => ['Marcus Williams', 'Lisa Torres', 'Sam Chen'],
            'notes'     => 'Discovery completed. 12 key requirements identified.',
        ]);
        Meeting::firstOrCreate(['project_id' => $p2->id, 'title' => 'Sprint 1 Demo'], [
            'type'      => 'review',
            'date'      => '2026-04-15',
            'time'      => '2:00 PM',
            'duration'  => '1.5 hrs',
            'location'  => 'Zoom',
            'status'    => 'scheduled',
            'attendees' => ['Marcus Williams', 'Lisa Torres', 'Dev Team'],
            'notes'     => '',
        ]);

        Document::firstOrCreate(['project_id' => $p2->id, 'name' => 'Signed Contract — Platform Development'], [
            'type'      => 'contract',
            'file_size' => '3.1 MB',
            'added_by'  => $manager->id,
        ]);
        Document::firstOrCreate(['project_id' => $p2->id, 'name' => 'Technical Requirements Specification'], [
            'type'      => 'report',
            'file_size' => '4.7 MB',
            'added_by'  => $manager->id,
        ]);

        Task::firstOrCreate(['project_id' => $p2->id, 'title' => 'Complete Discovery Documentation'], [
            'assignee' => 'Sam Chen',
            'due_date' => '2026-02-28',
            'priority' => 'high',
            'status'   => 'completed',
            'category' => 'Discovery',
        ]);
        Task::firstOrCreate(['project_id' => $p2->id, 'title' => 'Client Sign-off on Wireframes'], [
            'assignee' => 'Marcus Williams',
            'due_date' => '2026-04-05',
            'priority' => 'high',
            'status'   => 'in-progress',
            'category' => 'Client Approval',
        ]);

        $this->command->info('✅ Database seeded successfully.');
        $this->command->info('   admin@projectflow.com / password');
        $this->command->info('   manager@projectflow.com / password');
        $this->command->info('   sarah.chen@meridiancg.com / password (client)');
    }
}
