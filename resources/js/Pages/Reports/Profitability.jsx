import { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { TrendingUp, TrendingDown, Search, ExternalLink, Inbox } from 'lucide-react';
import { formatMoney } from '@/Utils/currencies';

// Workspace profitability: revenue (billed) vs true costs (vendor bills + payroll).
// Amounts are shown at face value per the project's currency — never converted —
// so cross-project rollups are grouped by currency.

const STATUS_CLS = {
    active:    'bg-emerald-50 text-emerald-600 border-emerald-100',
    completed: 'bg-blue-50 text-blue-600 border-blue-100',
    'on-hold': 'bg-amber-50 text-amber-600 border-amber-100',
};

const marginColor = (m) => (m > 0 ? 'text-emerald-600' : m < 0 ? 'text-red-500' : 'text-[#4b5563]');

function SummaryCard({ s }) {
    const positive = s.margin >= 0;
    const pct = s.revenue > 0 ? Math.round((s.margin / s.revenue) * 100) : null;
    return (
        <div className="flex-1 min-w-[220px] rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-semibold">{s.currency}</span>
                <span className="text-[11px] text-[#9ca3af]">{s.projects} {s.projects === 1 ? 'project' : 'projects'}</span>
            </div>
            <div className="flex items-end gap-2">
                <span className={`font-serif text-[26px] font-bold leading-none ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatMoney(s.margin, s.currency)}
                </span>
                {pct != null && (
                    <span className={`flex items-center gap-0.5 text-[12px] font-semibold mb-0.5 ${marginColor(s.margin)}`}>
                        {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{pct}%
                    </span>
                )}
            </div>
            <div className="text-[11px] text-[#6b7280] mt-1.5">net margin</div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#f3f4f6]">
                <div>
                    <div className="text-[11px] text-[#6b7280]">Revenue</div>
                    <div className="text-[14px] font-semibold text-black">{formatMoney(s.revenue, s.currency)}</div>
                </div>
                <div>
                    <div className="text-[11px] text-[#6b7280]">Costs</div>
                    <div className="text-[14px] font-semibold text-black">{formatMoney(s.costs, s.currency)}</div>
                </div>
            </div>
        </div>
    );
}

export default function Profitability({ rows = [], summary = [] }) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => rows.filter(r => {
        const q = search.toLowerCase();
        return !q || (r.name ?? '').toLowerCase().includes(q) || (r.client ?? '').toLowerCase().includes(q);
    }), [rows, search]);

    return (
        <AppLayout title="Profitability">
            <Head title="Profitability" />

            <p className="text-[13px] text-[#4b5563] mb-6">
                Revenue billed against true costs (vendor bills + payroll) for every project.
            </p>

            {summary.length === 0 ? (
                <div className="rounded-xl border border-[#e5e7eb] bg-white py-20 text-center">
                    <div className="mb-3 opacity-30 flex justify-center"><Inbox size={40} /></div>
                    <div className="text-[14px] text-[#4b5563]">No project financials yet.</div>
                    <div className="text-[12px] text-[#9ca3af] mt-1">Margin appears once a project has invoices, bills, or payroll.</div>
                </div>
            ) : (
                <>
                    {/* ── Margin by currency ──────────────────────────────────────── */}
                    <div className="flex flex-wrap gap-3 mb-7">
                        {summary.map(s => <SummaryCard key={s.currency} s={s} />)}
                    </div>

                    {/* ── Search ──────────────────────────────────────────────────── */}
                    <div className="relative mb-4 max-w-sm">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by project or client…"
                            className="w-full bg-white border border-[#e5e7eb] rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-black placeholder:text-[#9ca3af] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-150 hover:border-[#d1d5db] focus:border-[#4f6df5] focus:ring-[3px] focus:ring-[#4f6df5]/12"
                        />
                    </div>

                    {/* ── Per-project table ───────────────────────────────────────── */}
                    <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-[13px]">
                                <thead>
                                    <tr className="text-[11px] uppercase tracking-[0.5px] text-[#6b7280] border-b border-[#f3f4f6]">
                                        <th className="text-left font-semibold px-4 py-3">Project</th>
                                        <th className="text-right font-semibold px-4 py-3">Revenue</th>
                                        <th className="text-right font-semibold px-4 py-3">Bills</th>
                                        <th className="text-right font-semibold px-4 py-3">Payroll</th>
                                        <th className="text-right font-semibold px-4 py-3">Margin</th>
                                        <th className="text-right font-semibold px-4 py-3 w-[1%] whitespace-nowrap"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(r => (
                                        <tr key={r.id} className="border-b border-[#f6f7f9] last:border-0 hover:bg-[#fafbfc] transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-black">{r.name}</span>
                                                    {r.status && (
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${STATUS_CLS[r.status] ?? 'bg-gray-100 text-[#4b5563] border-gray-200'}`}>
                                                            {r.status}
                                                        </span>
                                                    )}
                                                </div>
                                                {r.client && <div className="text-[11px] text-[#6b7280] mt-0.5">{r.client}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-black">{formatMoney(r.revenue, r.currency)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums text-[#4b5563]">{formatMoney(r.bills, r.currency)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums text-[#4b5563]">{formatMoney(r.payroll, r.currency)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                <span className={`font-semibold ${marginColor(r.margin)}`}>{formatMoney(r.margin, r.currency)}</span>
                                                {r.margin_pct != null && (
                                                    <span className="text-[11px] text-[#9ca3af] ml-1.5">{r.margin_pct}%</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={route('projects.show', r.id)}
                                                    className="text-[#9ca3af] opacity-0 group-hover:opacity-100 hover:text-[#4f6df5] transition-all inline-flex"
                                                    title="Open project"
                                                >
                                                    <ExternalLink size={15} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-[#9ca3af]">No projects match your search.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}
