import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';
import { formatMoney, getCurrency } from '@/Utils/currencies';
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
    const { baseCurrency } = usePage().props;
    const cur = getCurrency(baseCurrency ?? 'USD');
    const fmt = (n) => formatMoney(n, cur.code);

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-3 mb-7">
                {/* Projects */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4">
                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#9ca3af] font-medium mb-2">Projects</div>
                    <div className="text-[24px] font-bold leading-none text-black">{stats.total_projects}</div>
                    <div className="text-[11px] text-[#9ca3af] mt-1.5">{stats.active_projects} active</div>
                </div>

                {/* Total Budget — by currency */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4">
                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#9ca3af] font-medium mb-2">Total Budget</div>
                    {Object.entries(stats.budget_by_currency ?? {}).map(([code, amount]) => (
                        <div key={code} className="text-[20px] font-bold leading-tight text-black">{formatMoney(amount, code)}</div>
                    ))}
                    {Object.keys(stats.budget_by_currency ?? {}).length === 0 && <div className="text-[20px] font-bold text-[#d1d5db]">—</div>}
                    <div className="text-[11px] text-[#9ca3af] mt-1.5">Across all projects</div>
                </div>

                {/* Total Billed — by currency */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4">
                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#9ca3af] font-medium mb-2">Total Billed</div>
                    {Object.entries(stats.billed_by_currency ?? {}).map(([code, amount]) => (
                        <div key={code} className="text-[20px] font-bold leading-tight text-indigo-600">{formatMoney(amount, code)}</div>
                    ))}
                    {Object.keys(stats.billed_by_currency ?? {}).length === 0 && <div className="text-[20px] font-bold text-[#d1d5db]">—</div>}
                    <div className="text-[11px] text-[#9ca3af] mt-1.5">{stats.pending_invoices} pending</div>
                </div>

                {/* Received — by currency */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4">
                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#9ca3af] font-medium mb-2">Received</div>
                    {Object.entries(stats.received_by_currency ?? {}).map(([code, amount]) => (
                        <div key={code} className="text-[20px] font-bold leading-tight text-emerald-600">{formatMoney(amount, code)}</div>
                    ))}
                    {Object.keys(stats.received_by_currency ?? {}).length === 0 && <div className="text-[20px] font-bold text-[#d1d5db]">—</div>}
                    <div className="text-[11px] text-[#9ca3af] mt-1.5">Payments received</div>
                </div>

                {/* Open Tasks */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4">
                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#9ca3af] font-medium mb-2">Open Tasks</div>
                    <div className="text-[24px] font-bold leading-none text-black">{stats.open_tasks}</div>
                    <div className="text-[11px] text-[#9ca3af] mt-1.5">Across projects</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
                {/* Active Projects */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
                        <span className="font-serif text-[17px] font-semibold">Active Projects</span>
                        <Link href={route('projects.index')} className="text-[12px] text-[#6b7280] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100">
                            View All
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
                                className="block px-5 py-3.5 border-b border-[#e5e7eb] last:border-b-0 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div>
                                        <div className="text-[13.5px] font-medium text-black">{p.name}</div>
                                        <div className="text-[11.5px] text-[#6b7280]">{p.client}</div>
                                    </div>
                                    <Badge status="active" />
                                </div>
                                <div className="flex justify-between text-[11.5px] text-[#6b7280] mb-1.5">
                                    <span>{p.phase}</span><span>{p.progress}%</span>
                                </div>
                                <div className="h-1 bg-[#d1d5db] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-[#4f6df5] to-[#6380f7] progress-fill" style={{ width: `${p.progress}%` }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Upcoming Meetings */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#e5e7eb]">
                        <span className="font-serif text-[17px] font-semibold">Upcoming Meetings</span>
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
                                        <div className="text-[13px] font-medium text-black truncate">{m.title}</div>
                                        <div className="text-[11.5px] text-[#6b7280]">{m.time} · {m.duration} · {m.location}</div>
                                        {m.project && <div className="text-[11px] text-[#6b7280] mt-0.5">{m.project.client}</div>}
                                    </div>
                                    <span className="text-[10px] text-[#6b7280] self-start mt-1 capitalize">{MTG_LABELS[m.type]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e5e7eb]">
                    <span className="font-serif text-[17px] font-semibold">Recent Invoice Activity</span>
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
