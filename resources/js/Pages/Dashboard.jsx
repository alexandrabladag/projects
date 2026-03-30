import { Head, Link } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';

const fmt = (n) => '$' + Number(n ?? 0).toLocaleString();
const fmtDate = (s) => {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const parseDay = (s) => {
    const d = new Date(s);
    return { day: d.getDate(), mon: d.toLocaleString('en-US', { month: 'short' }) };
};

const MTG_LABELS = { kickoff: 'Kickoff', review: 'Review', checkin: 'Check-in', presentation: 'Presentation', discovery: 'Discovery', other: 'Other' };

export default function Dashboard({ stats, activeProjects, upcomingMeetings, recentInvoices }) {
    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-3.5 mb-7">
                {[
                    { label: 'Total Projects', value: stats.total_projects, sub: `${stats.active_projects} active` },
                    { label: 'Total Budget', value: fmt(stats.total_budget), sub: 'Across all projects' },
                    { label: 'Pending Invoices', value: fmt(stats.pending_amount), sub: `${stats.pending_invoices} awaiting payment` },
                    { label: 'Open Tasks', value: stats.open_tasks, sub: 'Across active projects' },
                ].map((s, i) => (
                    <div key={i} className="bg-[#171a28] border border-[#1d2236] rounded-xl p-5">
                        <div className="text-[10px] tracking-[1.5px] uppercase text-[#58607a] mb-2">{s.label}</div>
                        <div className="font-serif text-[32px] font-semibold text-[#e2dcd2] leading-none">{s.value}</div>
                        <div className="text-[11.5px] text-[#58607a] mt-1.5">{s.sub}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
                {/* Active Projects */}
                <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#1d2236]">
                        <span className="font-serif text-[17px] font-semibold">Active Projects</span>
                        <Link href={route('projects.index')} className="text-[12px] text-[#58607a] hover:text-[#e2dcd2] transition-colors px-3 py-1.5 rounded-lg border border-[#252b40] hover:bg-white/[0.03]">
                            View All
                        </Link>
                    </div>
                    <div>
                        {activeProjects.length === 0 && (
                            <div className="text-center py-10 text-[#58607a] text-[13px]">No active projects</div>
                        )}
                        {activeProjects.map(p => (
                            <Link
                                key={p.id}
                                href={route('projects.show', p.id)}
                                className="block px-5 py-3.5 border-b border-[#1d2236] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div>
                                        <div className="text-[13.5px] font-medium text-[#e2dcd2]">{p.name}</div>
                                        <div className="text-[11.5px] text-[#58607a]">{p.client}</div>
                                    </div>
                                    <Badge status="active" />
                                </div>
                                <div className="flex justify-between text-[11.5px] text-[#58607a] mb-1.5">
                                    <span>{p.phase}</span><span>{p.progress}%</span>
                                </div>
                                <div className="h-1 bg-[#252b40] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-[#c9a464] to-[#d4b472] progress-fill" style={{ width: `${p.progress}%` }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Upcoming Meetings */}
                <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#1d2236]">
                        <span className="font-serif text-[17px] font-semibold">Upcoming Meetings</span>
                    </div>
                    <div className="px-5">
                        {upcomingMeetings.length === 0 && (
                            <div className="text-center py-10 text-[#58607a] text-[13px]">No upcoming meetings</div>
                        )}
                        {upcomingMeetings.map(m => {
                            const { day, mon } = parseDay(m.date);
                            return (
                                <div key={m.id} className="flex gap-3.5 py-3.5 border-b border-[#1d2236] last:border-b-0">
                                    <div className="w-11 h-11 bg-[#c9a464]/10 border border-[#c9a464]/20 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                                        <div className="text-[16px] font-bold text-[#c9a464] leading-none">{day}</div>
                                        <div className="text-[9px] text-[#c9a464] tracking-wide uppercase">{mon}</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] font-medium text-[#e2dcd2] truncate">{m.title}</div>
                                        <div className="text-[11.5px] text-[#58607a]">{m.time} · {m.duration} · {m.location}</div>
                                        {m.project && <div className="text-[11px] text-[#58607a] mt-0.5">{m.project.client}</div>}
                                    </div>
                                    <span className="text-[10px] text-[#58607a] self-start mt-1 capitalize">{MTG_LABELS[m.type]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1d2236]">
                    <span className="font-serif text-[17px] font-semibold">Recent Invoice Activity</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1d2236]">
                                {['Invoice', 'Project', 'Client', 'Amount', 'Due Date', 'Status'].map(h => (
                                    <th key={h} className="text-left text-[10.5px] tracking-[1.5px] uppercase text-[#58607a] font-medium px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recentInvoices.map(inv => (
                                <tr key={inv.id} className="border-b border-[#1d2236] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3.5 text-[13px] font-semibold text-[#c9a464]">{inv.number}</td>
                                    <td className="px-4 py-3.5 text-[13px] text-[#e2dcd2]">{inv.project?.name ?? '—'}</td>
                                    <td className="px-4 py-3.5 text-[13px] text-[#58607a]">{inv.project?.client ?? '—'}</td>
                                    <td className="px-4 py-3.5 text-[13px] font-medium">{fmt(inv.total)}</td>
                                    <td className="px-4 py-3.5 text-[13px] text-[#58607a]">{fmtDate(inv.due_date)}</td>
                                    <td className="px-4 py-3.5"><Badge status={inv.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
