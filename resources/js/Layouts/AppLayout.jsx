import { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { LayoutDashboard, FolderKanban, Building2, UserCircle, Settings, Plus, CircleCheck, CircleX, X, ArrowLeftRight, Users, Tag, ListTodo, ReceiptText, TrendingUp, Bell, Menu, ChevronsLeft, ChevronsRight } from 'lucide-react';

// ── Reusable Badge ─────────────────────────────────────────────────────────────
export function Badge({ status, label }) {
    const map = {
        active:       'bg-emerald-50 text-emerald-600 border border-emerald-200',
        completed:    'bg-blue-50 text-blue-600 border border-blue-200',
        'on-hold':    'bg-amber-50 text-amber-600 border border-amber-200',
        draft:        'bg-gray-50 text-gray-700 border border-gray-200',
        sent:         'bg-indigo-50 text-indigo-600 border border-indigo-200',
        approved:     'bg-emerald-50 text-emerald-600 border border-emerald-200',
        rejected:     'bg-red-50 text-red-600 border border-red-200',
        paid:         'bg-emerald-50 text-emerald-600 border border-emerald-200',
        overdue:      'bg-red-50 text-red-600 border border-red-200',
        scheduled:    'bg-sky-50 text-sky-600 border border-sky-200',
        cancelled:    'bg-gray-50 text-gray-700 border border-gray-200',
        high:         'bg-red-50 text-red-600 border border-red-200',
        medium:       'bg-amber-50 text-amber-600 border border-amber-200',
        low:          'bg-emerald-50 text-emerald-600 border border-emerald-200',
        'in-progress':'bg-indigo-50 text-indigo-600 border border-indigo-200',
        'not-started':'bg-gray-50 text-gray-700 border border-gray-200',
        review:       'bg-violet-50 text-violet-600 border border-violet-200',
        'pending-approval':'bg-amber-50 text-amber-600 border border-amber-200',
        client:       'bg-blue-50 text-blue-600 border border-blue-200',
        vendor:       'bg-violet-50 text-violet-600 border border-violet-200',
        contractor:   'bg-amber-50 text-amber-600 border border-amber-200',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${map[status] ?? 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
            {label ?? status}
        </span>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ projects, workspace, user, open, onClose, collapsed, onToggleCollapse }) {
    const { url } = usePage();
    const canManage = (user?.roles ?? []).some(r => r === 'admin' || r === 'manager');

    const icons = {
        dashboard: <LayoutDashboard size={18} strokeWidth={1.75} />,
        mytasks:   <ListTodo size={18} strokeWidth={1.75} />,
        projects:  <FolderKanban size={18} strokeWidth={1.75} />,
        billing:   <ReceiptText size={18} strokeWidth={1.75} />,
        reports:   <TrendingUp size={18} strokeWidth={1.75} />,
        clients:   <Building2 size={18} strokeWidth={1.75} />,
        profile:   <UserCircle size={18} strokeWidth={1.75} />,
        team:      <Users size={18} strokeWidth={1.75} />,
        categories: <Tag size={18} strokeWidth={1.75} />,
        transfer:  <ArrowLeftRight size={18} strokeWidth={1.75} />,
        settings:  <Settings size={18} strokeWidth={1.75} />,
    };

    // When collapsed (desktop only), labels are hidden and items are centered into an icon rail.
    const hideOnCollapse = collapsed ? 'md:hidden' : '';
    const navItem = (href, iconKey, label) => {
        const active = url === href || url.startsWith(href + '/');
        return (
            <Link
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all mb-0.5 ${collapsed ? 'md:justify-center md:px-0' : ''}
                    ${active
                        ? 'bg-[#4f6df5]/15 text-[#4f6df5] font-medium'
                        : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.07]'
                    }`}
            >
                <span className="flex-shrink-0">{icons[iconKey]}</span>
                <span className={hideOnCollapse}>{label}</span>
            </Link>
        );
    };

    // Close sidebar on navigation (mobile)
    useEffect(() => { onClose?.(); }, [url]);

    return (
        <>
            {/* Mobile overlay */}
            {open && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={onClose} />}

            <aside className={`w-[232px] ${collapsed ? 'md:w-[68px]' : 'md:w-[232px]'} bg-[#1e293b] border-r border-[#334155] flex flex-col fixed h-screen z-30 overflow-y-auto transition-all duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
            {/* Logo */}
            <div className={`py-6 border-b border-[#334155] flex items-center ${collapsed ? 'px-5 md:px-0 md:justify-center' : 'px-5 justify-between'}`}>
                <div className={hideOnCollapse}>
                    <div className="font-serif text-xl font-bold tracking-[5px] text-[#4f6df5]">FLOW</div>
                    <div className="text-[9px] tracking-[2.5px] text-[#94a3b8] uppercase mt-0.5">Project Management</div>
                </div>
                {collapsed && <div className="hidden md:block font-serif text-lg font-bold text-[#4f6df5]">F</div>}
                <button
                    onClick={onToggleCollapse}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className={`hidden md:flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-white/[0.07] rounded-lg p-1.5 transition-colors ${collapsed ? 'md:hidden' : ''}`}
                >
                    <ChevronsLeft size={18} />
                </button>
            </div>

            {/* Expand button (shown only when collapsed) */}
            {collapsed && (
                <button
                    onClick={onToggleCollapse}
                    title="Expand sidebar"
                    className="hidden md:flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-white/[0.07] mx-auto mt-2 rounded-lg p-1.5 transition-colors"
                >
                    <ChevronsRight size={18} />
                </button>
            )}

            {/* Main Nav */}
            <nav className={`py-3 flex-1 overflow-y-auto ${collapsed ? 'px-3 md:px-2' : 'px-3'}`}>
                {navItem(route('dashboard'), 'dashboard', 'Dashboard')}
                {navItem(route('my-tasks'), 'mytasks', 'My Tasks')}
                {navItem(route('projects.index'), 'projects', 'All Projects')}
                {navItem(route('billing.index'), 'billing', 'Billing')}
                {canManage && navItem(route('reports.profitability'), 'reports', 'Profitability')}
                {navItem(route('clients.index'), 'clients', 'Directory')}

                <div className={`text-[9px] tracking-[2px] text-[#94a3b8] uppercase px-3 py-2 mt-2 ${hideOnCollapse}`}>
                    Projects
                </div>

                {projects?.map(p => {
                    const isActive = url.startsWith(`/projects/${p.id}`);
                    return (
                        <Link
                            key={p.id}
                            href={route('projects.show', p.id)}
                            title={collapsed ? p.name : undefined}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all mb-px ${collapsed ? 'md:justify-center md:px-0' : ''}
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
                            <span className={`truncate max-w-[148px] ${hideOnCollapse}`}>{p.name}</span>
                        </Link>
                    );
                })}

                <Link
                    href={route('projects.create')}
                    title={collapsed ? 'New Project' : undefined}
                    className={`flex items-center gap-2 px-3 py-2 text-[11px] text-[#94a3b8] hover:text-[#cbd5e1] transition-colors mt-1 ${collapsed ? 'md:justify-center md:px-0' : ''}`}
                >
                    <Plus size={14} strokeWidth={2} className="flex-shrink-0" /> <span className={hideOnCollapse}>New Project</span>
                </Link>
            </nav>

            {/* Account section */}
            <div className={`py-3 border-t border-[#334155] ${collapsed ? 'px-3 md:px-2' : 'px-3'}`}>
                <div className={`text-[9px] tracking-[2px] text-[#94a3b8] uppercase px-3 py-2 ${hideOnCollapse}`}>
                    Account
                </div>
                {navItem(route('profile.edit'), 'profile', 'Profile')}
                {navItem(route('company.edit'), 'settings', 'Company Settings')}
                {navItem(route('team.index'), 'team', 'Team Members')}
                {navItem(route('categories.index'), 'categories', 'Task Categories')}
                {navItem(route('workspace.transfer'), 'transfer', 'Export & Import')}
            </div>

            {/* User + Footer */}
            <div className={`py-3 border-t border-[#334155] ${collapsed ? 'px-3 md:px-2' : 'px-4'}`}>
                <div className={`flex items-center gap-3 ${collapsed ? 'md:justify-center' : ''}`}>
                    <Link href={route('profile.edit')} title={collapsed ? user?.name : undefined} className="w-8 h-8 rounded-full bg-[#4f6df5]/20 flex items-center justify-center text-[12px] font-bold text-[#4f6df5] flex-shrink-0">
                        {(user?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </Link>
                    <div className={`flex-1 min-w-0 ${hideOnCollapse}`}>
                        <Link href={route('profile.edit')} className="text-[12px] font-medium text-[#cbd5e1] truncate block hover:text-white transition-colors">{user?.name}</Link>
                        <div className="text-[10px] text-[#94a3b8] truncate">{workspace?.name ?? 'ProjectFlow'}</div>
                    </div>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className={`text-[#64748b] hover:text-white transition-colors flex-shrink-0 ${hideOnCollapse}`}
                        title="Sign out"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                    </Link>
                </div>
            </div>
        </aside>
        </>
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
        <div className={`fixed top-5 right-4 left-4 md:left-auto md:right-5 z-50 animate-slide-in`}>
            <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-[13px] shadow-lg backdrop-blur-sm w-full md:min-w-[320px] md:max-w-[420px]
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

// ── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell() {
    const { attention } = usePage().props;
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
    }, [open]);

    if (!attention) return null; // clients / unauthenticated

    const count = attention.count ?? 0;
    const groups = attention.groups ?? [];
    const dotColor = (sev) => (sev === 'danger' ? 'bg-red-500' : 'bg-amber-500');

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                title="Notifications"
                className="relative p-2 rounded-lg text-[#4b5563] hover:text-black hover:bg-gray-100 transition-colors"
            >
                <Bell size={19} strokeWidth={1.75} />
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-white border border-[#e5e7eb] rounded-xl shadow-[0_8px_30px_rgba(16,24,40,0.12)] z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f4f6]">
                        <span className="text-[13px] font-semibold text-black">Needs attention</span>
                        {count > 0 && <span className="text-[11px] text-[#6b7280]">{count} item{count === 1 ? '' : 's'}</span>}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {groups.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <CircleCheck size={26} className="text-emerald-500 mx-auto mb-2" />
                                <div className="text-[13px] text-[#4b5563]">You're all caught up.</div>
                            </div>
                        ) : groups.map(g => (
                            <div key={g.key} className="border-b border-[#f6f7f9] last:border-0">
                                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor(g.severity)}`} />
                                    <span className="text-[11px] uppercase tracking-[0.5px] font-semibold text-[#6b7280]">{g.label}</span>
                                    <span className="text-[11px] text-[#9ca3af]">{g.total}</span>
                                </div>
                                {g.items.map(it => (
                                    it.href ? (
                                        <Link
                                            key={`${g.key}-${it.id}`}
                                            href={it.href}
                                            onClick={() => setOpen(false)}
                                            className="block px-4 py-2 hover:bg-[#fafbfc] transition-colors"
                                        >
                                            <div className="text-[13px] text-black truncate">{it.title}</div>
                                            <div className="text-[11px] text-[#6b7280] mt-0.5">{it.meta}</div>
                                        </Link>
                                    ) : (
                                        <div key={`${g.key}-${it.id}`} className="px-4 py-2">
                                            <div className="text-[13px] text-black truncate">{it.title}</div>
                                            <div className="text-[11px] text-[#6b7280] mt-0.5">{it.meta}</div>
                                        </div>
                                    )
                                ))}
                                {g.overflow > 0 && (
                                    <div className="px-4 py-1.5 text-[11px] text-[#9ca3af]">+{g.overflow} more</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Layout ────────────────────────────────────────────────────────────────
export default function AppLayout({ children, title, breadcrumbs = [] }) {
    const { auth, sidebarProjects } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('sidebarCollapsed') === '1';
    });
    const toggleCollapsed = () => setCollapsed(c => {
        const next = !c;
        if (typeof window !== 'undefined') localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
        return next;
    });

    return (
        <div className="flex min-h-screen bg-[#f8f8f8]">
            <Sidebar projects={sidebarProjects ?? []} workspace={auth.workspace} user={auth.user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />

            <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-200 ${collapsed ? 'md:ml-[68px]' : 'md:ml-[232px]'}`}>
                {/* Topbar */}
                <header className="sticky top-0 z-10 bg-[#f8f8f8] border-b border-[#e5e7eb] px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 -ml-1.5 rounded-lg text-[#4b5563] hover:text-black hover:bg-gray-100 transition-colors">
                            <Menu size={20} />
                        </button>
                        <div>
                            {title && (
                                <h1 className="font-serif text-xl md:text-2xl font-semibold text-black">{title}</h1>
                            )}
                            {breadcrumbs.length > 0 && (
                                <nav className="flex items-center gap-1.5 text-[11.5px] text-[#4b5563] mt-0.5">
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
                    </div>
                    <NotificationBell />
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>

            <Toast />
        </div>
    );
}
