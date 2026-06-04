import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';
import { formatMoney, getCurrency } from '@/Utils/currencies';
import { Briefcase, Wallet, Receipt, CircleDollarSign, ListChecks, ArrowRight, Calendar, Plus, Clock, AlertTriangle, FileWarning, CalendarX, TrendingUp } from 'lucide-react';
const fmtDate = (s) => {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const parseDay = (s) => {
    const d = new Date(s);
    return { day: d.getDate(), mon: d.toLocaleString('en-US', { month: 'short' }) };
};

const MTG_LABELS = { kickoff: 'Kickoff', review: 'Review', checkin: 'Check-in', presentation: 'Presentation', discovery: 'Discovery', other: 'Other' };

export default function Dashboard({ stats, attention, collection, myTasks = [], hasLinkedMember, activeProjects, upcomingMeetings, recentInvoices }) {
    const { baseCurrency, auth } = usePage().props;
    const cur = getCurrency(baseCurrency ?? 'USD');
    const fmt = (n) => formatMoney(n, cur.code);

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = (auth?.user?.name ?? '').split(' ')[0];
    const todayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Needs Attention
    const alerts = [
        { key: 'inv', count: attention?.overdue_invoices ?? 0, label: 'Overdue invoices', icon: <FileWarning size={16} /> },
        { key: 'dl',  count: attention?.past_deadline ?? 0,    label: 'Past deadline',     icon: <CalendarX size={16} />, href: route('projects.index') },
        { key: 'tsk', count: attention?.overdue_tasks ?? 0,    label: 'Overdue tasks',     icon: <ListChecks size={16} />, href: route('my-tasks') },
    ].filter(a => a.count > 0);

    // Collection rate (base currency)
    const billedBase = collection?.billed ?? 0;
    const receivedBase = collection?.received ?? 0;
    const collectionPct = billedBase > 0 ? Math.min(100, Math.round((receivedBase / billedBase) * 100)) : 0;
    const outstanding = Object.entries(stats.pending_by_currency ?? {}).filter(([, v]) => v > 0);

    // Task helpers
    const PRIORITY_DOT = { high: '#ef4444', medium: '#f59e0b', low: '#16a34a' };
    const isOverdue = (d) => d && new Date(d) < new Date(now.toDateString());
    const dueLabel = (d) => {
        if (!d) return 'No due date';
        const dt = new Date(d), t = new Date(now.toDateString());
        const diff = Math.round((new Date(d) - t) / 86400000);
        if (diff < 0) return `${Math.abs(diff)}d overdue`;
        if (diff === 0) return 'Due today';
        if (diff === 1) return 'Due tomorrow';
        return `Due ${dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div className="min-w-0">
                    <h2 className="font-serif text-[22px] md:text-[26px] font-semibold text-black leading-tight">
                        {greeting}{firstName ? `, ${firstName}` : ''}
                    </h2>
                    <p className="text-[13px] text-[#6b7280] mt-1 flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#9ca3af]" /> {todayStr} · here's where things stand
                    </p>
                </div>
                <Link
                    href={route('projects.create')}
                    className="inline-flex items-center gap-1.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white text-[13px] font-medium px-4 py-2.5 rounded-lg transition-all flex-shrink-0 self-start sm:self-auto"
                >
                    <Plus size={15} /> New Project
                </Link>
            </div>

            {/* Needs Attention */}
            {alerts.length > 0 && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 md:p-5 mb-6">
                    <div className="flex items-center gap-2 mb-3.5">
                        <AlertTriangle size={15} className="text-amber-500" />
                        <span className="text-[13px] font-bold text-amber-900">Needs Attention</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {alerts.map(a => {
                            const inner = (
                                <div className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg px-4 py-3 h-full transition-all hover:border-amber-300 hover:shadow-[0_2px_10px_rgba(245,158,11,0.12)]">
                                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">{a.icon}</div>
                                    <div className="min-w-0">
                                        <div className="text-[20px] font-bold text-black leading-none">{a.count}</div>
                                        <div className="text-[12px] text-[#6b7280] mt-1">{a.label}</div>
                                    </div>
                                    {a.href && <ArrowRight size={14} className="text-amber-400 ml-auto flex-shrink-0" />}
                                </div>
                            );
                            return a.href
                                ? <Link key={a.key} href={a.href} className="block">{inner}</Link>
                                : <div key={a.key}>{inner}</div>;
                        })}
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-7">
                {[
                    { label: 'Projects', icon: <Briefcase size={17} />, accent: '#4f6df5', values: [{ v: stats.total_projects, c: 'text-black' }], sub: `${stats.active_projects} active` },
                    { label: 'Total Budget', icon: <Wallet size={17} />, accent: '#0ea5e9', values: Object.entries(stats.budget_by_currency ?? {}).map(([code, amount]) => ({ v: formatMoney(amount, code), c: 'text-black' })), sub: 'Across all projects' },
                    { label: 'Total Billed', icon: <Receipt size={17} />, accent: '#8b5cf6', values: Object.entries(stats.billed_by_currency ?? {}).map(([code, amount]) => ({ v: formatMoney(amount, code), c: 'text-indigo-600' })), sub: `${stats.pending_invoices} pending` },
                    { label: 'Received', icon: <CircleDollarSign size={17} />, accent: '#16a34a', values: Object.entries(stats.received_by_currency ?? {}).map(([code, amount]) => ({ v: formatMoney(amount, code), c: 'text-emerald-600' })), sub: 'Payments received' },
                    { label: 'Open Tasks', icon: <ListChecks size={17} />, accent: '#f59e0b', values: [{ v: stats.open_tasks, c: 'text-black' }], sub: 'Across projects' },
                ].map((s, i) => (
                    <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-4 md:p-5 hover:shadow-[0_2px_14px_rgba(17,24,39,0.05)] hover:border-[#d6dae0] transition-all">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3.5" style={{ background: `${s.accent}14`, color: s.accent }}>{s.icon}</div>
                        {s.values.length > 0
                            ? s.values.map((val, j) => <div key={j} className={`text-[21px] md:text-[24px] font-bold leading-tight tracking-tight ${val.c}`}>{val.v}</div>)
                            : <div className="text-[21px] md:text-[24px] font-bold text-[#d1d5db]">—</div>
                        }
                        <div className="text-[12px] text-[#6b7280] mt-1.5">{s.label}</div>
                        <div className="text-[11px] text-[#9ca3af] mt-1">{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Receivables & My Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                {/* Receivables & Cash Flow */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={16} className="text-indigo-500" />
                        <span className="text-[15px] font-bold">Receivables &amp; Cash Flow</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <div className="text-[10px] tracking-[1.5px] uppercase text-[#9ca3af] font-medium mb-1.5">Outstanding</div>
                            {outstanding.length > 0
                                ? outstanding.map(([code, amt]) => <div key={code} className="text-[19px] font-bold text-amber-600 leading-tight">{formatMoney(amt, code)}</div>)
                                : <div className="text-[19px] font-bold text-[#d1d5db]">—</div>}
                            <div className="text-[11px] text-[#9ca3af] mt-1">{stats.pending_invoices} invoice{stats.pending_invoices === 1 ? '' : 's'} awaiting payment</div>
                        </div>
                        <div>
                            <div className="text-[10px] tracking-[1.5px] uppercase text-[#9ca3af] font-medium mb-1.5">Received</div>
                            {Object.entries(stats.received_by_currency ?? {}).length > 0
                                ? Object.entries(stats.received_by_currency).map(([code, amt]) => <div key={code} className="text-[19px] font-bold text-emerald-600 leading-tight">{formatMoney(amt, code)}</div>)
                                : <div className="text-[19px] font-bold text-[#d1d5db]">—</div>}
                            <div className="text-[11px] text-[#9ca3af] mt-1">Payments collected</div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center text-[12px] mb-2">
                            <span className="text-[#6b7280]">Collection rate <span className="text-[#9ca3af]">({cur.code})</span></span>
                            <span className="font-semibold text-[#4f6df5]">{collectionPct}%</span>
                        </div>
                        <div className="h-2 bg-[#eef0f2] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#4f6df5] to-[#6380f7] progress-fill" style={{ width: `${collectionPct}%` }} />
                        </div>
                        <div className="text-[11px] text-[#9ca3af] mt-2">{fmt(receivedBase)} received of {fmt(billedBase)} billed</div>
                    </div>
                </div>

                {/* My Tasks */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
                        <span className="flex items-center gap-2 text-[15px] font-bold"><ListChecks size={16} className="text-indigo-500" /> My Tasks</span>
                        <Link href={route('my-tasks')} className="inline-flex items-center gap-1 text-[12px] text-[#6b7280] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100">
                            View All <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="flex-1">
                        {myTasks.length === 0 && (
                            <div className="text-center py-10 px-5 text-[#6b7280] text-[13px]">
                                {hasLinkedMember ? 'No open tasks assigned to you 🎉' : 'Link your account to a team member to see your tasks.'}
                            </div>
                        )}
                        {myTasks.map(t => {
                            const overdue = isOverdue(t.due_date);
                            return (
                                <Link key={t.id} href={t.project ? route('projects.show', t.project.id) : '#'} className="group flex items-center gap-3 px-5 py-3 border-b border-[#e5e7eb] last:border-b-0 hover:bg-gray-50 transition-colors">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PRIORITY_DOT[t.priority] ?? '#9ca3af' }} title={t.priority} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] font-medium text-black truncate group-hover:text-[#4f6df5] transition-colors">{t.title}</div>
                                        {t.project && <div className="text-[11px] text-[#9ca3af] truncate">{t.project.name}</div>}
                                    </div>
                                    <span className={`text-[11px] font-medium whitespace-nowrap flex-shrink-0 ${overdue ? 'text-red-500' : 'text-[#6b7280]'}`}>{dueLabel(t.due_date)}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Active Projects */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
                        <span className="flex items-center gap-2 text-[16px] font-bold"><Briefcase size={16} className="text-indigo-500" /> Active Projects</span>
                        <Link href={route('projects.index')} className="inline-flex items-center gap-1 text-[12px] text-[#6b7280] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100">
                            View All <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div>
                        {activeProjects.length === 0 && (
                            <div className="text-center py-10 text-[#6b7280] text-[13px]">No active projects</div>
                        )}
                        {activeProjects.map(p => (
                            <Link
                                key={p.id}
                                href={route('projects.show', p.id)}
                                className="group block px-5 py-3.5 border-b border-[#e5e7eb] last:border-b-0 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="min-w-0">
                                        <div className="text-[13.5px] font-semibold text-black truncate group-hover:text-[#4f6df5] transition-colors">{p.name}</div>
                                        <div className="text-[11.5px] text-[#6b7280]">{p.client}</div>
                                    </div>
                                    <Badge status="active" />
                                </div>
                                <div className="flex justify-between items-center text-[11.5px] mb-1.5">
                                    <span className="text-[#6b7280]">{p.phase}</span>
                                    <span className="font-semibold text-[#4f6df5]">{p.progress}%</span>
                                </div>
                                <div className="h-1.5 bg-[#eef0f2] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-[#4f6df5] to-[#6380f7] progress-fill" style={{ width: `${p.progress}%` }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Upcoming Meetings */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#e5e7eb]">
                        <span className="flex items-center gap-2 text-[16px] font-bold"><Calendar size={16} className="text-indigo-500" /> Upcoming Meetings</span>
                    </div>
                    <div className="px-5">
                        {upcomingMeetings.length === 0 && (
                            <div className="text-center py-10 text-[#6b7280] text-[13px]">No upcoming meetings</div>
                        )}
                        {upcomingMeetings.map(m => {
                            const { day, mon } = parseDay(m.date);
                            return (
                                <div key={m.id} className="flex gap-3.5 py-3.5 border-b border-[#e5e7eb] last:border-b-0">
                                    <div className="w-11 h-11 bg-[#4f6df5]/10 border border-[#4f6df5]/20 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                                        <div className="text-[16px] font-bold text-[#4f6df5] leading-none">{day}</div>
                                        <div className="text-[9px] text-[#4f6df5] tracking-wide uppercase">{mon}</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] font-semibold text-black truncate">{m.title}</div>
                                        <div className="text-[11.5px] text-[#6b7280] flex items-center gap-1 mt-0.5"><Clock size={11} className="text-[#9ca3af]" /> {m.time} · {m.duration} · {m.location}</div>
                                        {m.project && <div className="text-[11px] text-[#9ca3af] mt-0.5">{m.project.client}</div>}
                                    </div>
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280] self-start capitalize whitespace-nowrap">{MTG_LABELS[m.type]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e5e7eb]">
                    <span className="flex items-center gap-2 text-[16px] font-bold"><Receipt size={16} className="text-indigo-500" /> Recent Invoice Activity</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#e5e7eb]">
                                {['Invoice', 'Project', 'Client', 'Billed', `Received (${cur.code})`, 'Due Date', 'Status'].map(h => (
                                    <th key={h} className="text-left text-[10.5px] tracking-[1.5px] uppercase text-[#6b7280] font-medium px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recentInvoices.map(inv => {
                                const invCur = inv.currency ?? inv.project?.currency ?? cur.code;
                                return (
                                    <tr key={inv.id} className="border-b border-[#e5e7eb] last:border-b-0 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3.5 text-[13px] font-semibold text-[#4f6df5]">{inv.number}</td>
                                        <td className="px-4 py-3.5 text-[13px] text-black">{inv.project?.name ?? '—'}</td>
                                        <td className="px-4 py-3.5 text-[13px] text-[#6b7280]">{inv.project?.client ?? '—'}</td>
                                        <td className="px-4 py-3.5 text-[13px] font-medium">{formatMoney(inv.total, invCur)}</td>
                                        <td className="px-4 py-3.5 text-[13px]">
                                            {inv.received_amount ? (
                                                <span className="font-medium text-emerald-600">{formatMoney(inv.received_amount, inv.received_currency ?? cur.code)}</span>
                                            ) : (
                                                <span className="text-[#d1d5db]">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-[13px] text-[#6b7280]">{fmtDate(inv.due_date)}</td>
                                        <td className="px-4 py-3.5"><Badge status={inv.status} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
