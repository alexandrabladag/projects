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

const PROJECT_PHASES = ['Discovery', 'Planning', 'Design', 'Development', 'Testing / QA', 'Staging', 'Deployment', 'Launch'];

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

    // Match phase loosely (e.g. "Design Phase" matches "Design")
    const phaseLower = (project.phase ?? '').toLowerCase();
    const currentPhaseIdx = PROJECT_PHASES.findIndex(p => phaseLower.includes(p.toLowerCase()) || p.toLowerCase().includes(phaseLower));
    // If project is completed, all phases are done
    const isCompleted = project.status === 'completed';

    return (
        <>
            <Head title={`${project.name} — Project Portal`} />

            <div className="min-h-screen bg-gradient-to-b from-[#f8f9fc] to-[#f0f2f8]">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-[#e5e7eb]/50 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {company?.logo_path && <img src={`/storage/${company.logo_path}`} alt="" className="h-7" />}
                            <span className="text-[14px] font-bold text-black">Project Portal</span>
                        </div>
                        <span className="text-[13px] font-medium text-[#4b5563]">{project.client}</span>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-6 py-10">
                    {/* Hero */}
                    <div className="text-center mb-10">
                        <Badge status={project.status} />
                        <h2 className="text-[16px] font-semibold text-[#6b7280] mt-3">
                            {project.client}
                            {project.client_record?.website && (
                                <a href={project.client_record.website.startsWith('http') ? project.client_record.website : `https://${project.client_record.website}`} target="_blank" className="text-[13px] font-normal text-[#4f6df5] hover:text-[#6380f7] ml-2">
                                    {project.client_record.website.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                        </h2>
                        <h1 className="text-[32px] font-extrabold text-black mt-1 leading-tight">{project.name}</h1>
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
                            {PROJECT_PHASES.map((phase, i) => {
                                const done = isCompleted || i < currentPhaseIdx;
                                const active = !isCompleted && i === currentPhaseIdx;
                                return (
                                    <div key={phase} className="flex flex-col items-center flex-1">
                                        <div className="flex items-center w-full">
                                            {i > 0 && <div className={`flex-1 h-0.5 ${done || active ? 'bg-emerald-300' : 'bg-[#e5e7eb]'}`} />}
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                done ? 'bg-emerald-500 text-white' : active ? 'bg-[#4f6df5] text-white ring-4 ring-[#4f6df5]/20' : 'bg-[#f0f0f0] text-[#d1d5db]'
                                            }`}>
                                                {done ? <CheckCircle size={14} /> : active ? <Circle size={8} fill="white" /> : <Circle size={8} />}
                                            </div>
                                            {i < PROJECT_PHASES.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-emerald-300' : 'bg-[#e5e7eb]'}`} />}
                                        </div>
                                        <span className={`text-[9px] text-center leading-tight mt-1.5 ${active ? 'text-[#4f6df5] font-bold' : done ? 'text-emerald-600 font-medium' : 'text-[#9ca3af]'}`}>{phase}</span>
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

                    {/* Work Progress — Phases & Tasks */}
                    {tasks.length > 0 && (() => {
                        const phaseInfo = {
                            'Phase 1 — Architecture & Planning': { duration: '2 weeks', note: 'Approval checkpoint before Phase 2', scope: ['Sitemap redesign & IA restructuring','Taxonomy modeling (CPTs, categories, tags, series)','URL restructuring strategy','301 redirect mapping plan','Wireframes: Top Page, Archive, Detail, About','Cleanup plan for unnecessary content'] },
                            'Phase 2 — Design & Development': { duration: '5–6 weeks', note: 'Approval checkpoint before Phase 3', scope: ['Header & branding','Mega menu (hover-triggered, visual)','Search + Recommended Keywords','Carousel (image/WebM, CMS-controlled)','Latest Updates section','Featured Industrial Parks section','Link Block System (3 columns)','Archive + detail templates (all CPTs)','ACF-based CMS flags & custom fields','Footer, policy pages, CSS reference page'] },
                            'Phase 3 — Migration & Redirects': { duration: '1–2 weeks', note: 'Only approved content migrated', scope: ['Content inventory review','Migration into CPT/taxonomy structure','Country taxonomy assignment','301 redirect implementation','Redirect integrity testing'] },
                            'Phase 4 — QA & Launch': { duration: '1–2 weeks', note: 'Target: June 2026', scope: ['Cross-browser & mobile testing','CMS validation (flags, ACF, carousel)','Redirect integrity verification','Deployment to client server','System structure documentation'] },
                        };
                        const byCategory = {};
                        tasks.forEach(t => { const cat = t.category || 'General'; if (!byCategory[cat]) byCategory[cat] = []; byCategory[cat].push(t); });
                        const phaseColors = ['from-[#4f6df5] to-[#6380f7]','from-violet-500 to-indigo-500','from-amber-500 to-orange-400','from-emerald-500 to-teal-400'];

                        return (
                            <div className="mb-8">
                                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-[18px] font-bold text-black">Work Progress</h2>
                                        <div className="text-right">
                                            <span className="text-[22px] font-extrabold text-[#4f6df5]">{totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
                                            <div className="text-[11px] text-[#9ca3af]">{completedTasks} of {totalTasks} tasks</div>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-[#f0f0f0] rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 progress-fill" style={{ width: `${totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0}%` }} />
                                    </div>
                                </div>

                                {/* Phases */}
                                <div className="space-y-5">
                                    {Object.entries(byCategory).map(([cat, catTasks], idx) => {
                                        const done = catTasks.filter(t => t.status === 'completed').length;
                                        const inProgress = catTasks.filter(t => t.status === 'in-progress').length;
                                        const pct = Math.round((done / catTasks.length) * 100);
                                        const info = phaseInfo[cat] ?? {};
                                        const color = phaseColors[idx % phaseColors.length];
                                        const isAllDone = pct === 100;
                                        const isActive = inProgress > 0 || (done > 0 && !isAllDone);
                                        const dates = catTasks.filter(t => t.due_date).map(t => new Date(t.due_date));
                                        const earliest = dates.length ? new Date(Math.min(...dates)) : null;
                                        const latest = dates.length ? new Date(Math.max(...dates)) : null;
                                        const dateRange = earliest && latest
                                            ? `${earliest.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${latest.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`
                                            : '';

                                        return (
                                            <div key={cat} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                                                <div className={`bg-gradient-to-r ${isAllDone ? 'from-emerald-500 to-emerald-400' : color} px-6 py-5 text-white`}>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Phase {idx+1}</span>
                                                                {info.duration && <span className="text-[10px] opacity-60">· {info.duration}</span>}
                                                                {isAllDone && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Complete</span>}
                                                                {isActive && !isAllDone && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">In Progress</span>}
                                                            </div>
                                                            <div className="text-[16px] font-bold">{cat.replace(/^Phase \d+ — /,'')}</div>
                                                            {dateRange && <div className="text-[12px] opacity-70 mt-0.5">{dateRange}</div>}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[24px] font-extrabold">{pct}%</div>
                                                            <div className="text-[11px] opacity-70">{done}/{catTasks.length}</div>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-3">
                                                        <div className="h-full rounded-full bg-white/80 progress-fill" style={{width:`${pct}%`}} />
                                                    </div>
                                                </div>
                                                {info.note && <div className="px-6 py-2.5 bg-[#fafbfc] border-b border-[#f0f0f0] text-[12px] text-[#6b7280] italic">{info.note}</div>}
                                                {info.scope && (
                                                    <div className="px-6 py-3 border-b border-[#f0f0f0]">
                                                        <div className="text-[10px] uppercase tracking-wider text-[#9ca3af] font-medium mb-2">Scope</div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {info.scope.map((s,i) => <span key={i} className="text-[11px] px-2 py-0.5 bg-[#f3f4f6] border border-[#e5e7eb] rounded-full text-[#4b5563]">{s}</span>)}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="px-6 py-2">
                                                    {catTasks.map(t => (
                                                        <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-[#f8f8f8] last:border-b-0">
                                                            {t.status === 'completed'
                                                                ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                                                                : t.status === 'in-progress'
                                                                    ? <div className="w-4 h-4 rounded-full border-2 border-[#4f6df5] flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 rounded-full bg-[#4f6df5]" /></div>
                                                                    : <Circle size={16} className="text-[#d1d5db] flex-shrink-0" />
                                                            }
                                                            <span className={`text-[13px] flex-1 ${t.status === 'completed' ? 'text-emerald-600' : 'text-black'}`}>{t.title}</span>
                                                            {t.due_date && <span className="text-[11px] text-[#9ca3af]">{new Date(t.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>}
                                                            <Badge status={t.status} label={t.status==='completed'?'Done':t.status==='in-progress'?'In Progress':t.status==='review'?'Review':'To Do'} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

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
