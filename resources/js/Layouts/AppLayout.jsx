import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { LayoutDashboard, FolderKanban, Building2, UserCircle, Settings, Plus, CircleCheck, CircleX, X } from 'lucide-react';

// ── Reusable Badge ─────────────────────────────────────────────────────────────
export function Badge({ status, label }) {
    const map = {
        active:       'bg-emerald-50 text-emerald-600 border border-emerald-200',
        completed:    'bg-blue-50 text-blue-600 border border-blue-200',
        'on-hold':    'bg-amber-50 text-amber-600 border border-amber-200',
        draft:        'bg-gray-50 text-gray-500 border border-gray-200',
        sent:         'bg-indigo-50 text-indigo-600 border border-indigo-200',
        approved:     'bg-emerald-50 text-emerald-600 border border-emerald-200',
        rejected:     'bg-red-50 text-red-600 border border-red-200',
        paid:         'bg-emerald-50 text-emerald-600 border border-emerald-200',
        overdue:      'bg-red-50 text-red-600 border border-red-200',
        scheduled:    'bg-sky-50 text-sky-600 border border-sky-200',
        cancelled:    'bg-gray-50 text-gray-500 border border-gray-200',
        high:         'bg-red-50 text-red-600 border border-red-200',
        medium:       'bg-amber-50 text-amber-600 border border-amber-200',
        low:          'bg-emerald-50 text-emerald-600 border border-emerald-200',
        'in-progress':'bg-indigo-50 text-indigo-600 border border-indigo-200',
        'not-started':'bg-gray-50 text-gray-500 border border-gray-200',
        review:       'bg-violet-50 text-violet-600 border border-violet-200',
        client:       'bg-blue-50 text-blue-600 border border-blue-200',
        vendor:       'bg-violet-50 text-violet-600 border border-violet-200',
        contractor:   'bg-amber-50 text-amber-600 border border-amber-200',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${map[status] ?? 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
            {label ?? status}
        </span>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ projects, workspace, user }) {
    const { url } = usePage();

    const icons = {
        dashboard: <LayoutDashboard size={18} strokeWidth={1.75} />,
        projects:  <FolderKanban size={18} strokeWidth={1.75} />,
        clients:   <Building2 size={18} strokeWidth={1.75} />,
        profile:   <UserCircle size={18} strokeWidth={1.75} />,
        settings:  <Settings size={18} strokeWidth={1.75} />,
    };

    const navItem = (href, iconKey, label) => {
        const active = url === href || url.startsWith(href + '/');
        return (
            <Link
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all mb-0.5
                    ${active
                        ? 'bg-[#4f6df5]/15 text-[#4f6df5] font-medium'
                        : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.07]'
                    }`}
            >
                {icons[iconKey]}
                {label}
            </Link>
        );
    };

    return (
        <aside className="w-[232px] bg-[#1e293b] border-r border-[#334155] flex flex-col fixed h-screen z-10 overflow-y-auto">
            {/* Logo */}
            <div className="px-5 py-6 border-b border-[#334155]">
                <div className="font-serif text-xl font-bold tracking-[5px] text-[#4f6df5]">FLOW</div>
                <div className="text-[9px] tracking-[2.5px] text-[#94a3b8] uppercase mt-0.5">Project Management</div>
            </div>

            {/* Main Nav */}
            <nav className="px-3 py-3 flex-1 overflow-y-auto">
                {navItem(route('dashboard'), 'dashboard', 'Dashboard')}
                {navItem(route('projects.index'), 'projects', 'All Projects')}
                {navItem(route('clients.index'), 'clients', 'Directory')}

                <div className="text-[9px] tracking-[2px] text-[#94a3b8] uppercase px-3 py-2 mt-2">
                    Projects
                </div>

                {projects?.map(p => {
                    const isActive = url.startsWith(`/projects/${p.id}`);
                    return (
                        <Link
                            key={p.id}
                            href={route('projects.show', p.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all mb-px
                                ${isActive
                                    ? 'bg-[#4f6df5]/15 text-[#4f6df5]'
                                    : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.07]'
                                }`}
                        >
                            <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                    background: p.status === 'completed' ? '#5b8dee'
                                        : p.status === 'active' ? '#3ecf8e'
                                        : '#64748b'
                                }}
                            />
                            <span className="truncate max-w-[148px]">{p.name}</span>
                        </Link>
                    );
                })}

                <Link
                    href={route('projects.create')}
                    className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#94a3b8] hover:text-[#cbd5e1] transition-colors mt-1"
                >
                    <Plus size={14} strokeWidth={2} /> New Project
                </Link>
            </nav>

            {/* Account section */}
            <div className="px-3 py-3 border-t border-[#334155]">
                <div className="text-[9px] tracking-[2px] text-[#94a3b8] uppercase px-3 py-2">
                    Account
                </div>
                {navItem(route('profile.edit'), 'profile', 'Profile')}
                {navItem(route('company.edit'), 'settings', 'Company Settings')}
            </div>

            {/* User + Footer */}
            <div className="px-4 py-3 border-t border-[#334155]">
                <div className="flex items-center gap-3">
                    <Link href={route('profile.edit')} className="w-8 h-8 rounded-full bg-[#4f6df5]/20 flex items-center justify-center text-[12px] font-bold text-[#4f6df5] flex-shrink-0">
                        {(user?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link href={route('profile.edit')} className="text-[12px] font-medium text-[#cbd5e1] truncate block hover:text-white transition-colors">{user?.name}</Link>
                        <div className="text-[10px] text-[#94a3b8] truncate">{workspace?.name ?? 'ProjectFlow'}</div>
                    </div>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-[#64748b] hover:text-white transition-colors flex-shrink-0"
                        title="Sign out"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                    </Link>
                </div>
            </div>
        </aside>
    );
}

// ── Toast Notification ────────────────────────────────────────────────────────
function Toast() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setMessage(flash.success ? { type: 'success', text: flash.success } : { type: 'error', text: flash.error });
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    if (!message || !visible) return null;

    const isSuccess = message.type === 'success';

    return (
        <div className={`fixed top-5 right-5 z-50 animate-slide-in`}>
            <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-[13px] shadow-lg backdrop-blur-sm min-w-[320px] max-w-[420px]
                ${isSuccess
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                <span className="mt-0.5 flex-shrink-0">
                    {isSuccess ? <CircleCheck size={18} className="text-emerald-500" /> : <CircleX size={18} className="text-red-500" />}
                </span>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[12px] mb-0.5">{isSuccess ? 'Success' : 'Error'}</div>
                    <div className="text-[13px] opacity-90 leading-snug">{message.text}</div>
                </div>
                <button onClick={() => setVisible(false)} className="opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

// ── Main Layout ────────────────────────────────────────────────────────────────
export default function AppLayout({ children, title, breadcrumbs = [] }) {
    const { auth, sidebarProjects } = usePage().props;

    return (
        <div className="flex min-h-screen bg-[#f8f8f8]">
            <Sidebar projects={sidebarProjects ?? []} workspace={auth.workspace} user={auth.user} />

            <div className="ml-[232px] flex-1 flex flex-col min-h-screen">
                {/* Topbar */}
                <header className="sticky top-0 z-10 bg-[#f8f8f8] border-b border-[#e5e7eb] px-8 py-4 flex items-center justify-between">
                    <div>
                        {title && (
                            <h1 className="font-serif text-2xl font-semibold text-black">{title}</h1>
                        )}
                        {breadcrumbs.length > 0 && (
                            <nav className="flex items-center gap-1.5 text-[11.5px] text-[#6b7280] mt-0.5">
                                {breadcrumbs.map((bc, i) => (
                                    <span key={i} className="flex items-center gap-1.5">
                                        {bc.href
                                            ? <Link href={bc.href} className="hover:text-black transition-colors">{bc.label}</Link>
                                            : <span>{bc.label}</span>
                                        }
                                        {i < breadcrumbs.length - 1 && <span className="opacity-40">›</span>}
                                    </span>
                                ))}
                            </nav>
                        )}
                    </div>
                    <div />
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>

            <Toast />
        </div>
    );
}
