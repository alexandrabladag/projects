# ProjectFlow — Laravel + Inertia.js + React

A full-stack project management app for agencies and consultancies.  
Built with **Laravel 11 · Inertia.js v2 · React 18 · Tailwind CSS · Spatie Permissions**.

---

## Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Laravel 11                        |
| Frontend   | React 18 + Inertia.js v2          |
| Styling    | Tailwind CSS v3                   |
| Auth       | Laravel Breeze (Inertia/React)    |
| Roles/ACL  | Spatie Laravel-Permission         |
| Database   | MySQL / PostgreSQL / SQLite       |
| Build      | Vite                              |

---

## Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url> projectflow
cd projectflow

composer install
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=projectflow
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Database Setup

```bash
php artisan migrate --seed
```

This will create all tables and seed:
- **Admin user**: `admin@projectflow.com` / `password`
- **Manager user**: `manager@projectflow.com` / `password`
- **Client user**: `client@projectflow.com` / `password`
- Sample projects, proposals, invoices, meetings, documents, tasks

### 4. Run the App

```bash
# Terminal 1 — Laravel
php artisan serve

# Terminal 2 — Vite (React)
npm run dev
```

Visit: http://localhost:8000

---

## Roles & Permissions

| Role    | Capabilities                                                        |
|---------|---------------------------------------------------------------------|
| Admin   | Full access — manage users, all projects, all data                  |
| Manager | Create & manage projects, proposals, invoices, meetings, tasks      |
| Client  | View only their assigned projects, proposals, invoices, documents   |

---

## File Structure

```
projectflow/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/               # Breeze auth controllers
│   │   │   ├── DashboardController.php
│   │   │   ├── ProjectController.php
│   │   │   ├── ProposalController.php
│   │   │   ├── InvoiceController.php
│   │   │   ├── MeetingController.php
│   │   │   ├── DocumentController.php
│   │   │   └── TaskController.php
│   │   └── Middleware/
│   │       └── HandleInertiaRequests.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Project.php
│   │   ├── Proposal.php
│   │   ├── Invoice.php
│   │   ├── InvoiceItem.php
│   │   ├── Meeting.php
│   │   ├── Document.php
│   │   └── Task.php
│   └── Policies/
│       └── ProjectPolicy.php
├── database/
│   ├── migrations/
│   └── seeders/
├── resources/
│   └── js/
│       ├── app.jsx
│       ├── Layouts/
│       │   ├── AppLayout.jsx       # Main authenticated layout with sidebar
│       │   └── GuestLayout.jsx     # Auth pages layout
│       ├── Components/
│       │   ├── Badge.jsx
│       │   ├── Modal.jsx
│       │   ├── ProgressBar.jsx
│       │   └── StatCard.jsx
│       └── Pages/
│           ├── Auth/
│           │   ├── Login.jsx
│           │   └── Register.jsx
│           ├── Dashboard.jsx
│           └── Projects/
│               ├── Index.jsx
│               ├── Show.jsx        # Tabbed project detail (all 7 tabs)
│               └── Create.jsx
├── routes/
│   └── web.php
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Key Concepts

### Inertia.js Pattern
Controllers return `Inertia::render()` instead of views:
```php
// Controller
return Inertia::render('Projects/Show', [
    'project' => $project->load(['proposals', 'invoices', 'meetings', 'documents', 'tasks']),
]);
```

React pages receive props directly:
```jsx
// Pages/Projects/Show.jsx
export default function Show({ project }) {
    return <AppLayout>{/* use project.proposals, project.invoices, etc. */}</AppLayout>;
}
```

### Forms with Inertia
```jsx
import { useForm } from '@inertiajs/react';

const { data, setData, post, processing, errors } = useForm({ name: '', client: '' });
const submit = () => post(route('projects.store'));
```

### Role Checks in React
The authenticated user + roles are shared globally via `HandleInertiaRequests`:
```jsx
import { usePage } from '@inertiajs/react';
const { auth } = usePage().props;
// auth.user.roles = ['admin'] | ['manager'] | ['client']
const isAdmin = auth.user.roles.includes('admin');
```

---

## Commands

```bash
php artisan migrate:fresh --seed   # Reset DB with fresh seed data
php artisan make:model Foo -mrc    # New model + migration + resource controller
npm run build                      # Production build
```
