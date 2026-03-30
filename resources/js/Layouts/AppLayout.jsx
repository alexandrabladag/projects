import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

// ── Reusable Badge ─────────────────────────────────────────────────────────────
export function Badge({ status, label }) {
    const map = {
        active:       'bg-green-500/10 text-green-400',
        completed:    'bg-blue-500/10 text-blue-400',
        'on-hold':    'bg-orange-500/10 text-orange-400',
        draft:        'bg-white/5 text-[#9a9180]',
        sent:         'bg-blue-500/10 text-blue-400',
        approved:     'bg-green-500/10 text-green-400',
        rejected:     'bg-red-500/10 text-red-400',
        paid:         'bg-green-500/10 text-green-400',
        overdue:      'bg-red-500/10 text-red-400',
        scheduled:    'bg-blue-500/10 text-blue-400',
        cancelled:    'bg-red-500/10 text-red-400',
        high:         'bg-red-500/10 text-red-400',
        medium:       'bg-orange-500/10 text-orange-400',
        low:          'bg-green-500/10 text-green-400',
        'in-progress':'bg-[#c9a464]/10 text-[#c9a464]',
        'not-started':'bg-white/5 text-[#9a9180]',
        review:       'bg-purple-500/10 text-purple-400',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${map[status] ?? 'bg-white/5 text-[#9a9180]'}`}>
            {label ?? status}
        </span>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ projects }) {
    const { url } = usePage();

    const navItem = (href, icon, label) => {
        const active = url === href || url.startsWith(href + '/');
        return (
            <Link
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all mb-0.5
                    ${active
                        ? 'bg-[#c9a464]/10 text-[#c9a464] font-medium'
                        : 'text-[#9a9180] hover:text-[#e2dcd2] hover:bg-white/[0.03]'
                    }`}
            >
                <span className="w-4 text-center text-[14px] opacity-80">{icon}</span>
                {label}
            </Link>
        );
    };

    return (
        <aside className="w-[232px] bg-[#11131d] border-r border-[#1d2236] flex flex-col fixed h-screen z-10 overflow-y-auto">
            {/* Logo */}
            <div className="px-5 py-6 border-b border-[#1d2236]">
                <div className="font-serif text-xl font-bold tracking-[5px] text-[#c9a464]">FLOW</div>
                <div className="text-[9px] tracking-[2.5px] text-[#58607a] uppercase mt-0.5">Project Management</div>
            </div>

            {/* Main Nav */}
            <nav className="px-3 py-3">
                {navItem(route('dashboard'), '⬚', 'Dashboard')}
                {navItem(route('projects.index'), '◫', 'All Projects')}

                <div className="text-[9px] tracking-[2px] text-[#58607a] uppercase px-3 py-2 mt-2">
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
                                    ? 'bg-[#c9a464]/10 text-[#c9a464]'
                                    : 'text-[#9a9180] hover:text-[#e2dcd2] hover:bg-white/[0.03]'
                                }`}
                        >
                            <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                    background: p.status === 'completed' ? '#5b8dee'
                                        : p.status === 'active' ? '#3ecf8e'
                                        : '#58607a'
                                }}
                            />
                            <span className="truncate max-w-[148px]">{p.name}</span>
                        </Link>
                    );
                })}

                <Link
                    href={route('projects.create')}
                    className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#58607a] hover:text-[#9a9180] transition-colors mt-1"
                >
                    <span>+</span> New Project
                </Link>
            </nav>

            {/* Footer */}
            <div className="mt-auto px-5 py-4 border-t border-[#1d2236]">
                <div className="text-[12px] font-medium text-[#9a9180]">Studio Account</div>
                <div className="text-[11px] text-[#58607a] mt-0.5">v1.0 · ProjectFlow</div>
            </div>
        </aside>
    );
}

// ── Flash Message ──────────────────────────────────────────────────────────────
function FlashMessage() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(true);

    if (!flash?.success && !flash?.error) return null;
    if (!visible) return null;

    return (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] shadow-2xl
            ${flash.success
                ? 'bg-[#171a28] border-green-500/30 text-green-400'
                : 'bg-[#171a28] border-red-500/30 text-red-400'
            }`}>
            <span>{flash.success ? '✓' : '✕'}</span>
            <span>{flash.success ?? flash.error}</span>
            <button onClick={() => setVisible(false)} className="ml-2 opacity-60 hover:opacity-100 text-[16px]">×</button>
        </div>
    );
}

// ── Main Layout ────────────────────────────────────────────────────────────────
export default function AppLayout({ children, title, breadcrumbs = [] }) {
    const { auth } = usePage().props;
    // projects list for sidebar — loaded via Inertia shared data or passed as prop
    const { sidebarProjects } = usePage().props;

    return (
        <div className="flex min-h-screen bg-[#0b0d14]">
            <Sidebar projects={sidebarProjects ?? []} />

            <div className="ml-[232px] flex-1 flex flex-col min-h-screen">
                {/* Topbar */}
                <header className="sticky top-0 z-10 bg-[#0b0d14] border-b border-[#1d2236] px-8 py-4 flex items-center justify-between">
                    <div>
                        {title && (
                            <h1 className="font-serif text-2xl font-semibold text-[#e2dcd2]">{title}</h1>
                        )}
                        {breadcrumbs.length > 0 && (
                            <nav className="flex items-center gap-1.5 text-[11.5px] text-[#58607a] mt-0.5">
                                {breadcrumbs.map((bc, i) => (
                                    <span key={i} className="flex items-center gap-1.5">
                                        {bc.href
                                            ? <Link href={bc.href} className="hover:text-[#e2dcd2] transition-colors">{bc.label}</Link>
                                            : <span>{bc.label}</span>
                                        }
                                        {i < breadcrumbs.length - 1 && <span className="opacity-40">›</span>}
                                    </span>
                                ))}
                            </nav>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[12px] text-[#9a9180]">{auth.user.name}</div>
                            <div className="text-[10px] text-[#58607a] capitalize">{auth.user.roles?.[0]}</div>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-[12px] text-[#58607a] hover:text-[#e2dcd2] transition-colors px-3 py-1.5 rounded-lg border border-[#252b40] hover:bg-white/[0.03]"
                        >
                            Sign out
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>

            <FlashMessage />
        </div>
    );
}
