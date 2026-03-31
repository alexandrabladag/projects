import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/Layouts/AppLayout';
import { formatMoney, getCurrency } from '@/Utils/currencies';
import {
    FileText, Receipt, CalendarDays, Eye, ChevronDown, ChevronUp,
    CheckCircle, Circle, Clock, MapPin, Users, ArrowRight,
} from 'lucide-react';

const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
const fmtShort = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

const PROJECT_PHASES = ['Discovery', 'Planning', 'Design', 'Development', 'Testing / QA', 'Staging', 'Deployment', 'Launch', 'Maintenance', 'Support'];

export default function Public({ project, company, code }) {
    const cur = getCurrency(project.currency ?? 'USD');
    const fmt = (n) => formatMoney(n, cur.code);
    const proposals = project.proposals ?? [];
    const invoices = project.invoices ?? [];
    const meetings = (project.meetings ?? []).filter(m => m.status === 'scheduled');
    const tasks = project.tasks ?? [];
    const [expandedInv, setExpandedInv] = useState(null);

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;

    // Deliverables from proposals
    const deliverables = proposals.flatMap(p => p.deliverables ?? []);

    const progressColor = project.progress >= 90 ? 'from-emerald-500 to-emerald-400'
        : project.progress >= 50 ? 'from-[#4f6df5] to-[#6380f7]' : 'from-amber-400 to-amber-300';

    const currentPhaseIdx = PROJECT_PHASES.findIndex(p => p === project.phase);

    return (
        <>
            <Head title={`${project.name} — Project Portal`} />

            <div className="min-h-screen bg-gradient-to-b from-[#f8f9fc] to-[#f0f2f8]">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-[#e5e7eb]/50 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {company?.logo_path && <img src={`/storage/${company.logo_path}`} alt="" className="h-7" />}
                            <span className="text-[14px] font-bold text-black">{company?.name ?? 'Project Portal'}</span>
                        </div>
                        {company?.email && <span className="text-[12px] text-[#9ca3af]">{company.email}</span>}
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-6 py-10">
                    {/* Hero */}
                    <div className="text-center mb-10">
                        <Badge status={project.status} />
                        <h1 className="text-[32px] font-extrabold text-black mt-3 leading-tight">{project.name}</h1>
                        {project.description && (
                            <p className="text-[15px] text-[#6b7280] mt-3 max-w-2xl mx-auto leading-relaxed">{project.description}</p>
                        )}
                    </div>

                    {/* Progress Card */}
                    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 mb-8 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[13px] font-medium text-[#6b7280]">Overall Progress</span>
                            <span className="text-[28px] font-extrabold text-[#4f6df5]">{project.progress}%</span>
                        </div>
                        <div className="h-3 bg-[#f0f0f0] rounded-full overflow-hidden mb-6">
                            <div className={`h-full rounded-full bg-gradient-to-r ${progressColor} progress-fill`} style={{ width: `${project.progress}%` }} />
                        </div>

                        {/* Phase timeline */}
                        <div className="flex items-center justify-between">
                            {PROJECT_PHASES.slice(0, 8).map((phase, i) => {
                                const done = i < currentPhaseIdx;
                                const active = i === currentPhaseIdx;
                                return (
                                    <div key={phase} className="flex flex-col items-center flex-1">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1.5 ${
                                            done ? 'bg-emerald-100 text-emerald-500' : active ? 'bg-[#4f6df5] text-white' : 'bg-[#f0f0f0] text-[#d1d5db]'
                                        }`}>
                                            {done ? <CheckCircle size={14} /> : active ? <Circle size={10} fill="white" /> : <Circle size={10} />}
                                        </div>
                                        <span className={`text-[9px] text-center leading-tight ${active ? 'text-[#4f6df5] font-bold' : done ? 'text-emerald-600' : 'text-[#9ca3af]'}`}>{phase}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Timeline', value: `${fmtShort(project.start_date)} — ${fmtShort(project.end_date)}`, icon: <Clock size={16} />, bg: 'bg-sky-50', ic: 'text-sky-500' },
                            { label: 'Budget', value: fmt(project.budget), icon: <Receipt size={16} />, bg: 'bg-indigo-50', ic: 'text-indigo-500' },
                            { label: 'Tasks', value: `${completedTasks}/${totalTasks} done`, icon: <CheckCircle size={16} />, bg: 'bg-emerald-50', ic: 'text-emerald-500' },
                            { label: 'Meetings', value: `${meetings.length} upcoming`, icon: <CalendarDays size={16} />, bg: 'bg-violet-50', ic: 'text-violet-500' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm">
                                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center ${s.ic} mb-2`}>{s.icon}</div>
                                <div className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-medium">{s.label}</div>
                                <div className="text-[15px] font-bold text-black mt-0.5">{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Deliverables */}
                    {deliverables.length > 0 && (
                        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-8 shadow-sm">
                            <h2 className="text-[16px] font-bold text-black mb-4">Deliverables</h2>
                            <div className="grid grid-cols-2 gap-2">
                                {deliverables.map((d, i) => {
                                    const matchingTask = tasks.find(t => t.title.toLowerCase().includes(d.toLowerCase().slice(0, 15)));
                                    const isDone = matchingTask?.status === 'completed';
                                    return (
                                        <div key={i} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all ${isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-[#fafbfc] border-[#e5e7eb]'}`}>
                                            {isDone
                                                ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                                                : <Circle size={16} className="text-[#d1d5db] flex-shrink-0" />
                                            }
                                            <span className={`text-[13px] ${isDone ? 'text-emerald-700' : 'text-black'}`}>{d}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tasks Progress */}
                    {tasks.length > 0 && (
                        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-8 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[16px] font-bold text-black">Work Progress</h2>
                                <span className="text-[13px] text-[#6b7280]">{completedTasks} of {totalTasks} tasks completed</span>
                            </div>
                            <div className="space-y-1.5">
                                {tasks.map(t => (
                                    <div key={t.id} className="flex items-center gap-3 py-2">
                                        {t.status === 'completed'
                                            ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                                            : t.status === 'in-progress'
                                                ? <div className="w-4 h-4 rounded-full border-2 border-[#4f6df5] flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 rounded-full bg-[#4f6df5]" /></div>
                                                : <Circle size={16} className="text-[#d1d5db] flex-shrink-0" />
                                        }
                                        <span className={`text-[13px] flex-1 ${t.status === 'completed' ? 'text-[#9ca3af] line-through' : 'text-black'}`}>{t.title}</span>
                                        <Badge status={t.status} label={t.status === 'completed' ? 'Done' : t.status === 'in-progress' ? 'In Progress' : 'Upcoming'} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Proposals */}
                    {proposals.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-[16px] font-bold text-black mb-4">Proposals</h2>
                            {proposals.map(pr => (
                                <div key={pr.id} className="bg-white rounded-xl border border-[#e5e7eb] p-5 mb-3 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-[15px] font-bold text-black">{pr.title}</div>
                                            <div className="text-[12px] text-[#9ca3af] mt-0.5">{fmtDate(pr.date)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[18px] font-bold text-black">{fmt(pr.amount)}</div>
                                            <Badge status={pr.status} />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Link href={route('proposals.view', pr.id)} className="inline-flex items-center gap-1 text-[13px] text-[#4f6df5] font-medium hover:text-[#6380f7] transition-colors">
                                            View Full Proposal <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Invoices */}
                    {invoices.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-[16px] font-bold text-black mb-4">Invoices</h2>
                            <div className="space-y-3">
                                {invoices.map(inv => (
                                    <div key={inv.id} className={`bg-white rounded-xl border border-[#e5e7eb] border-l-[3px] overflow-hidden shadow-sm ${
                                        inv.status === 'paid' ? 'border-l-emerald-400' : inv.status === 'sent' ? 'border-l-indigo-400' : 'border-l-gray-300'
                                    }`}>
                                        <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => setExpandedInv(expandedInv === inv.id ? null : inv.id)}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-[13px] font-mono font-bold text-black">{inv.number}</span>
                                                    <Badge status={inv.status} />
                                                </div>
                                                <div className="text-[12px] text-[#9ca3af] mt-0.5">{inv.description}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[17px] font-bold text-black">{fmt(inv.total)}</div>
                                                <div className="text-[11px] text-[#9ca3af]">{inv.status === 'paid' ? 'Paid' : `Due ${fmtShort(inv.due_date)}`}</div>
                                            </div>
                                            <Link href={route('invoices.view', inv.id)} onClick={e => e.stopPropagation()} className="text-[#4f6df5] hover:text-[#6380f7]"><Eye size={16} /></Link>
                                            <span className="text-[#d1d5db]">{expandedInv === inv.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                                        </div>
                                        {expandedInv === inv.id && (
                                            <div className="px-5 py-4 bg-[#fafbfc] border-t border-[#f0f0f0]">
                                                {(inv.items ?? []).map((item, i) => (
                                                    <div key={i} className="flex justify-between py-2 border-b border-[#f0f0f0] last:border-b-0 text-[13px]">
                                                        <span className="text-[#4b5563]">{item.description}</span>
                                                        <span className="font-medium text-black">{fmt(item.quantity * item.rate)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Meetings */}
                    {meetings.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-[16px] font-bold text-black mb-4">Upcoming Meetings</h2>
                            <div className="space-y-3">
                                {meetings.map(m => (
                                    <div key={m.id} className="bg-white rounded-xl border border-[#e5e7eb] p-5 flex gap-4 shadow-sm">
                                        <div className="w-14 h-14 bg-gradient-to-br from-[#4f6df5] to-[#6380f7] rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white">
                                            <div className="text-[18px] font-bold leading-none">{new Date(m.date).getDate()}</div>
                                            <div className="text-[9px] tracking-wide uppercase opacity-80">{new Date(m.date).toLocaleString('en-US', { month: 'short' })}</div>
                                        </div>
                                        <div>
                                            <div className="text-[15px] font-semibold text-black mb-1">{m.title}</div>
                                            <div className="flex items-center gap-3 text-[12px] text-[#6b7280]">
                                                {m.time && <span className="flex items-center gap-1"><Clock size={12} /> {m.time}</span>}
                                                {m.duration && <span>{m.duration}</span>}
                                                {m.location && <span className="flex items-center gap-1"><MapPin size={12} /> {m.location}</span>}
                                            </div>
                                            {m.attendees && m.attendees.length > 0 && (
                                                <div className="flex items-center gap-1 mt-2 text-[11px] text-[#9ca3af]">
                                                    <Users size={12} /> {m.attendees.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center pt-8 pb-4 border-t border-[#e5e7eb]/50">
                        <div className="text-[12px] text-[#9ca3af]">
                            {company?.name && <span>{company.name}</span>}
                            {company?.website && <span> · {company.website}</span>}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
