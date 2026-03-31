import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/Layouts/AppLayout';
import { formatMoney, getCurrency } from '@/Utils/currencies';
import { FileText, Receipt, CalendarDays, Eye, ChevronDown, ChevronUp, Lock } from 'lucide-react';

const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function Public({ project, code }) {
    const [tab, setTab] = useState('overview');
    const cur = getCurrency(project.currency ?? 'USD');
    const fmt = (n) => formatMoney(n, cur.code);
    const proposals = project.proposals ?? [];
    const invoices = project.invoices ?? [];
    const meetings = project.meetings ?? [];
    const [expanded, setExpanded] = useState(null);

    const progressColor = project.progress >= 90 ? 'from-emerald-500 to-emerald-400'
        : project.progress >= 50 ? 'from-[#4f6df5] to-[#6380f7]' : 'from-amber-400 to-amber-300';

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Eye size={15} /> },
        { id: 'proposals', label: `Proposals (${proposals.length})`, icon: <FileText size={15} /> },
        { id: 'invoices', label: `Invoices (${invoices.length})`, icon: <Receipt size={15} /> },
        { id: 'meetings', label: `Meetings (${meetings.length})`, icon: <CalendarDays size={15} /> },
    ];

    return (
        <>
            <Head title={project.name} />

            <div className="min-h-screen bg-[#f8f8f8]">
                {/* Header */}
                <header className="bg-white border-b border-[#e5e7eb]">
                    <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-black">
                            <Lock size={15} className="text-[#4f6df5]" /> Client Portal
                        </div>
                        <Badge status={project.status} />
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-6 py-8">
                    {/* Hero */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 mb-6">
                        <h1 className="text-[22px] font-bold text-black mb-1">{project.name}</h1>
                        <div className="text-[13px] text-[#6b7280] mb-4">{project.phase} · {fmtDate(project.start_date)} – {fmtDate(project.end_date)}</div>

                        <div className="mb-4">
                            <div className="flex justify-between text-[12px] mb-1.5">
                                <span className="text-[#6b7280]">Progress</span>
                                <span className="font-bold text-black">{project.progress}%</span>
                            </div>
                            <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${progressColor} progress-fill`} style={{ width: `${project.progress}%` }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#f0f0f0]">
                            <div><div className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-medium">Budget</div><div className="text-[18px] font-bold text-black">{fmt(project.budget)}</div></div>
                            <div><div className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-medium">Billed</div><div className="text-[18px] font-bold text-indigo-600">{fmt(project.total_billed)}</div></div>
                            <div><div className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-medium">Paid</div><div className="text-[18px] font-bold text-emerald-600">{fmt(project.total_paid)}</div></div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-[#e5e7eb] mb-6 flex gap-0">
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-all ${tab === t.id ? 'border-[#4f6df5] text-[#4f6df5]' : 'border-transparent text-[#6b7280] hover:text-black'}`}>
                                {t.icon}{t.label}
                            </button>
                        ))}
                    </div>

                    {/* Overview */}
                    {tab === 'overview' && project.description && (
                        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
                            <div className="text-[14px] font-bold text-black mb-2">About This Project</div>
                            <p className="text-[13px] text-[#4b5563] leading-relaxed">{project.description}</p>
                        </div>
                    )}

                    {/* Proposals */}
                    {tab === 'proposals' && proposals.map(pr => (
                        <div key={pr.id} className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-3">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-[15px] font-bold text-black">{pr.title}</div>
                                    <div className="text-[12px] text-[#6b7280]">Issued {fmtDate(pr.date)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge status={pr.status} />
                                    <div className="text-[18px] font-bold text-black">{fmt(pr.amount)}</div>
                                </div>
                            </div>
                            {pr.content && <div className="mt-3 pt-3 border-t border-[#f0f0f0] text-[12px] text-[#6b7280] line-clamp-3" dangerouslySetInnerHTML={{ __html: pr.content.replace(/<[^>]*>/g, ' ').slice(0, 300) }} />}
                            <div className="mt-3">
                                <Link href={route('proposals.view', pr.id)} className="text-[12px] text-[#4f6df5] font-medium">View Full Proposal →</Link>
                            </div>
                        </div>
                    ))}

                    {/* Invoices */}
                    {tab === 'invoices' && invoices.map(inv => (
                        <div key={inv.id} className={`bg-white border border-[#e5e7eb] border-l-[3px] ${inv.status === 'paid' ? 'border-l-emerald-400' : inv.status === 'sent' ? 'border-l-indigo-400' : 'border-l-gray-300'} rounded-xl overflow-hidden mb-3`}>
                            <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#fafbfc] transition-colors" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2.5 mb-0.5">
                                        <span className="text-[13px] font-mono font-bold text-black">{inv.number}</span>
                                        <Badge status={inv.status} />
                                    </div>
                                    <div className="text-[12px] text-[#6b7280]">{inv.description}</div>
                                </div>
                                <div className="text-right mr-2">
                                    <div className="text-[17px] font-bold text-black">{fmt(inv.total)}</div>
                                    <div className="text-[11px] text-[#9ca3af]">{inv.status === 'paid' ? 'Paid' : `Due ${fmtDate(inv.due_date)}`}</div>
                                </div>
                                <Link href={route('invoices.view', inv.id)} onClick={e => e.stopPropagation()} className="text-[#4f6df5]"><Eye size={16} /></Link>
                                <span className="text-[#9ca3af]">{expanded === inv.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                            </div>
                            {expanded === inv.id && (
                                <div className="px-5 py-4 bg-[#fafbfc] border-t border-[#f0f0f0]">
                                    {(inv.items ?? []).map((item, i) => (
                                        <div key={i} className="flex justify-between py-2 border-b border-[#f0f0f0] last:border-b-0 text-[13px]">
                                            <span>{item.description}</span>
                                            <span className="font-medium">{fmt(item.quantity * item.rate)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Meetings */}
                    {tab === 'meetings' && meetings.map(m => (
                        <div key={m.id} className="bg-white border border-[#e5e7eb] rounded-xl p-5 flex gap-4 mb-3">
                            <div className="w-12 h-12 bg-[#4f6df5]/10 border border-[#4f6df5]/20 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                                <div className="text-[16px] font-bold text-[#4f6df5] leading-none">{new Date(m.date).getDate()}</div>
                                <div className="text-[9px] text-[#4f6df5] tracking-wide uppercase">{new Date(m.date).toLocaleString('en-US', { month: 'short' })}</div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1"><span className="text-[14px] font-semibold text-black">{m.title}</span><Badge status={m.status} /></div>
                                <div className="text-[12px] text-[#6b7280]">{m.time} · {m.duration} · {m.location}</div>
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        </>
    );
}
