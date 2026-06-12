import { useState, useEffect, lazy, Suspense } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';
import { useConfirm } from '@/Components/ui/ConfirmDialog';
import Select from '@/Components/ui/Select';
import currencies from '@/Utils/currencies';
import {
    Pencil, Eye, Plus, Save, X, Check, Send, ChevronUp, ChevronDown, ChevronRight, GripVertical,
    FileText, Receipt, CalendarDays, Calendar, FolderOpen, Clock, ListChecks,
    TrendingUp, Wallet, CircleDollarSign, Flag, Activity,
    Trash2, Download, Upload, CheckCircle, XCircle, AlertCircle, Lock, Code, Users, Maximize2, Minimize2, Tag,
    Package, MessageSquare, CornerDownRight,
} from 'lucide-react';

const RichEditor = lazy(() => import('@/Components/RichEditor'));

// ── Helpers ───────────────────────────────────────────────────────────────────
import { formatMoney, getCurrency } from '@/Utils/currencies';
const fmtUSD = (n) => '$' + Number(n ?? 0).toLocaleString(); // fallback
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const parseDay = (s) => { const d = new Date(s); return { day: d.getDate(), mon: d.toLocaleString('en-US', { month: 'short' }) }; };
const MTG_TYPES   = { kickoff:'Kickoff', review:'Review', checkin:'Check-in', presentation:'Presentation', discovery:'Discovery', other:'Other' };
const PROJECT_PHASES = [
    { name: 'Discovery',    progress: 5 },
    { name: 'Planning',     progress: 15 },
    { name: 'Design',       progress: 25 },
    { name: 'Development',  progress: 50 },
    { name: 'Testing / QA', progress: 70 },
    { name: 'Staging',      progress: 80 },
    { name: 'Deployment',   progress: 90 },
    { name: 'Launch',       progress: 95 },
    { name: 'Maintenance',  progress: 100 },
    { name: 'Support',      progress: 100 },
];
const DOC_ICONS   = { contract:'📋', brief:'📝', report:'📊', asset:'🖼️', other:'📁' };
const DOC_COLORS  = { contract:'bg-red-500/10', brief:'bg-orange-500/10', report:'bg-blue-500/10', asset:'bg-purple-500/10', other:'bg-gray-100' };

// ── Modal Wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, subtitle, large, onClose, children, footer }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-5" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`bg-white border border-[#d1d5db] rounded-t-2xl md:rounded-2xl w-full flex flex-col max-h-[92vh] md:max-h-[88vh] ${large ? 'md:max-w-[660px]' : 'md:max-w-[560px]'}`}>
                <div className="flex justify-between items-start p-4 md:p-6 pb-3 md:pb-4 flex-shrink-0">
                    <div>
                        <div className="font-serif text-[21px] font-semibold text-black">{title}</div>
                        {subtitle && <div className="text-[12px] text-[#4b5563] mt-1">{subtitle}</div>}
                    </div>
                    <button onClick={onClose} className="text-[#4b5563] hover:text-black text-[22px] leading-none transition-colors">×</button>
                </div>
                <div className="px-4 md:px-6 pb-2 overflow-y-auto flex-1">{children}</div>
                {footer && <div className="flex justify-end gap-2.5 p-4 md:p-6 pt-3 md:pt-4 flex-shrink-0">{footer}</div>}
            </div>
        </div>
    );
}

// ── Shared form field ─────────────────────────────────────────────────────────
const FG = ({ label, error, hint, children }) => (
    <div>
        {label && <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-semibold mb-1.5">{label}</label>}
        {children}
        {hint && !error && <p className="text-[#6b7280] text-[11px] mt-1.5">{hint}</p>}
        {error && <p className="text-red-500 text-[11px] font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} className="flex-shrink-0" /> {error}</p>}
    </div>
);
const inputCls = 'w-full bg-white border border-[#e5e7eb] rounded-lg px-3.5 py-2.5 text-[13px] text-black placeholder:text-[#9ca3af] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-150 hover:border-[#d1d5db] focus:border-[#4f6df5] focus:ring-[3px] focus:ring-[#4f6df5]/12';
const Btn = ({ children, primary, ghost, danger, sm, onClick, type = 'button', disabled }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all disabled:opacity-60 whitespace-nowrap
            ${sm ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2.5 text-[13px]'}
            ${primary ? 'bg-[#4f6df5] hover:bg-[#6380f7] text-white' : ''}
            ${ghost  ? 'bg-transparent text-[#374151] border border-[#d1d5db] hover:bg-gray-100 hover:text-black' : ''}
            ${danger ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15' : ''}
        `}
    >{children}</button>
);

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────
function OverviewTab({ project, canManage, fmt }) {
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const progressForm = useForm({ progress: project.progress, phase: project.phase });
    const editForm = useForm({
        name: project.name ?? '', client: project.client ?? '',
        contact_name: project.contact_name ?? '', contact_email: project.contact_email ?? '', contact_phone: project.contact_phone ?? '',
        status: project.status ?? 'active', start_date: project.start_date ? project.start_date.slice(0, 10) : '',
        end_date: project.end_date ? project.end_date.slice(0, 10) : '',
        launch_date: project.launch_date ? project.launch_date.slice(0, 10) : '',
        budget: project.budget ?? '', currency: project.currency ?? 'USD',
        tax_type: project.tax_type ?? '', tax_rate: project.tax_rate ?? 0,
        lead_id: project.lead_id ?? '',
        description: project.description ?? '',
        tags: (project.tags ?? []).join(', '), phase: project.phase ?? 'Discovery',
    });

    const saveProgress = () => {
        progressForm.patch(route('projects.progress', project.id), { onSuccess: () => setShowProgressModal(false) });
    };

    const saveEdit = () => {
        editForm.put(route('projects.update', project.id), { onSuccess: () => setShowEditModal(false) });
    };

    const budgetPct = project.budget > 0 ? Math.min(100, Math.round((project.spent / project.budget) * 100)) : 0;
    const budgetColor = budgetPct > 90 ? '#f56060' : budgetPct > 70 ? '#f0924c' : '';

    // ── Derived metrics a PM scans first ──────────────────────────────────────
    const today = new Date();
    const toDate = (s) => (s ? new Date(s) : null);
    const startD = toDate(project.start_date), endD = toDate(project.end_date), launchD = toDate(project.launch_date);
    const deadline = launchD || endD;
    const daysLeft = deadline ? Math.ceil((deadline - today) / 86400000) : null;
    const isOverdue = daysLeft !== null && daysLeft < 0 && project.progress < 100;
    const timelinePct = (startD && endD && endD > startD)
        ? Math.min(100, Math.max(0, Math.round(((today - startD) / (endD - startD)) * 100))) : null;

    const billed = project.total_billed ?? 0;
    const vendorBills = project.total_bills ?? 0;
    const net = billed - vendorBills;

    // Bills/payroll can be in currencies other than the project's. Show the cost
    // figures grouped by their actual currency rather than forcing them into one,
    // so e.g. PHP bills aren't displayed with a $ sign.
    const projectCurrency = project.currency ?? 'USD';
    const sumByCurrency = (list) => list.reduce((m, x) => { const c = x.currency ?? projectCurrency; m[c] = (m[c] ?? 0) + parseFloat(x.amount ?? 0); return m; }, {});
    const fmtByCurrency = (map) => { const e = Object.entries(map); return e.length ? e.map(([c, v]) => formatMoney(v, c)).join(' + ') : fmt(0); };
    const projectBills = project.bills ?? [];
    const projectPayroll = project.payroll ?? [];
    const vendorBillsByCur = sumByCurrency(projectBills);
    const billsPaidByCur = sumByCurrency(projectBills.filter(b => b.status === 'paid'));
    const spentByCur = sumByCurrency([...projectBills.filter(b => b.status === 'paid'), ...projectPayroll.filter(p => p.status === 'paid')]);

    const phaseIdx = PROJECT_PHASES.findIndex(p => p.name === project.phase);

    const health = project.status === 'completed' ? { label: 'Completed', color: '#4f6df5' }
        : budgetPct > 90 ? { label: 'Over Budget', color: '#f56060' }
        : isOverdue ? { label: 'Overdue', color: '#f56060' }
        : budgetPct > project.progress + 15 ? { label: 'At Risk', color: '#f0924c' }
        : { label: 'On Track', color: '#16a34a' };

    const Kpi = ({ icon, label, value, sub, accent = '#4f6df5', bar, barColor }) => (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 md:p-5 hover:shadow-[0_2px_14px_rgba(17,24,39,0.05)] hover:border-[#d6dae0] transition-all">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3.5" style={{ background: `${accent}14`, color: accent }}>{icon}</div>
            <div className="text-[24px] md:text-[27px] font-bold text-black leading-none tracking-tight">{value}</div>
            <div className="text-[12px] text-[#4b5563] mt-1.5">{label}</div>
            {bar !== undefined && bar !== null && (
                <div className="h-1.5 bg-[#eef0f2] rounded-full overflow-hidden mt-3">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${bar}%`, background: barColor || accent }} />
                </div>
            )}
            {sub && <div className="text-[11px] text-[#6b7280] mt-2 truncate">{sub}</div>}
        </div>
    );

    return (
        <div>
            {/* Hero */}
            <div className="relative bg-white border border-[#e5e7eb] rounded-xl overflow-hidden mb-5">
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${health.color}, ${health.color}40)` }} />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 p-5 md:p-6">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${health.color}14`, color: health.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: health.color }} />
                                {health.label}
                            </span>
                            <Badge status={project.status} />
                        </div>
                        <h2 className="font-serif text-[24px] md:text-[30px] font-semibold text-black leading-tight break-words">{project.name}</h2>
                        <p className="text-[13px] md:text-[14px] text-[#4b5563] mt-1.5">
                            {project.client} · {project.contact_name}
                            {project.lead && <span> · Lead: <span className="text-[#4f6df5] font-medium">{project.lead.name}</span></span>}
                        </p>
                        <div className="flex gap-2 flex-wrap mt-3">
                            <span className="text-[11px] px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-600 font-medium">{project.phase}</span>
                            {(project.tags ?? []).map(t => <span key={t} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 bg-[#f3f4f6] border border-[#e5e7eb] rounded-full text-[#4b5563] font-medium"><Tag size={9} />{t}</span>)}
                        </div>
                    </div>
                    {canManage && (
                        <div className="flex gap-2 flex-shrink-0">
                            <Btn ghost sm onClick={() => setShowProgressModal(true)}><Pencil size={13} /> Progress</Btn>
                            <Btn ghost sm onClick={() => setShowEditModal(true)}><Pencil size={13} /> Edit Project</Btn>
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Strip — the four numbers a PM scans first */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
                <Kpi icon={<Activity size={17} />} accent="#4f6df5" value={`${project.progress}%`}
                    label="Overall Progress" bar={project.progress} sub={project.phase} />
                <Kpi icon={<Clock size={17} />} accent={isOverdue ? '#f56060' : '#4f6df5'}
                    value={daysLeft === null ? '—' : isOverdue ? `${Math.abs(daysLeft)}d over` : `${daysLeft} days`}
                    label={isOverdue ? 'Past Deadline' : 'Time Remaining'}
                    bar={timelinePct} barColor={isOverdue ? '#f56060' : '#4f6df5'}
                    sub={deadline ? `Due ${fmtDate(deadline)}` : 'No deadline set'} />
                <Kpi icon={<Wallet size={17} />} accent={budgetColor || '#4f6df5'} value={`${budgetPct}%`}
                    label="Budget Used" bar={budgetPct} barColor={budgetColor || '#4f6df5'}
                    sub={`${fmtByCurrency(spentByCur)} of ${fmt(project.budget)}`} />
                <Kpi icon={<CircleDollarSign size={17} />} accent={net >= 0 ? '#16a34a' : '#f56060'}
                    value={fmt(net)} label="Net (Billed − Bills)"
                    sub={`${fmt(billed)} billed · ${fmtByCurrency(vendorBillsByCur)} bills`} />
            </div>

            {/* Project Lifecycle */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[14px] font-bold text-black flex items-center gap-2"><Flag size={14} className="text-[#4f6df5]" /> Project Lifecycle</span>
                    <span className="text-[12px] text-[#4b5563]">{phaseIdx >= 0 ? `Stage ${phaseIdx + 1} of ${PROJECT_PHASES.length}` : project.phase}</span>
                </div>
                <div className="flex items-start overflow-x-auto py-1 -mx-1 px-1">
                    {PROJECT_PHASES.map((p, i) => {
                        const done = phaseIdx > i, current = phaseIdx === i;
                        return (
                            <div key={p.name} className="flex flex-col items-center flex-1 min-w-[62px] relative">
                                {i > 0 && <div className="absolute top-[11px] right-1/2 w-full h-0.5" style={{ background: (done || current) ? '#4f6df5' : '#e5e7eb' }} />}
                                <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${done ? 'bg-[#4f6df5] text-white' : current ? 'bg-white text-[#4f6df5] ring-2 ring-[#4f6df5]' : 'bg-[#f3f4f6] text-[#6b7280] ring-1 ring-[#e5e7eb]'}`}>
                                    {done ? <Check size={12} /> : i + 1}
                                </div>
                                <div className={`text-[10px] mt-2 text-center leading-tight px-0.5 ${current ? 'text-[#4f6df5] font-semibold' : done ? 'text-[#374151]' : 'text-[#6b7280]'}`}>{p.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Team / Contractors */}
            <TeamSection project={project} canManage={canManage} />

            {/* Client Access */}
            <ClientAccessSection project={project} canManage={canManage} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-5">
                    {/* Description */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-center gap-2"><FileText size={14} className="text-[#4f6df5]" /><span className="text-[14px] font-bold">Project Description</span></div>
                        <div className="px-5 py-4 text-[13.5px] text-[#374151] leading-relaxed">{project.description || '—'}</div>
                    </div>

                    {/* Client Info */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-center gap-2"><Users size={14} className="text-[#4f6df5]" /><span className="text-[14px] font-bold">Client Information</span></div>
                        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { l: 'Contact', v: project.contact_name },
                                { l: 'Email', v: project.contact_email, gold: true },
                                { l: 'Phone', v: project.contact_phone },
                                { l: 'Company', v: project.client },
                            ].map(({ l, v, gold }) => (
                                <div key={l}>
                                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#4b5563] mb-1">{l}</div>
                                    <div className={`text-[13.5px] ${gold ? 'text-[#4f6df5]' : 'text-black'}`}>{v ?? '—'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Financial */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-center gap-2"><CircleDollarSign size={14} className="text-[#4f6df5]" /><span className="text-[14px] font-bold">Financial Overview</span></div>
                        <div className="px-5 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                {[
                                    { l: 'Project Budget', v: fmt(project.budget), serif: true },
                                    { l: 'Spent (Bills)', v: fmtByCurrency(spentByCur), serif: true, warn: budgetPct > 90 },
                                    { l: 'Billed to Client', v: fmt(project.total_billed) },
                                    { l: 'Received', v: fmt(project.total_paid), green: true },
                                    { l: 'Vendor Bills', v: fmtByCurrency(vendorBillsByCur) },
                                    { l: 'Bills Paid', v: fmtByCurrency(billsPaidByCur), green: true },
                                ].map(({ l, v, serif, warn, green }) => (
                                    <div key={l}>
                                        <div className="text-[10px] tracking-[1.5px] uppercase text-[#4b5563] mb-1">{l}</div>
                                        <div className={`${serif ? 'font-serif text-[20px] font-semibold' : 'text-[14px]'} ${warn ? 'text-red-400' : green ? 'text-green-400' : 'text-black'}`}>{v}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-[12px] text-[#4b5563] flex justify-between mb-1.5"><span>Budget utilization</span><span style={{ color: budgetColor || '#4b5563' }}>{budgetPct}%</span></div>
                            <div className="h-1.5 bg-[#d1d5db] rounded-full overflow-hidden">
                                <div className="h-full rounded-full progress-fill" style={{ width: `${budgetPct}%`, background: budgetColor || 'linear-gradient(90deg, #4f6df5, #6380f7)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-center gap-2"><ListChecks size={14} className="text-[#4f6df5]" /><span className="text-[14px] font-bold">Quick Summary</span></div>
                        <div className="px-5 py-2">
                            {[
                                { l: 'Proposals', v: `${project.proposals?.length ?? 0} total` },
                                { l: 'Invoices', v: `${project.invoices?.length ?? 0} total · ${project.invoices?.filter(i => i.status === 'paid').length ?? 0} paid` },
                                { l: 'Meetings', v: `${project.meetings?.length ?? 0} total · ${project.meetings?.filter(m => m.status === 'scheduled').length ?? 0} upcoming` },
                                { l: 'Tasks', v: `${project.tasks?.filter(t => t.status === 'completed').length ?? 0} / ${project.tasks?.length ?? 0} complete` },
                            ].map(({ l, v }) => (
                                <div key={l} className="flex justify-between py-2.5 border-b border-[#e5e7eb] last:border-b-0 text-[13px]">
                                    <span className="text-[#4b5563]">{l}</span>
                                    <span className="text-black">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Modal */}
            {showProgressModal && (
                <Modal title="Update Progress" subtitle={project.name} onClose={() => setShowProgressModal(false)} footer={
                    <><Btn ghost onClick={() => setShowProgressModal(false)}><X size={13} /> Cancel</Btn>
                    <Btn primary onClick={saveProgress} disabled={progressForm.processing}><Save size={13} /> Save</Btn></>
                }>
                    <div className="space-y-5 pb-2">
                        {/* Progress circle + slider */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium">Progress</label>
                                <span className="text-[24px] font-bold text-[#4f6df5]">{progressForm.data.progress}%</span>
                            </div>
                            <div className="relative">
                                <div className="h-3 bg-[#e5e7eb] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-[#4f6df5] to-[#6380f7] transition-all duration-200" style={{ width: `${progressForm.data.progress}%` }} />
                                </div>
                                <input
                                    type="range" min="0" max="100"
                                    value={progressForm.data.progress}
                                    onChange={e => progressForm.setData('progress', e.target.value)}
                                    className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-[#6b7280] mt-1.5 px-0.5">
                                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                            </div>
                        </div>

                        {/* Quick set buttons */}
                        <div>
                            <label className="text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2 block">Quick Set</label>
                            <div className="flex gap-2">
                                {[0, 10, 25, 50, 75, 90, 100].map(v => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => progressForm.setData('progress', v)}
                                        className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                                            Number(progressForm.data.progress) === v
                                                ? 'bg-[#4f6df5] text-white border-[#4f6df5]'
                                                : 'bg-white text-[#4b5563] border-[#d1d5db] hover:border-[#4f6df5] hover:text-[#4f6df5]'
                                        }`}
                                    >
                                        {v}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Phase — selecting auto-sets progress */}
                        <FG label="Current Phase">
                            <div className="grid grid-cols-2 gap-2">
                                {PROJECT_PHASES.map(ph => (
                                    <button
                                        key={ph.name}
                                        type="button"
                                        onClick={() => { progressForm.setData({ ...progressForm.data, phase: ph.name, progress: ph.progress }); }}
                                        className={`px-3 py-2 rounded-lg text-[12px] font-medium border text-left transition-all flex justify-between items-center ${
                                            progressForm.data.phase === ph.name
                                                ? 'bg-[#4f6df5]/10 text-[#4f6df5] border-[#4f6df5]/30'
                                                : 'bg-white text-[#374151] border-[#e5e7eb] hover:border-[#4f6df5]/30 hover:text-[#4f6df5]'
                                        }`}
                                    >
                                        <span>{ph.name}</span>
                                        <span className="text-[10px] opacity-60">{ph.progress}%</span>
                                    </button>
                                ))}
                            </div>
                        </FG>
                    </div>
                </Modal>
            )}

            {/* Edit Project Modal — wide */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-5" onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
                    <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-[900px] flex flex-col max-h-[92vh]">
                        <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
                            <div>
                                <div className="text-[21px] font-bold text-black">Edit Project</div>
                                <div className="text-[12px] text-[#4b5563] mt-1">{project.name}</div>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-[#4b5563] hover:text-black text-[22px] leading-none transition-colors">×</button>
                        </div>
                        <div className="px-6 pb-4 overflow-y-auto flex-1">
                    <div className="space-y-5 pb-2">
                        {/* Section: General */}
                        <div>
                            <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">General <span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <FG label="Project Name *" error={editForm.errors.name}><input className={inputCls} value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} /></FG>
                                <FG label="Client / Company" error={editForm.errors.client}><input className={inputCls} value={editForm.data.client} onChange={e => editForm.setData('client', e.target.value)} /></FG>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <FG label="Status">
                                    <Select value={editForm.data.status} onChange={v => editForm.setData('status', v)} options={[
                                        { value: 'active', label: 'Active' },
                                        { value: 'on-hold', label: 'On Hold' },
                                        { value: 'completed', label: 'Completed' },
                                    ]} />
                                </FG>
                                <FG label="Phase">
                                    <Select value={editForm.data.phase} onChange={v => editForm.setData('phase', v)} options={PROJECT_PHASES.map(ph => ({ value: ph.name, label: ph.name }))} />
                                </FG>
                                <FG label="Project Lead">
                                    <Select value={editForm.data.lead_id} onChange={v => editForm.setData('lead_id', v)} placeholder="No lead assigned" clearable options={(usePage().props.teamMembers ?? []).map(m => ({ value: m.id, label: `${m.name}${m.role ? ` — ${m.role}` : ''}` }))} />
                                </FG>
                            </div>
                        </div>

                        {/* Section: Client Contact */}
                        <div>
                            <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">Client Contact <span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <div className="grid grid-cols-3 gap-3">
                                <FG label="Contact Name"><input className={inputCls} value={editForm.data.contact_name} onChange={e => editForm.setData('contact_name', e.target.value)} /></FG>
                                <FG label="Contact Email"><input className={inputCls} type="email" value={editForm.data.contact_email} onChange={e => editForm.setData('contact_email', e.target.value)} /></FG>
                                <FG label="Contact Phone"><input className={inputCls} value={editForm.data.contact_phone} onChange={e => editForm.setData('contact_phone', e.target.value)} /></FG>
                            </div>
                        </div>

                        {/* Section: Timeline */}
                        <div>
                            <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">Timeline <span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <div className="grid grid-cols-3 gap-3">
                                <FG label="Start Date"><input className={inputCls} type="date" value={editForm.data.start_date} onChange={e => editForm.setData('start_date', e.target.value)} /></FG>
                                <FG label="End Date"><input className={inputCls} type="date" value={editForm.data.end_date} onChange={e => editForm.setData('end_date', e.target.value)} /></FG>
                                <FG label="🚀 Launch Date">
                                    <input className={`${inputCls} border-[#4f6df5]/30 bg-indigo-50/50`} type="date" value={editForm.data.launch_date} onChange={e => editForm.setData('launch_date', e.target.value)} />
                                </FG>
                            </div>
                        </div>

                        {/* Section: Budget & Tax */}
                        <div>
                            <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">Budget & Tax <span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <FG label="Currency">
                                    <Select value={editForm.data.currency} onChange={v => editForm.setData('currency', v)} options={currencies.map(c => ({ value: c.code, label: `${c.code} — ${c.country} (${c.symbol})` }))} />
                                </FG>
                                <FG label="Budget" error={editForm.errors.budget}>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-[#4b5563]">
                                            {(currencies.find(c => c.code === editForm.data.currency) ?? currencies[0]).symbol}
                                        </span>
                                        <input className={`${inputCls} pl-8 text-[16px] font-semibold`} type="number" value={editForm.data.budget} onChange={e => editForm.setData('budget', e.target.value)} placeholder="0.00" />
                                    </div>
                                </FG>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FG label="Tax Type">
                                    <Select value={editForm.data.tax_type} onChange={v => editForm.setData('tax_type', v)} placeholder="No Tax" clearable options={[
                                        { value: 'vat', label: 'VAT (Value Added Tax)' },
                                        { value: 'gst', label: 'GST (Goods & Services Tax)' },
                                        { value: 'sales_tax', label: 'Sales Tax' },
                                        { value: 'withholding', label: 'Withholding Tax' },
                                        { value: 'consumption', label: 'Consumption Tax (Japan)' },
                                        { value: 'custom', label: 'Custom' },
                                    ]} />
                                </FG>
                                <FG label="Tax Rate (%)">
                                    <div className="relative">
                                        <input className={`${inputCls} pr-8`} type="number" step="0.01" min="0" max="100" value={editForm.data.tax_rate} onChange={e => editForm.setData('tax_rate', e.target.value)} placeholder="0" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#6b7280]">%</span>
                                    </div>
                                </FG>
                            </div>
                        </div>

                        {/* Section: Details */}
                        <div>
                            <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">Details <span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <FG label="Description">
                                <textarea className={`${inputCls} resize-y min-h-[100px]`} value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} placeholder="Project overview and goals…" />
                            </FG>
                            <FG label="Tags (comma-separated)" error={editForm.errors.tags}>
                                <input className={inputCls} value={editForm.data.tags} onChange={e => editForm.setData('tags', e.target.value)} placeholder="e.g. Branding, Design, Marketing" />
                            </FG>
                        </div>
                    </div>
                        </div>
                        <div className="flex justify-end gap-2.5 p-6 pt-4 flex-shrink-0 border-t border-[#e5e7eb]">
                            <Btn ghost onClick={() => setShowEditModal(false)}><X size={13} /> Cancel</Btn>
                            <Btn primary onClick={saveEdit} disabled={editForm.processing}><Save size={13} /> Save Changes</Btn>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── TEAM SECTION ─────────────────────────────────────────────────────────────
function TeamSection({ project, canManage }) {
    const confirm = useConfirm();
    const [showAdd, setShowAdd] = useState(false);
    const { props } = usePage();
    const allClients = props.clients ?? [];
    const contractors = allClients.filter(c => c.type === 'contractor' || c.type === 'vendor');
    const teamMembers = props.teamMembers ?? [];
    const members = project.members ?? [];

    const { data, setData, post, processing, reset } = useForm({ client_id: '', team_member_id: '', role: '', notes: '' });

    // Combined picker: internal team members + directory contractors/vendors,
    // excluding anyone already on the team. Value is namespaced ("team:5" /
    // "client:5") so we can route it to the right field.
    const addedClientIds = new Set(members.map(m => m.client_id).filter(Boolean));
    const addedTeamIds   = new Set(members.map(m => m.team_member_id).filter(Boolean));
    const pickerOptions = [
        ...teamMembers.filter(t => !addedTeamIds.has(t.id)).map(t => ({ value: `team:${t.id}`, label: `${t.name}${t.role ? ` (${t.role})` : ' · Team'}` })),
        ...contractors.filter(c => !addedClientIds.has(c.id)).map(c => ({ value: `client:${c.id}`, label: `${c.name} (${c.type})` })),
    ];
    const pickerValue = data.team_member_id ? `team:${data.team_member_id}` : data.client_id ? `client:${data.client_id}` : '';
    const onPick = (v) => {
        const [kind, id] = v ? v.split(':') : ['', ''];
        setData('client_id', kind === 'client' ? id : '');
        setData('team_member_id', kind === 'team' ? id : '');
    };

    const submit = () => {
        post(route('projects.members.store', project.id), { onSuccess: () => { setShowAdd(false); reset(); } });
    };

    const memberName = (m) => m.client?.name ?? m.team_member?.name ?? '?';
    const memberType = (m) => m.client?.type ?? (m.team_member ? 'team' : null);

    const removeMember = async (member) => {
        if (await confirm({ title: `Remove ${memberName(member)}?`, message: 'They will be removed from this project team.', danger: true, confirmLabel: 'Remove' })) {
            router.delete(route('projects.members.destroy', [project.id, member.id]));
        }
    };

    return (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb]">
                <span className="text-[16px] font-bold text-black">Team ({members.length})</span>
                {canManage && (
                    <Btn ghost sm onClick={() => setShowAdd(!showAdd)}>{showAdd ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add</>}</Btn>
                )}
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="px-5 py-4 bg-[#fafbfc] border-b border-[#e5e7eb]">
                    <div className="grid grid-cols-3 gap-3">
                        <FG label="Team Member / Contractor">
                            <Select value={pickerValue} onChange={onPick} placeholder="Select..." clearable options={pickerOptions} />
                        </FG>
                        <FG label="Role in Project">
                            <input className={inputCls} value={data.role} onChange={e => setData('role', e.target.value)} placeholder="e.g. Designer, Developer" />
                        </FG>
                        <div className="flex items-end">
                            <Btn primary sm onClick={submit} disabled={processing || (!data.client_id && !data.team_member_id)}><Plus size={13} /> Add to Team</Btn>
                        </div>
                    </div>
                </div>
            )}

            {members.length === 0 && !showAdd && (
                <div className="px-5 py-6 text-center text-[13px] text-[#4b5563]">No team members added yet</div>
            )}

            {members.length > 0 && (
                <div>
                    {members.map(m => (
                        <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                            <div className="w-8 h-8 rounded-full bg-[#4f6df5]/10 flex items-center justify-center text-[11px] font-bold text-[#4f6df5] flex-shrink-0">
                                {memberName(m).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-black truncate">{memberName(m)}</div>
                                <div className="text-[11px] text-[#4b5563]">
                                    {[m.role, memberType(m)].filter(Boolean).join(' · ')}
                                </div>
                            </div>
                            {canManage && (
                                <button onClick={() => removeMember(m)} className="text-[#6b7280] hover:text-red-500 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── CLIENT ACCESS SECTION ────────────────────────────────────────────────────
function ClientAccessSection({ project, canManage }) {
    const portalUrl = project.portal_code ? `${window.location.origin}/p/${project.portal_code}` : null;
    const [copied, setCopied] = useState(false);

    const togglePortal = () => {
        router.patch(route('projects.portal-toggle', project.id));
    };

    const copyLink = () => {
        navigator.clipboard.writeText(portalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!canManage) return null;

    return (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb]">
                <span className="text-[15px] font-bold text-black">Client Portal</span>
                <button
                    onClick={togglePortal}
                    className={`relative w-10 h-5 rounded-full transition-all ${project.portal_enabled ? 'bg-[#4f6df5]' : 'bg-[#d1d5db]'}`}
                >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${project.portal_enabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
            </div>

            {project.portal_enabled && portalUrl ? (
                <div className="px-5 py-4">
                    <p className="text-[12px] text-[#4b5563] mb-3">Share this private link with your client. No login required — they can view proposals, invoices, and meetings.</p>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value={portalUrl}
                            className="flex-1 bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2 text-[12px] text-black font-mono"
                            onClick={e => e.target.select()}
                        />
                        <Btn ghost sm onClick={copyLink}>
                            {copied ? <><Check size={13} /> Copied</> : 'Copy Link'}
                        </Btn>
                    </div>
                </div>
            ) : (
                <div className="px-5 py-5 text-center text-[13px] text-[#4b5563]">Enable the toggle to generate a private client link</div>
            )}
        </div>
    );
}

// ── PROPOSAL TAB ──────────────────────────────────────────────────────────────
function ProposalTab({ project, canManage, nextNumber, fmt }) {
    const [showModal, setShowModal] = useState(false);
    const [editingProposal, setEditingProposal] = useState(null);
    const proposals = project.proposals ?? [];
    const [selected, setSelected] = useState(proposals[0] ?? null);

    const defaults = {
        title: `${project.client} — Project Proposal`,
        amount: project.budget ?? '',
        date: new Date().toISOString().slice(0, 10),
        valid_until: '',
        sent_date: '',
        signed_date: '',
        content: '',
    };

    const { data, setData, post, put, processing, reset, errors } = useForm(defaults);

    const openCreate = () => {
        setEditingProposal(null);
        reset();
        setShowModal(true);
    };

    const openEdit = (proposal) => {
        setEditingProposal(proposal);
        setData({
            title: proposal.title ?? '',
            amount: proposal.amount ?? '',
            date: proposal.date ? proposal.date.slice(0, 10) : '',
            valid_until: proposal.valid_until ? proposal.valid_until.slice(0, 10) : '',
            sent_date: proposal.sent_date ? proposal.sent_date.slice(0, 10) : '',
            signed_date: proposal.signed_date ? proposal.signed_date.slice(0, 10) : '',
            content: proposal.content ?? '',
        });
        setShowModal(true);
    };

    const submit = () => {
        if (editingProposal) {
            put(route('projects.proposals.update', [project.id, editingProposal.id]), { onSuccess: () => { setShowModal(false); setEditingProposal(null); } });
        } else {
            post(route('projects.proposals.store', project.id), { onSuccess: () => { setShowModal(false); reset(); } });
        }
    };

    const updateStatus = (proposal, status) => {
        router.patch(route('proposals.status', proposal.id), { status });
    };

    const statusCycle = { draft: 'sent', sent: 'approved' };
    const statusColors = { draft: 'border-l-gray-300', sent: 'border-l-indigo-400', approved: 'border-l-emerald-400', rejected: 'border-l-red-400' };

    if (proposals.length === 0 && !showModal) {
        return (
            <div className="text-center py-16 text-[#4b5563]">
                <div className="mb-4 flex justify-center"><div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center"><FileText size={28} className="text-indigo-400" /></div></div>
                <div className="text-[16px] font-semibold text-black mb-1">No proposals yet</div>
                <div className="text-[13px] text-[#4b5563] mb-5">Create your first proposal for this project</div>
                {canManage && <Btn primary onClick={openCreate}><Plus size={15} /> Create Proposal</Btn>}
                {showModal && <ProposalModal nextNumber={nextNumber} isEdit={false} project={project} data={data} setData={setData} processing={processing} errors={errors} onClose={() => { setShowModal(false); setEditingProposal(null); }} onSubmit={submit} />}
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[18px] font-bold text-black">Proposals</h3>
                {canManage && <Btn primary sm onClick={openCreate}><Plus size={13} /> New Proposal</Btn>}
            </div>

            {/* Proposal Cards */}
            <div className="space-y-3">
                {proposals.map(pr => (
                    <div key={pr.id} className={`bg-white border border-[#e5e7eb] ${statusColors[pr.status] ?? ''} border-l-[3px] rounded-xl overflow-hidden`}>
                        {/* Header */}
                        <div className="px-5 py-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <span className="text-[15px] font-bold text-black truncate">{pr.title}</span>
                                        <Badge status={pr.status} />
                                    </div>
                                    <div className="flex items-center gap-3 text-[12px] text-[#4b5563]">
                                        <span>Issued {fmtDate(pr.date)}</span>
                                        {pr.valid_until && <span>· Valid until {fmtDate(pr.valid_until)}</span>}
                                        {pr.sent_date && <span>· Sent {fmtDate(pr.sent_date)}</span>}
                                        {pr.signed_date && <span>· Signed {fmtDate(pr.signed_date)}</span>}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <div className="text-[20px] font-bold text-black">{fmt(pr.amount)}</div>
                                </div>
                            </div>

                            {/* Content preview */}
                            {pr.content && (
                                <div className="text-[12px] text-[#4b5563] line-clamp-2 leading-relaxed mb-3 border-l-2 border-[#e5e7eb] pl-3" dangerouslySetInnerHTML={{ __html: pr.content.replace(/<[^>]*>/g, ' ').slice(0, 200) + '…' }} />
                            )}
                            {!pr.content && pr.summary && (
                                <div className="text-[12px] text-[#4b5563] line-clamp-2 leading-relaxed mb-3 border-l-2 border-[#e5e7eb] pl-3">{pr.summary.slice(0, 200)}…</div>
                            )}

                            {/* Signed file */}
                            {pr.signed_file_path && (
                                <div className="flex items-center gap-2 mb-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    <span className="text-[12px] text-emerald-700 font-medium flex-1">Signed: {pr.signed_file_name}</span>
                                    <a href={`/storage/${pr.signed_file_path}`} target="_blank" className="text-[12px] text-emerald-600 hover:text-emerald-800 font-medium">View</a>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Link href={route('proposals.view', pr.id)}>
                                    <Btn ghost sm><Eye size={13} /> View</Btn>
                                </Link>
                                {canManage && pr.status === 'draft' && (
                                    <Btn ghost sm onClick={() => openEdit(pr)}><Pencil size={13} /> Edit</Btn>
                                )}
                                {canManage && statusCycle[pr.status] && (
                                    <Btn ghost sm onClick={() => updateStatus(pr, statusCycle[pr.status])}>
                                        {pr.status === 'draft' ? <><Send size={13} /> Mark Sent</> : <><Check size={13} /> Mark Approved</>}
                                    </Btn>
                                )}
                                {canManage && pr.status !== 'draft' && (
                                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#374151] border border-[#d1d5db] hover:bg-gray-100 cursor-pointer transition-all">
                                        <Upload size={13} /> {pr.signed_file_path ? 'Replace Signed' : 'Upload Signed'}
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => {
                                            if (!e.target.files[0]) return;
                                            const fd = new FormData(); fd.append('file', e.target.files[0]);
                                            router.post(route('proposals.signed-file', pr.id), fd);
                                        }} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && <ProposalModal nextNumber={nextNumber} isEdit={!!editingProposal} project={project} data={data} setData={setData} processing={processing} errors={errors} onClose={() => { setShowModal(false); setEditingProposal(null); }} onSubmit={submit} />}
        </>
    );
}

function ProposalModal({ nextNumber, isEdit, project, data, setData, processing, errors, onClose, onSubmit }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-5" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-[900px] flex flex-col max-h-[92vh]">
                <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
                    <div>
                        <div className="font-serif text-[21px] font-semibold text-black">{isEdit ? 'Edit Proposal' : 'New Proposal'}</div>
                        <div className="text-[12px] text-[#4b5563] mt-1">For {project.name}{!isEdit && nextNumber ? ` · ${nextNumber}` : ''}</div>
                    </div>
                    <button onClick={onClose} className="text-[#4b5563] hover:text-black text-[22px] leading-none transition-colors">×</button>
                </div>
                <div className="px-6 pb-2 overflow-y-auto flex-1">
            <div className="space-y-4 pb-2">
                {/* Proposal Number */}
                {!isEdit && nextNumber && (
                    <FG label="Proposal #"><input className={`${inputCls} bg-[#f3f4f6] text-[#4b5563] font-mono font-semibold cursor-default`} value={nextNumber} readOnly /></FG>
                )}
                <FG label="Proposal Title" error={errors.title}><input className={inputCls} value={data.title} onChange={e => setData('title', e.target.value)} placeholder="e.g. Website Redesign Proposal" /></FG>
                <div className="grid grid-cols-2 gap-3">
                    <FG label="Amount" error={errors.amount}><input className={inputCls} type="number" value={data.amount} onChange={e => setData('amount', e.target.value)} placeholder="0" /></FG>
                    <FG label="Proposal Date"><input className={inputCls} type="date" value={data.date} onChange={e => setData('date', e.target.value)} /></FG>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <FG label="Valid Until"><input className={inputCls} type="date" value={data.valid_until} onChange={e => setData('valid_until', e.target.value)} /></FG>
                    <FG label="Sent Date"><input className={inputCls} type="date" value={data.sent_date} onChange={e => setData('sent_date', e.target.value)} /></FG>
                    <FG label="Signed Date"><input className={inputCls} type="date" value={data.signed_date} onChange={e => setData('signed_date', e.target.value)} /></FG>
                </div>

                <div className="pt-2">
                    <div className="text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-3 flex items-center gap-3">
                        Proposal Content <span className="flex-1 h-px bg-[#e5e7eb]" />
                    </div>
                    <Suspense fallback={<div className="text-[13px] text-[#4b5563] p-4">Loading editor…</div>}>
                        <RichEditor content={data.content} onChange={val => setData('content', val)} placeholder="Write your proposal — use headings for sections, lists for scope/deliverables, tables for timelines…" projectId={project.id} />
                    </Suspense>
                </div>
            </div>
                </div>
                <div className="flex justify-end gap-2.5 p-6 pt-4 flex-shrink-0 border-t border-[#e5e7eb]">
                    <Btn ghost onClick={onClose}><X size={13} /> Cancel</Btn>
                    <Btn primary onClick={onSubmit} disabled={processing}>
                        {processing ? 'Saving…' : isEdit ? <><Save size={13} /> Update Proposal</> : <><Plus size={13} /> Create Proposal</>}
                    </Btn>
                </div>
            </div>
        </div>
    );
}


// ── INVOICES TAB ──────────────────────────────────────────────────────────────
function InvoicesTab({ project, canManage, nextNumber, paymentDefaults = {}, fmt }) {
    const [showModal, setShowModal] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [paymentModal, setPaymentModal] = useState(null); // invoice object or null
    const [editModal, setEditModal] = useState(null); // invoice object or null
    const invoices = project.invoices ?? [];

    const totalBilled   = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
    const totalPaid     = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total ?? 0), 0);
    const outstanding   = invoices.filter(i => ['sent','overdue'].includes(i.status)).reduce((s, i) => s + (i.total ?? 0), 0);

    const statusCycle = { draft: 'sent', sent: 'paid' };
    const confirm = useConfirm();

    const updateStatus = (inv, status) => router.patch(route('invoices.status', inv.id), { status });

    const deleteInvoice = async (inv) => {
        if (await confirm({ title: `Delete ${inv.number}?`, message: 'This invoice and its line items will be permanently removed.', danger: true, confirmLabel: 'Delete' })) {
            router.delete(route('projects.invoices.destroy', [project.id, inv.id]));
        }
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        number: nextNumber ?? '', date: new Date().toISOString().slice(0, 10), due_date: '', description: '',
        payment_stage: '', payment_notes: '',
        bank_name: paymentDefaults.bank_name ?? '',
        bank_account_name: paymentDefaults.bank_account_name ?? '',
        bank_account_number: paymentDefaults.bank_account_number ?? '',
        cheque_payable_to: paymentDefaults.cheque_payable_to ?? '',
        notes: '',
        items: [{ description: '', quantity: 1, rate: '' }],
    });

    const addItem    = () => setData('items', [...data.items, { description: '', quantity: 1, rate: '' }]);
    const removeItem = (i) => setData('items', data.items.filter((_, j) => j !== i));
    const updateItem = (i, k, v) => { const it = [...data.items]; it[i] = { ...it[i], [k]: v }; setData('items', it); };
    const total      = data.items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseInt(i.quantity) || 1), 0);
    const submit     = () => post(route('projects.invoices.store', project.id), { onSuccess: () => { setShowModal(false); reset(); } });

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Invoices</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}><Plus size={13} /> New Invoice</Btn>}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {[
                    { l: 'Total Billed', v: fmt(totalBilled), icon: <Receipt size={16} />, bg: 'bg-indigo-50 border-indigo-100', iconC: 'text-indigo-500', textC: 'text-indigo-700' },
                    { l: 'Paid', v: fmt(totalPaid), icon: <Check size={16} />, bg: 'bg-emerald-50 border-emerald-100', iconC: 'text-emerald-500', textC: 'text-emerald-700' },
                    { l: 'Outstanding', v: fmt(outstanding), icon: <Clock size={16} />, bg: outstanding > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100', iconC: outstanding > 0 ? 'text-amber-500' : 'text-gray-600', textC: outstanding > 0 ? 'text-amber-700' : 'text-gray-600' },
                ].map(({ l, v, icon, bg, iconC, textC }) => (
                    <div key={l} className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
                        <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center ${iconC} shadow-sm`}>{icon}</div>
                        <div>
                            <div className="text-[10px] tracking-[1.5px] uppercase text-[#4b5563] font-medium">{l}</div>
                            <div className={`text-[20px] font-bold ${textC} leading-tight`}>{v}</div>
                        </div>
                    </div>
                ))}
            </div>

            {invoices.length === 0 && <div className="text-center py-14 text-[#4b5563]"><div className="mb-3 opacity-30 flex justify-center"><Receipt size={40} /></div><div className="text-[14px] mb-5">No invoices yet</div>{canManage && <Btn primary onClick={() => setShowModal(true)}><Plus size={15} /> Create First Invoice</Btn>}</div>}

            {/* Invoice List */}
            <div className="space-y-3">
                {invoices.map(inv => {
                    const statusColors = {
                        draft: 'border-l-gray-300',
                        sent: 'border-l-indigo-400',
                        paid: 'border-l-emerald-400',
                        overdue: 'border-l-red-400',
                    };
                    return (
                        <div key={inv.id} className={`bg-white border border-[#e5e7eb] ${statusColors[inv.status] ?? ''} border-l-[3px] rounded-xl overflow-hidden`}>
                            <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#fafbfc] transition-colors" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 mb-0.5">
                                        <span className="text-[13px] font-mono font-bold text-black">{inv.number}</span>
                                        <Badge status={inv.status} />
                                    </div>
                                    <div className="text-[12px] text-[#4b5563] truncate">{inv.description || 'No description'}</div>
                                </div>
                                <div className="text-right mr-2 flex-shrink-0">
                                    <div className="text-[17px] font-bold text-black">{fmt(inv.total)}</div>
                                    <div className="text-[11px] text-[#6b7280]">{inv.status === 'paid' ? `Paid ${fmtDate(inv.date)}` : inv.due_date ? `Due ${fmtDate(inv.due_date)}` : fmtDate(inv.date)}</div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Link href={route('invoices.view', inv.id)} onClick={e => e.stopPropagation()}>
                                        <Btn ghost sm><Eye size={13} /></Btn>
                                    </Link>
                                    {canManage && inv.status === 'draft' && (
                                        <Btn ghost sm onClick={e => { e.stopPropagation(); setEditModal(inv); }}>
                                            <Pencil size={13} />
                                        </Btn>
                                    )}
                                    {canManage && inv.status === 'draft' && (
                                        <Btn ghost sm title="Mark as sent (status only — does not email)" onClick={e => { e.stopPropagation(); updateStatus(inv, 'sent'); }}>
                                            <Send size={13} /> Mark Sent
                                        </Btn>
                                    )}
                                    {canManage && (inv.status === 'draft' || inv.status === 'sent' || (inv.status === 'paid' && !inv.received_amount)) && (
                                        <Btn ghost sm onClick={e => { e.stopPropagation(); setPaymentModal(inv); }}>
                                            <Check size={13} /> {inv.status === 'paid' ? 'Record Payment' : 'Paid'}
                                        </Btn>
                                    )}
                                    {inv.received_amount && (
                                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium cursor-pointer" onClick={e => { e.stopPropagation(); setPaymentModal(inv); }}>
                                            Received {inv.received_currency} {Number(inv.received_amount).toLocaleString()}
                                        </span>
                                    )}
                                    {canManage && inv.status !== 'draft' && (
                                        <label className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-[#4b5563] border border-[#d1d5db] hover:bg-gray-100 cursor-pointer transition-all" onClick={e => e.stopPropagation()}>
                                            <Upload size={12} /> {inv.signed_file_path ? 'Signed ✓' : 'Upload'}
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => {
                                                if (!e.target.files[0]) return;
                                                const fd = new FormData(); fd.append('file', e.target.files[0]);
                                                router.post(route('invoices.signed-file', inv.id), fd);
                                            }} />
                                        </label>
                                    )}
                                    {canManage && (
                                        <button onClick={e => { e.stopPropagation(); deleteInvoice(inv); }} className="text-[#6b7280] hover:text-red-500 transition-colors p-1.5" title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <span className="text-[#6b7280]">{expanded === inv.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                                </div>
                            </div>
                            {expanded === inv.id && (
                                <div className="px-5 py-4 bg-[#fafbfc] border-t border-[#f0f0f0]">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#e5e7eb]">
                                                <th className="text-left text-[10px] tracking-wide uppercase text-[#6b7280] font-medium pb-2">Description</th>
                                                <th className="text-center text-[10px] tracking-wide uppercase text-[#6b7280] font-medium pb-2 w-16">Qty</th>
                                                <th className="text-right text-[10px] tracking-wide uppercase text-[#6b7280] font-medium pb-2 w-24">Rate</th>
                                                <th className="text-right text-[10px] tracking-wide uppercase text-[#6b7280] font-medium pb-2 w-24">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(inv.items ?? []).map((item, i) => (
                                                <tr key={i} className="border-b border-[#f0f0f0] last:border-b-0">
                                                    <td className="py-2.5 text-[13px] text-black">{item.description}</td>
                                                    <td className="py-2.5 text-[13px] text-center text-[#4b5563]">{item.quantity}</td>
                                                    <td className="py-2.5 text-[13px] text-right text-[#4b5563]">{fmt(item.rate)}</td>
                                                    <td className="py-2.5 text-[13px] text-right font-medium text-black">{fmt(item.quantity * item.rate)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="flex justify-end pt-3 mt-2 border-t border-[#e5e7eb]">
                                        <div className="flex items-center gap-6 text-[13px]">
                                            <span className="text-[#6b7280] uppercase tracking-wide text-[10px] font-medium">Total</span>
                                            <span className="text-[16px] font-bold text-black">{fmt(inv.total)}</span>
                                        </div>
                                    </div>
                                    {inv.signed_file_path && (
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#e5e7eb]">
                                            <CheckCircle size={14} className="text-emerald-500" />
                                            <span className="text-[12px] text-emerald-700 font-medium flex-1">Signed: {inv.signed_file_name}</span>
                                            <a href={`/storage/${inv.signed_file_path}`} target="_blank" className="text-[12px] text-emerald-600 hover:text-emerald-800 font-medium">View File</a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Create Invoice Modal */}
            {showModal && (
                <Modal title="New Invoice" subtitle={`For ${project.name}`} large onClose={() => setShowModal(false)} footer={<><Btn ghost onClick={() => setShowModal(false)}>Cancel</Btn><Btn primary onClick={submit} disabled={processing}>{processing ? 'Creating…' : 'Create Invoice'}</Btn></>}>
                    <div className="space-y-4 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Invoice #" error={errors.number}><input className={`${inputCls} font-mono font-semibold`} value={data.number} onChange={e => setData('number', e.target.value)} /></FG>
                            <FG label="Description"><input className={inputCls} value={data.description} onChange={e => setData('description', e.target.value)} placeholder="e.g. Initial retainer — 40%" /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Invoice Date"><input className={inputCls} type="date" value={data.date} onChange={e => setData('date', e.target.value)} /></FG>
                            <FG label="Due Date"><input className={inputCls} type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} /></FG>
                        </div>
                        <FG label="Payment Stage"><input className={inputCls} value={data.payment_stage} onChange={e => setData('payment_stage', e.target.value)} placeholder="e.g. Phase III Completion Fee (30% of total project cost)" /></FG>
                        <div className="pt-2">
                            <div className="text-[10px] tracking-[2px] uppercase text-[#4b5563] mb-3 flex items-center gap-3">Line Items<span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <div className="grid grid-cols-[1fr_70px_90px_28px] gap-2 text-[10px] uppercase tracking-wide text-[#4b5563] mb-2 px-0.5">
                                <span>Description</span><span>Qty</span><span>Rate</span><span />
                            </div>
                            {data.items.map((item, i) => (
                                <div key={i} className="grid grid-cols-[1fr_70px_90px_28px] gap-2 mb-2">
                                    <input className={inputCls} style={{fontSize:12}} value={item.description} onChange={e => updateItem(i,'description',e.target.value)} placeholder="Item description" />
                                    <input className={inputCls} style={{fontSize:12}} type="number" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} min="1" />
                                    <input className={inputCls} style={{fontSize:12}} type="number" value={item.rate} onChange={e => updateItem(i,'rate',e.target.value)} placeholder="0" />
                                    <button onClick={() => removeItem(i)} className="text-[#4b5563] hover:text-red-400 text-[18px] pb-0.5">×</button>
                                </div>
                            ))}
                            <div className="flex justify-between items-center mt-3">
                                <Btn ghost sm onClick={addItem}>+ Add Line Item</Btn>
                                <div className="flex gap-8 text-[13.5px]"><span className="text-[#4b5563]">Total</span><span className="font-semibold text-black">{fmt(total)}</span></div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="text-[10px] tracking-[2px] uppercase text-[#4b5563] mb-3 flex items-center gap-3">Payment Instructions<span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <FG label="Intro Text"><input className={inputCls} value={data.payment_notes} onChange={e => setData('payment_notes', e.target.value)} placeholder="e.g. You may settle this invoice through a Bank Deposit or a Cheque." /></FG>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <FG label="Bank Name"><input className={inputCls} value={data.bank_name} onChange={e => setData('bank_name', e.target.value)} placeholder="e.g. RCBC" /></FG>
                                <FG label="Account Number"><input className={inputCls} value={data.bank_account_number} onChange={e => setData('bank_account_number', e.target.value)} placeholder="0000000000" /></FG>
                                <FG label="Account Name"><input className={inputCls} value={data.bank_account_name} onChange={e => setData('bank_account_name', e.target.value)} placeholder="Account holder name" /></FG>
                                <FG label="Cheque Payable To"><input className={inputCls} value={data.cheque_payable_to} onChange={e => setData('cheque_payable_to', e.target.value)} placeholder="Payee name" /></FG>
                            </div>
                            <p className="text-[11px] text-[#6b7280] mt-1.5">Pre-filled from Company Settings. Edit here to override for this invoice.</p>
                        </div>

                        <FG label="Notes"><textarea className={inputCls} rows={3} value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="One note per line — shown as a numbered list on the invoice." /></FG>
                    </div>
                </Modal>
            )}

            {/* Edit Invoice Modal */}
            {editModal && <EditInvoiceModal invoice={editModal} project={project} fmt={fmt} onClose={() => setEditModal(null)} />}

            {/* Record Payment Modal */}
            {paymentModal && <PaymentModal invoice={paymentModal} fmt={fmt} projectCurrency={project.currency} onClose={() => setPaymentModal(null)} />}
        </>
    );
}

function EditInvoiceModal({ invoice, project, fmt, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        due_date: invoice.due_date ? invoice.due_date.slice(0, 10) : '',
        description: invoice.description ?? '',
        items: (invoice.items?.length ? invoice.items : [{ description: '', quantity: 1, rate: '' }])
            .map(i => ({ description: i.description, quantity: i.quantity, rate: i.rate })),
    });

    const addItem    = () => setData('items', [...data.items, { description: '', quantity: 1, rate: '' }]);
    const removeItem = (i) => setData('items', data.items.filter((_, j) => j !== i));
    const updateItem = (i, k, v) => { const it = [...data.items]; it[i] = { ...it[i], [k]: v }; setData('items', it); };
    const total      = data.items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseInt(i.quantity) || 1), 0);
    const submit     = () => put(route('projects.invoices.update', [project.id, invoice.id]), { onSuccess: onClose });

    return (
        <Modal title="Edit Invoice" subtitle={invoice.number} large onClose={onClose} footer={<><Btn ghost onClick={onClose}>Cancel</Btn><Btn primary onClick={submit} disabled={processing}>{processing ? 'Saving…' : 'Save Changes'}</Btn></>}>
            <div className="space-y-4 pb-2">
                <div className="grid grid-cols-2 gap-3">
                    <FG label="Invoice #"><input className={`${inputCls} font-mono font-semibold bg-gray-50 text-[#6b7280]`} value={invoice.number} disabled /></FG>
                    <FG label="Description" error={errors.description}><input className={inputCls} value={data.description} onChange={e => setData('description', e.target.value)} placeholder="e.g. Initial retainer — 40%" /></FG>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <FG label="Due Date" error={errors.due_date}><input className={inputCls} type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} /></FG>
                </div>
                <div className="pt-2">
                    <div className="text-[10px] tracking-[2px] uppercase text-[#4b5563] mb-3 flex items-center gap-3">Line Items<span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                    <div className="grid grid-cols-[1fr_70px_90px_28px] gap-2 text-[10px] uppercase tracking-wide text-[#4b5563] mb-2 px-0.5">
                        <span>Description</span><span>Qty</span><span>Rate</span><span />
                    </div>
                    {data.items.map((item, i) => (
                        <div key={i} className="grid grid-cols-[1fr_70px_90px_28px] gap-2 mb-2">
                            <input className={inputCls} style={{fontSize:12}} value={item.description} onChange={e => updateItem(i,'description',e.target.value)} placeholder="Item description" />
                            <input className={inputCls} style={{fontSize:12}} type="number" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} min="1" />
                            <input className={inputCls} style={{fontSize:12}} type="number" value={item.rate} onChange={e => updateItem(i,'rate',e.target.value)} placeholder="0" />
                            <button onClick={() => removeItem(i)} className="text-[#4b5563] hover:text-red-400 text-[18px] pb-0.5">×</button>
                        </div>
                    ))}
                    <div className="flex justify-between items-center mt-3">
                        <Btn ghost sm onClick={addItem}>+ Add Line Item</Btn>
                        <div className="flex gap-8 text-[13.5px]"><span className="text-[#4b5563]">Total</span><span className="font-semibold text-black">{fmt(total)}</span></div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

function PaymentModal({ invoice, fmt, projectCurrency, onClose }) {
    const invoiceCur = invoice.currency ?? projectCurrency ?? 'USD';
    const currencyOptions = [
        { code: 'USD', symbol: '$',  label: 'US Dollar' },
        { code: 'PHP', symbol: '₱',  label: 'Philippine Peso' },
        { code: 'JPY', symbol: '¥',  label: 'Japanese Yen' },
        { code: 'EUR', symbol: '€',  label: 'Euro' },
        { code: 'GBP', symbol: '£',  label: 'British Pound' },
        { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
        { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
        { code: 'THB', symbol: '฿',  label: 'Thai Baht' },
        { code: 'VND', symbol: '₫',  label: 'Vietnamese Dong' },
        { code: 'IDR', symbol: 'Rp', label: 'Indonesian Rupiah' },
        { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit' },
    ];

    const [data, setDataRaw] = useState({
        received_currency: invoice.received_currency ?? 'PHP',
        exchange_rate: invoice.exchange_rate ?? '',
        received_amount: invoice.received_amount ?? '',
        received_date: invoice.received_date ? invoice.received_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        received_notes: invoice.received_notes ?? '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const setData = (key, val) => setDataRaw(prev => ({ ...prev, [key]: val }));

    const recCur = currencyOptions.find(c => c.code === data.received_currency) ?? currencyOptions[0];

    const submit = () => {
        const rate = data.received_amount && invoice.total
            ? (parseFloat(data.received_amount) / parseFloat(invoice.total)).toFixed(6)
            : '1';
        setProcessing(true);
        router.patch(route('invoices.payment', invoice.id), {
            ...data,
            exchange_rate: data.exchange_rate || rate,
        }, {
            onSuccess: () => { setProcessing(false); onClose(); },
            onError: (err) => { setProcessing(false); setErrors(err); },
        });
    };

    return (
        <Modal title="Record Payment Received" subtitle={invoice.number} onClose={onClose} footer={
            <><Btn ghost onClick={onClose}><X size={13} /> Cancel</Btn>
            <Btn primary onClick={submit} disabled={processing || !data.received_amount}><Check size={13} /> Record Payment</Btn></>
        }>
            <div className="space-y-4 pb-2">
                {/* What was billed */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wide text-indigo-400 font-medium mb-0.5">Billed to Client</div>
                    <div className="text-[20px] font-bold text-indigo-700">{fmt(invoice.total)} <span className="text-[13px] font-normal">{invoiceCur}</span></div>
                </div>

                {/* What you received */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <div className="text-[10px] uppercase tracking-wide text-emerald-500 font-medium mb-3">What Landed in Your Account</div>

                    <FG label="Currency" error={errors.received_currency}>
                        <Select value={data.received_currency} onChange={v => setData('received_currency', v)} options={currencyOptions.map(c => ({ value: c.code, label: `${c.label} (${c.symbol})` }))} />
                    </FG>

                    <div className="mt-3">
                        <FG label="Amount Received" error={errors.received_amount}>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-emerald-600">{recCur.symbol}</span>
                                <input
                                    className={`${inputCls} pl-10 text-[20px] font-bold`}
                                    type="number"
                                    step="0.01"
                                    value={data.received_amount}
                                    onChange={e => setData('received_amount', e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </FG>
                    </div>

                    {/* Show implied rate if different currency */}
                    {data.received_amount && data.received_currency !== invoiceCur && (
                        <div className="mt-3 text-[12px] text-emerald-600 bg-white/60 rounded-lg px-3 py-2">
                            Client's rate: <strong>1 {invoiceCur} ≈ {(parseFloat(data.received_amount) / parseFloat(invoice.total)).toFixed(2)} {data.received_currency}</strong>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <FG label="Date Received">
                        <input className={inputCls} type="date" value={data.received_date} onChange={e => setData('received_date', e.target.value)} />
                    </FG>
                    <FG label="Reference / Notes">
                        <input className={inputCls} value={data.received_notes} onChange={e => setData('received_notes', e.target.value)} placeholder="e.g. bank transfer ref #" />
                    </FG>
                </div>
            </div>
        </Modal>
    );
}

// ── MEETINGS TAB ──────────────────────────────────────────────────────────────
function MeetingsTab({ project, canManage }) {
    const [showModal, setShowModal] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [filter, setFilter] = useState('all');
    const [kickoffNotes, setKickoffNotes] = useState(null);
    const meetings = project.meetings ?? [];
    const filtered = filter === 'all' ? meetings : meetings.filter(m => m.status === filter);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        type: 'kickoff', title: 'Project Kickoff Meeting', date: '', time: '', duration: '1 hr', location: '', attendees: '', notes: '',
    });

    const openEdit = (m) => {
        setEditingMeeting(m);
        setKickoffNotes(null);
        setData({
            type: m.type ?? 'other',
            title: m.title ?? '',
            date: m.date ? m.date.slice(0, 10) : '',
            time: m.time ?? '',
            duration: m.duration ?? '',
            location: m.location ?? '',
            attendees: (m.attendees ?? []).join(', '),
            notes: m.notes ?? '',
        });
        setShowModal(true);
    };

    const typeToTitle = { kickoff:'Project Kickoff Meeting', review:'Project Review', checkin:'Monthly Check-in', presentation:'Client Presentation', discovery:'Discovery Session', other:'Meeting' };
    const submit = () => {
        const payload = kickoffNotes ? {
            ...data,
            type: 'kickoff',
            title: `Project Kickoff — ${project.name}`,
            duration: data.duration || '1 hr',
            notes: kickoffNotes,
        } : data;

        if (editingMeeting) {
            router.put(route('projects.meetings.update', [project.id, editingMeeting.id]), payload, {
                onSuccess: () => { setShowModal(false); reset(); setEditingMeeting(null); },
            });
        } else {
            router.post(route('projects.meetings.store', project.id), payload, {
                onSuccess: () => { setShowModal(false); reset(); setKickoffNotes(null); },
            });
        }
    };
    const updateStatus = (m, status) => router.patch(route('meetings.status', m.id), { status });

    const generateKickoffAgenda = () => {
        const proposal = (project.proposals ?? []).find(p => p.status === 'approved') ?? (project.proposals ?? [])[0];
        const lines = [
            `KICKOFF MEETING AGENDA — ${project.name}`,
            `Client: ${project.client}`,
            '',
            '1. Introductions & Roles',
            '   - Team introductions',
            '   - Key contacts and responsibilities',
            '',
            '2. Project Overview',
            `   - Project scope and objectives`,
            proposal?.summary ? `   - ${proposal.summary.slice(0, 150)}` : '',
            '',
            '3. Timeline & Milestones',
            `   - Start: ${project.start_date ? fmtDate(project.start_date) : 'TBD'}`,
            `   - End: ${project.end_date ? fmtDate(project.end_date) : 'TBD'}`,
            `   - Current phase: ${project.phase}`,
            '',
            '4. Budget & Payment Terms',
            `   - Total budget: ${fmt(project.budget)}`,
            proposal ? '   - Review payment schedule from proposal' : '',
            '',
            '5. Communication Plan',
            '   - Preferred communication channels',
            '   - Meeting frequency and format',
            '   - Response time expectations',
            '',
            '6. Tools & Access',
            '   - Project management tools',
            '   - File sharing and documentation',
            '   - Access credentials needed',
            '',
            '7. Deliverables & Approval Process',
            '   - Review key deliverables',
            '   - Revision and approval workflow',
            '   - Acceptance criteria',
            '',
            '8. Risks & Dependencies',
            '   - Known risks and mitigation',
            '   - Client dependencies (content, assets, approvals)',
            '',
            '9. Next Steps & Action Items',
            '   - Immediate action items',
            '   - Next meeting date',
            '',
            '10. Q&A',
        ].filter(Boolean).join('\n');

        reset();
        setKickoffNotes(lines);
        setShowModal(true);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Meetings</h3>
                {canManage && (
                    <div className="flex gap-2">
                        <Btn ghost sm onClick={generateKickoffAgenda}><FileText size={13} /> Kickoff Agenda</Btn>
                        <Btn primary sm onClick={() => setShowModal(true)}><Plus size={13} /> Schedule Meeting</Btn>
                    </div>
                )}
            </div>
            <div className="flex gap-2 mb-5">
                {['all','scheduled','completed','cancelled'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all capitalize ${filter === s ? 'bg-[#4f6df5]/10 border-[#4f6df5]/30 text-[#4f6df5]' : 'border-[#d1d5db] text-[#374151] hover:text-black hover:bg-gray-100'}`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && <div className="text-center py-14 text-[#4b5563]"><div className="mb-3 opacity-30 flex justify-center"><CalendarDays size={40} /></div><div className="text-[14px] mb-5">No meetings scheduled</div>{canManage && <Btn primary onClick={() => setShowModal(true)}><Plus size={15} /> Schedule a Meeting</Btn>}</div>}

            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                {[...filtered].sort((a,b) => b.date.localeCompare(a.date)).map(m => {
                    const { day, mon } = parseDay(m.date);
                    return (
                        <div key={m.id} className="px-5 py-4 border-b border-[#e5e7eb] last:border-b-0">
                            <div className="flex gap-3.5 items-start">
                                <div className="w-11 h-11 bg-[#4f6df5]/10 border border-[#4f6df5]/15 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                                    <div className="text-[16px] font-bold text-[#4f6df5] leading-none">{day}</div>
                                    <div className="text-[9px] text-[#4f6df5] tracking-wide uppercase">{mon}</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-[14px] font-medium text-black">{m.title}</span>
                                        <Badge status={m.status} />
                                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-[#374151]">{MTG_TYPES[m.type]}</span>
                                    </div>
                                    <div className="text-[12.5px] text-[#4b5563] mb-2">{m.time} · {m.duration} · {m.location}</div>
                                    {(m.attendees ?? []).length > 0 && <div className="text-[12px] text-[#4b5563]">👥 {m.attendees.join(', ')}</div>}
                                    {m.notes && <div className="mt-3 px-3 py-2.5 bg-[#f3f4f6] rounded-lg text-[12.5px] text-[#374151] leading-relaxed border-l-2 border-[#d1d5db]">{m.notes}</div>}
                                </div>
                                {canManage && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Btn ghost sm onClick={() => openEdit(m)}><Pencil size={13} /></Btn>
                                        {m.status === 'scheduled' && (
                                            <>
                                                <Btn ghost sm onClick={() => updateStatus(m, 'completed')}><CheckCircle size={13} /> Complete</Btn>
                                                <Btn danger sm onClick={() => updateStatus(m, 'cancelled')}><XCircle size={13} /> Cancel</Btn>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <Modal title={editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'} subtitle={`For ${project.name}`} onClose={() => { setShowModal(false); setEditingMeeting(null); setKickoffNotes(null); }} footer={<><Btn ghost onClick={() => { setShowModal(false); setEditingMeeting(null); }}><X size={13} /> Cancel</Btn><Btn primary onClick={submit} disabled={processing}><Save size={13} /> {processing ? 'Saving…' : editingMeeting ? 'Update' : 'Schedule'}</Btn></>}>
                    <div className="space-y-4 pb-2">
                        {kickoffNotes && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2.5 text-[12px] text-indigo-600">
                                Kickoff agenda has been pre-filled. Set the date, time, and location, then schedule.
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Meeting Type">
                                <Select value={kickoffNotes ? 'kickoff' : data.type} onChange={v => setData('type', v)} options={Object.entries(MTG_TYPES).map(([v, l]) => ({ value: v, label: l }))} />
                            </FG>
                            <FG label="Title"><input className={inputCls} value={kickoffNotes ? `Project Kickoff — ${project.name}` : data.title} onChange={e => setData('title', e.target.value)} /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Date *" error={errors.date}><input className={inputCls} type="date" value={data.date} onChange={e => setData('date', e.target.value)} autoFocus /></FG>
                            <FG label="Time"><input className={inputCls} value={data.time} onChange={e => setData('time', e.target.value)} placeholder="e.g. 10:00 AM" /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Duration"><input className={inputCls} value={kickoffNotes ? '1 hr' : data.duration} onChange={e => setData('duration', e.target.value)} placeholder="e.g. 1 hr" /></FG>
                            <FG label="Location"><input className={inputCls} value={data.location} onChange={e => setData('location', e.target.value)} placeholder="Zoom, Office…" /></FG>
                        </div>
                        <FG label="Attendees (comma-separated)"><input className={inputCls} value={data.attendees} onChange={e => setData('attendees', e.target.value)} placeholder="Sarah Chen, Alex Rivera…" /></FG>
                        <FG label="Agenda / Notes"><textarea className={`${inputCls} resize-y min-h-[200px]`} value={kickoffNotes ?? data.notes} onChange={e => { if (kickoffNotes) setKickoffNotes(e.target.value); else setData('notes', e.target.value); }} placeholder="Meeting agenda…" /></FG>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ── DOCUMENT PREVIEW ──────────────────────────────────────────────────────────
const PREVIEWABLE_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const getFileExt = (name) => (name ?? '').split('.').pop().toLowerCase();
const docExt = (doc) => getFileExt(doc.file_path) || getFileExt(doc.name);
const isPreviewable = (doc) => doc.file_path && PREVIEWABLE_EXT.includes(docExt(doc));
const isImage = (doc) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(docExt(doc));

function DocPreviewModal({ doc, onClose }) {
    const [fullscreen, setFullscreen] = useState(false);
    if (!doc) return null;
    const previewUrl = `/documents/${doc.id}/preview`;
    const canPreview = isPreviewable(doc);

    if (fullscreen && canPreview) {
        return (
            <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 bg-black/90">
                    <div className="text-white text-[13px] font-medium truncate mr-4">{doc.name}</div>
                    <div className="flex items-center gap-2">
                        <a href={`/documents/${doc.id}/download`} className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"><Download size={13} /> Download</a>
                        <button onClick={() => setFullscreen(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Exit fullscreen"><Minimize2 size={16} /></button>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center overflow-auto">
                    {isImage(doc) ? (
                        <img src={previewUrl} alt={doc.name} className="max-w-full max-h-full object-contain" />
                    ) : (
                        <iframe src={previewUrl} className="w-full h-full" title={doc.name} />
                    )}
                </div>
            </div>
        );
    }

    return (
        <Modal large title={doc.name} subtitle={`${doc.type?.charAt(0).toUpperCase() + doc.type?.slice(1)} · ${doc.file_size ?? ''}`} onClose={onClose} footer={
            <>
                <Btn ghost onClick={onClose}><X size={13} /> Close</Btn>
                <a href={`/documents/${doc.id}/download`} className="inline-flex items-center gap-1.5 rounded-lg font-medium transition-all px-4 py-2.5 text-[13px] bg-[#4f6df5] hover:bg-[#6380f7] text-white"><Download size={13} /> Download</a>
            </>
        }>
            {canPreview ? (
                <div className="relative">
                    <button onClick={() => setFullscreen(true)} className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors" title="Fullscreen"><Maximize2 size={15} /></button>
                    <div className="flex items-center justify-center bg-[#f3f4f6] rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                        {isImage(doc) ? (
                            <img src={previewUrl} alt={doc.name} className="max-w-full max-h-[70vh] object-contain" />
                        ) : (
                            <iframe src={previewUrl} className="w-full rounded-lg" style={{ height: '70vh' }} title={doc.name} />
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 text-[#4b5563]">
                    <div className="mb-4 flex justify-center"><div className="w-16 h-16 rounded-2xl bg-[#f3f4f6] flex items-center justify-center text-3xl">{DOC_ICONS[doc.type] ?? '📁'}</div></div>
                    <div className="text-[14px] font-medium text-black mb-1">Preview not available</div>
                    <div className="text-[13px] mb-4">This file type cannot be previewed in the browser. Download it to view.</div>
                </div>
            )}
        </Modal>
    );
}

// ── DOCUMENTS TAB ─────────────────────────────────────────────────────────────
function DocumentsTab({ project, canManage }) {
    const confirm = useConfirm();
    const [showModal, setShowModal] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [editDoc, setEditDoc] = useState(null);
    const [filter, setFilter] = useState('all');
    const documents = project.documents ?? [];
    const filtered = filter === 'all' ? documents : documents.filter(d => d.type === filter);

    const { data, setData, post, processing, reset } = useForm({ name: '', type: 'contract', file: null });
    const submit = () => { post(route('projects.documents.store', project.id), { forceFormData: true, onSuccess: () => { setShowModal(false); reset(); } }); };

    const editForm = useForm({ name: '', type: 'other', file: null });
    const openEditDoc = (doc) => {
        editForm.setData({ name: doc.name, type: doc.type, file: null });
        setEditDoc(doc);
    };
    const submitEditDoc = () => {
        editForm.transform(data => ({ ...data, _method: 'PUT' }));
        editForm.post(route('projects.documents.update', [project.id, editDoc.id]), {
            forceFormData: true,
            onSuccess: () => { setEditDoc(null); editForm.reset(); },
        });
    };
    const deleteDoc = async (doc) => {
        if (await confirm({ title: 'Delete this document?', message: 'This file will be permanently removed.', danger: true })) {
            router.delete(route('projects.documents.destroy', [project.id, doc.id]));
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Documents</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}><Upload size={13} /> Add Document</Btn>}
            </div>
            <div className="flex gap-2 mb-5">
                {['all','contract','brief','report','asset','other'].map(t => (
                    <button key={t} onClick={() => setFilter(t)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all capitalize ${filter === t ? 'bg-[#4f6df5]/10 border-[#4f6df5]/30 text-[#4f6df5]' : 'border-[#d1d5db] text-[#374151] hover:text-black hover:bg-gray-100'}`}>{t}</button>
                ))}
            </div>

            {filtered.length === 0 && <div className="text-center py-14 text-[#4b5563]"><div className="mb-3 opacity-30 flex justify-center"><FolderOpen size={40} /></div><div className="text-[14px] mb-5">No documents found</div>{canManage && <Btn primary onClick={() => setShowModal(true)}><Upload size={15} /> Add Document</Btn>}</div>}

            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                {filtered.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-[#e5e7eb] last:border-b-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 ${DOC_COLORS[doc.type] ?? 'bg-gray-100'}`}>{DOC_ICONS[doc.type] ?? '📁'}</div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium text-black truncate">{doc.name}</div>
                            <div className="text-[11.5px] text-[#4b5563]">
                                Added by {doc.uploader?.name ?? 'Team'} · {fmtDate(doc.created_at)} {doc.file_size ? `· ${doc.file_size}` : ''}
                            </div>
                        </div>
                        <Badge status={doc.type} label={doc.type} />
                        {doc.task_id && <span className="text-[10px] text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-full">Task</span>}
                        <button onClick={() => setPreviewDoc(doc)} className="inline-flex items-center gap-1.5 text-[12px] text-[#4b5563] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100"><Eye size={13} /> View</button>
                        <a href={`/documents/${doc.id}/download`} className="inline-flex items-center gap-1.5 text-[12px] text-[#4b5563] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100"><Download size={13} /> Download</a>
                        {canManage && (
                            <>
                                <button onClick={() => openEditDoc(doc)} className="p-1.5 rounded-md text-[#6b7280] hover:text-[#4f6df5] transition-colors" title="Edit"><Pencil size={14} /></button>
                                <button onClick={() => deleteDoc(doc)} className="p-1.5 rounded-md text-[#6b7280] hover:text-red-500 transition-colors" title="Delete"><Trash2 size={14} /></button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />

            {showModal && (
                <Modal title="Add Document" subtitle={`To ${project.name}`} onClose={() => setShowModal(false)} footer={<><Btn ghost onClick={() => setShowModal(false)}>Cancel</Btn><Btn primary onClick={submit} disabled={processing}>{processing ? 'Adding…' : 'Add Document'}</Btn></>}>
                    <div className="space-y-4 pb-2">
                        <FG label="Document Name *"><input className={inputCls} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Signed Contract — Project Name" /></FG>
                        <FG label="Document Type">
                            <Select value={data.type} onChange={v => setData('type', v)} options={['contract','brief','report','asset','other'].map(t => ({ value: t, label: t.charAt(0).toUpperCase()+t.slice(1) }))} />
                        </FG>
                        <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center text-[#4b5563]">
                            <input type="file" onChange={e => setData('file', e.target.files[0])} className="hidden" id="file-upload" />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <div className="text-3xl mb-2">📎</div>
                                <div className="text-[13px]">{data.file ? data.file.name : 'Click to upload or drag & drop'}</div>
                                <div className="text-[11px] mt-1">PDF, DOCX, PNG, ZIP — up to 100MB</div>
                            </label>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Edit Document Modal */}
            {editDoc && (
                <Modal title="Edit Document" subtitle={editDoc.name} onClose={() => setEditDoc(null)} footer={
                    <><Btn ghost onClick={() => setEditDoc(null)}><X size={13} /> Cancel</Btn>
                    <Btn primary onClick={submitEditDoc} disabled={editForm.processing}><Save size={13} /> {editForm.processing ? 'Saving…' : 'Save Changes'}</Btn></>
                }>
                    <div className="space-y-4 pb-2">
                        <FG label="Document Name *"><input className={inputCls} value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} /></FG>
                        <FG label="Document Type">
                            <Select value={editForm.data.type} onChange={v => editForm.setData('type', v)} options={['contract','brief','report','asset','other'].map(t => ({ value: t, label: t.charAt(0).toUpperCase()+t.slice(1) }))} />
                        </FG>
                        <FG label="Replace File">
                            <input type="file" onChange={e => editForm.setData('file', e.target.files[0])} className="text-[13px] text-[#4b5563]" />
                            {editDoc.file_size && !editForm.data.file && <div className="text-[11px] text-[#6b7280] mt-1">Current file: {editDoc.file_size}</div>}
                        </FG>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ── TIMELINE TAB ──────────────────────────────────────────────────────────────
function TimelineTab({ project }) {
    const today = new Date();
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const daysTotal = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.round((today - start) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, Math.round((end - today) / (1000 * 60 * 60 * 24)));
    const isCompleted = project.status === 'completed';
    const isOverdue = !isCompleted && today > end;

    // Use actual PROJECT_PHASES and match to project.phase
    const phaseNames = PROJECT_PHASES.map(p => p.name);
    const currentIdx = phaseNames.findIndex(p => (project.phase ?? '').toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes((project.phase ?? '').toLowerCase()));

    return (
        <div className="space-y-5">
            {/* Progress overview card */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-[18px] font-bold text-black">{project.progress}% Complete</div>
                        <div className="text-[13px] text-[#4b5563]">{isCompleted ? 'Project completed' : isOverdue ? 'Project overdue' : `${daysLeft} days remaining`}</div>
                    </div>
                    <Badge status={isOverdue ? 'overdue' : project.status} />
                </div>
                <div className="h-3 bg-[#f0f0f0] rounded-full overflow-hidden mb-6">
                    <div className={`h-full rounded-full progress-fill bg-gradient-to-r ${isCompleted ? 'from-emerald-500 to-emerald-400' : isOverdue ? 'from-red-500 to-red-400' : 'from-[#4f6df5] to-[#6380f7]'}`} style={{ width: `${project.progress}%` }} />
                </div>

                {/* Phase stepper */}
                <div className="flex items-start">
                    {PROJECT_PHASES.map((ph, i) => {
                        const done = isCompleted || i < currentIdx;
                        const active = !isCompleted && i === currentIdx;
                        return (
                            <div key={ph.name} className="flex-1 flex flex-col items-center">
                                <div className="flex items-center w-full">
                                    {i > 0 && <div className={`flex-1 h-0.5 ${done || active ? 'bg-emerald-300' : 'bg-[#e5e7eb]'}`} />}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${
                                        done ? 'bg-emerald-500 text-white' : active ? 'bg-[#4f6df5] text-white ring-4 ring-[#4f6df5]/20' : 'bg-[#f0f0f0] text-[#6b7280]'
                                    }`}>
                                        {done ? <CheckCircle size={14} /> : i + 1}
                                    </div>
                                    {i < PROJECT_PHASES.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-emerald-300' : 'bg-[#e5e7eb]'}`} />}
                                </div>
                                <span className={`text-[9px] text-center leading-tight mt-2 px-1 ${active ? 'text-[#4f6df5] font-bold' : done ? 'text-emerald-600' : 'text-[#6b7280]'}`}>{ph.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Key Dates */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Key Dates</span></div>
                    <div className="px-5 py-2">
                        {[
                            { l: 'Start Date', v: fmtDate(project.start_date), icon: <Calendar size={13} className="text-emerald-500" /> },
                            { l: 'End Date', v: fmtDate(project.end_date), icon: <Calendar size={13} className={isOverdue ? 'text-red-500' : 'text-[#4f6df5]'} /> },
                            { l: 'Days Elapsed', v: `${Math.max(0, daysElapsed)} of ${daysTotal} days`, icon: <Clock size={13} className="text-[#4b5563]" /> },
                            { l: 'Current Phase', v: project.phase, icon: <CheckCircle size={13} className="text-[#4f6df5]" /> },
                        ].map(({ l, v, icon }) => (
                            <div key={l} className="flex items-center gap-3 py-3 border-b border-[#f0f0f0] last:border-b-0 text-[13px]">
                                {icon}
                                <span className="text-[#4b5563] flex-1">{l}</span>
                                <span className="font-medium text-black">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Phase List */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Phase Checklist</span></div>
                    <div className="px-5 py-3">
                        {PROJECT_PHASES.map((ph, i) => {
                            const done = isCompleted || i < currentIdx;
                            const active = !isCompleted && i === currentIdx;
                            return (
                                <div key={ph.name} className={`flex items-center gap-3 py-2.5 border-b border-[#f0f0f0] last:border-b-0 ${active ? 'bg-indigo-50 -mx-5 px-5 rounded-lg' : ''}`}>
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                                        done ? 'bg-emerald-500 text-white' : active ? 'bg-[#4f6df5] text-white' : 'bg-[#f0f0f0] text-[#6b7280]'
                                    }`}>
                                        {done ? <Check size={12} /> : active ? <div className="w-2 h-2 rounded-sm bg-white" /> : <span className="text-[10px]">{i + 1}</span>}
                                    </div>
                                    <span className={`text-[13px] flex-1 ${done ? 'text-emerald-600' : active ? 'text-[#4f6df5] font-semibold' : 'text-[#374151]'}`}>{ph.name}</span>
                                    <span className="text-[11px] text-[#6b7280]">{ph.progress}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── TASKS TAB ─────────────────────────────────────────────────────────────────
function TasksTab({ project, canManage, taskCategories = [] }) {
    const confirm = useConfirm();
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [filter, setFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [collapsedCats, setCollapsedCats] = useState({});
    const toggleCat = (cat) => setCollapsedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
    const [expandedTask, setExpandedTask] = useState(null);
    const [showDocModal, setShowDocModal] = useState(null); // task id
    const [previewDoc, setPreviewDoc] = useState(null);
    // Local copy so drag-reordering feels instant; re-synced when the server data changes.
    const [tasks, setTasks] = useState(project.tasks ?? []);
    useEffect(() => { setTasks(project.tasks ?? []); }, [project.tasks]);
    const [dragTask, setDragTask] = useState(null); // { id, category }
    const [dragOverId, setDragOverId] = useState(null);
    // Bulk-selection state for changing the status of many tasks at once.
    const [selected, setSelected] = useState([]);
    const [bulkStatus, setBulkStatus] = useState('completed');
    const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    // Managed catalog names, plus any legacy category still on a task, so the dropdowns never lose a value.
    const catalogNames = taskCategories.map(c => c.name);
    const categoryOptions = [...new Set([...catalogNames, ...tasks.map(t => t.category).filter(Boolean)])].sort();
    const categories = categoryOptions;
    const filtered = tasks.filter(t =>
        (filter === 'all' || t.status === filter) &&
        (categoryFilter === 'all' || t.category === categoryFilter)
    );
    // Keep the bulk selection limited to tasks currently visible under the filters.
    useEffect(() => {
        const visibleIds = new Set(filtered.map(t => t.id));
        setSelected(prev => prev.filter(id => visibleIds.has(id)));
    }, [filter, categoryFilter, tasks]);

    const onDragStart = (t) => setDragTask({ id: t.id, category: t.category || 'General' });
    const onDragEnter = (t) => { if (dragTask && (t.category || 'General') === dragTask.category) setDragOverId(t.id); };
    const onDragEnd = () => { setDragTask(null); setDragOverId(null); };
    const onDropTask = (overTask) => {
        if (!dragTask || dragTask.id === overTask.id) return onDragEnd();
        const overCat = overTask.category || 'General';
        if (overCat !== dragTask.category) return onDragEnd();   // only reorder within the same category
        const list = [...tasks];
        const from = list.findIndex(t => t.id === dragTask.id);
        const to = list.findIndex(t => t.id === overTask.id);
        if (from === -1 || to === -1) return onDragEnd();
        const [moved] = list.splice(from, 1);
        list.splice(to, 0, moved);
        setTasks(list);
        const ids = list.filter(t => (t.category || 'General') === overCat).map(t => t.id);
        router.patch(route('projects.tasks.reorder', project.id), { ids }, { preserveState: true, preserveScroll: true });
        onDragEnd();
    };

    const teamMembers = usePage().props.teamMembers ?? [];

    const { data, setData, post, processing, reset } = useForm({
        title: '', assignee_id: '', due_date: '', priority: 'medium', status: 'not-started',
        category: taskCategories[0]?.name ?? 'General',
    });
    const submit = () => post(route('projects.tasks.store', project.id), { onSuccess: () => { setShowModal(false); reset(); } });
    const submitAndAddAnother = () => post(route('projects.tasks.store', project.id), {
        preserveScroll: true,
        onSuccess: () => { reset('title', 'assignee_id', 'due_date'); },
    });

    const editForm = useForm({
        title: '', assignee_id: '', due_date: '', priority: 'medium', status: 'not-started', category: '',
    });

    const openEdit = (task) => {
        editForm.setData({
            title: task.title ?? '',
            assignee_id: task.assignee_id ?? '',
            due_date: task.due_date?.slice(0, 10) ?? '',
            priority: task.priority ?? 'medium',
            status: task.status ?? 'not-started',
            category: task.category ?? '',
        });
        setEditTask(task);
    };

    const submitEdit = () => {
        editForm.put(route('projects.tasks.update', [project.id, editTask.id]), {
            onSuccess: () => { setEditTask(null); editForm.reset(); },
        });
    };

    const deleteTask = async (task) => {
        if (await confirm({ title: 'Delete this task?', message: 'This task will be permanently removed.', danger: true })) {
            router.delete(route('projects.tasks.destroy', [project.id, task.id]));
        }
    };

    const docForm = useForm({ name: '', type: 'other', file: null, task_id: null });
    const submitDoc = () => {
        docForm.post(route('projects.documents.store', project.id), {
            forceFormData: true,
            onSuccess: () => { setShowDocModal(null); docForm.reset(); },
        });
    };

    const cycleStatus = (task) => {
        const next = { 'not-started': 'in-progress', 'in-progress': 'review', 'review': 'pending-approval', 'pending-approval': 'completed', 'completed': 'not-started' };
        router.patch(route('tasks.status', task.id), { status: next[task.status] ?? 'not-started' });
    };

    const applyBulkStatus = () => {
        if (selected.length === 0) return;
        router.patch(route('projects.tasks.bulk-status', project.id), { ids: selected, status: bulkStatus }, {
            preserveScroll: true,
            onSuccess: () => setSelected([]),
        });
    };

    const deleteDoc = async (doc) => {
        if (await confirm({ title: 'Delete this document?', message: 'This file will be permanently removed.', danger: true })) {
            router.delete(route('projects.documents.destroy', [project.id, doc.id]));
        }
    };

    // Group by category
    const byCategory = {};
    filtered.forEach(t => { if (!byCategory[t.category]) byCategory[t.category] = []; byCategory[t.category].push(t); });

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Task List</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}><Plus size={13} /> Add Task</Btn>}
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex bg-[#f3f4f6] rounded-lg p-0.5 w-fit">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'not-started', label: 'To Do' },
                        { key: 'in-progress', label: 'In Progress' },
                        { key: 'review', label: 'Review' },
                        { key: 'pending-approval', label: 'Pending Approval' },
                        { key: 'completed', label: 'Done' },
                    ].map(s => (
                        <button key={s.key} onClick={() => setFilter(s.key)} className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${filter === s.key ? 'bg-white text-black shadow-sm' : 'text-[#4b5563] hover:text-black'}`}>
                            {s.label}
                        </button>
                    ))}
                </div>
                {categories.length > 0 && (
                    <Select value={categoryFilter} onChange={v => setCategoryFilter(v)} options={[{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: c }))]} />
                )}
                {canManage && (
                    <Link href={route('categories.index')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#4b5563] border border-[#d1d5db] hover:text-[#4f6df5] hover:border-[#4f6df5] transition-colors">
                        <Tag size={13} /> Manage Categories
                    </Link>
                )}
            </div>

            {canManage && selected.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-5 px-4 py-2.5 bg-[#4f6df5]/5 border border-[#4f6df5]/20 rounded-xl">
                    <span className="text-[12px] font-semibold text-[#4f6df5]">{selected.length} selected</span>
                    <span className="text-[12px] text-[#4b5563]">Set status to</span>
                    <Select value={bulkStatus} onChange={v => setBulkStatus(v)} options={[['not-started','To Do'],['in-progress','In Progress'],['review','Review'],['pending-approval','Pending Approval'],['completed','Done']].map(([v,l]) => ({ value: v, label: l }))} />
                    <Btn primary sm onClick={applyBulkStatus}><Check size={13} /> Apply</Btn>
                    <button onClick={() => setSelected([])} className="text-[12px] text-[#4b5563] hover:text-black transition-colors">Clear</button>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="text-center py-14 text-[#4b5563]">
                    <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><ListChecks size={24} className="text-indigo-400" /></div></div>
                    <div className="text-[14px] font-semibold text-black mb-1">No tasks found</div>
                    <div className="text-[13px] text-[#4b5563] mb-4">Add tasks to track work on this project</div>
                    {canManage && <Btn primary onClick={() => setShowModal(true)}><Plus size={15} /> Add First Task</Btn>}
                </div>
            )}

            {Object.entries(byCategory).map(([cat, catTasks]) => {
                const collapsed = collapsedCats[cat];
                const catIds = catTasks.map(t => t.id);
                const allCatSelected = catIds.length > 0 && catIds.every(id => selected.includes(id));
                const toggleCatSelect = () => setSelected(prev => allCatSelected ? prev.filter(id => !catIds.includes(id)) : [...new Set([...prev, ...catIds])]);
                return (
                <div key={cat} className="mb-5">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#e5e7eb]">
                        {canManage && (
                            <input
                                type="checkbox"
                                checked={allCatSelected}
                                onChange={toggleCatSelect}
                                title="Select all in category"
                                className="w-4 h-4 rounded border-[#d1d5db] text-[#4f6df5] focus:ring-[#4f6df5] cursor-pointer flex-shrink-0"
                            />
                        )}
                        <button onClick={() => toggleCat(cat)} className="flex-1 flex items-center gap-2 text-[10.5px] tracking-[1.5px] uppercase text-[#4b5563] hover:text-black transition-colors">
                            {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                            <ListChecks size={13} /> {cat} <span className="text-[#6b7280]">({catTasks.length})</span>
                        </button>
                    </div>
                    {!collapsed && (
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        {catTasks.map(t => {
                            const docs = t.documents ?? [];
                            const isExpanded = expandedTask === t.id;
                            return (
                                <div
                                    key={t.id}
                                    draggable={canManage}
                                    onDragStart={() => onDragStart(t)}
                                    onDragEnter={() => onDragEnter(t)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => onDropTask(t)}
                                    onDragEnd={onDragEnd}
                                    className={`border-b border-[#f0f0f0] last:border-b-0 transition-all
                                        ${dragTask?.id === t.id ? 'opacity-40' : ''}
                                        ${dragOverId === t.id && dragTask?.id !== t.id ? 'border-t-2 border-t-[#4f6df5]' : ''}`}
                                >
                                    <div className={`flex items-center gap-2 px-4 py-3 transition-colors ${selected.includes(t.id) ? 'bg-[#4f6df5]/5' : 'hover:bg-[#fafbfc]'}`}>
                                        {canManage && (
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(t.id)}
                                                onChange={() => toggleSelect(t.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-4 h-4 rounded border-[#d1d5db] text-[#4f6df5] focus:ring-[#4f6df5] cursor-pointer flex-shrink-0"
                                            />
                                        )}
                                        {canManage && (
                                            <span className="cursor-grab active:cursor-grabbing text-[#6b7280] hover:text-[#9ca3af] flex-shrink-0" title="Drag to reorder">
                                                <GripVertical size={15} />
                                            </span>
                                        )}
                                        <button
                                            onClick={() => cycleStatus(t)}
                                            className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all
                                                ${t.status === 'completed' ? 'border-emerald-400 bg-emerald-400' : t.status === 'in-progress' ? 'border-indigo-400 bg-indigo-50' : t.status === 'pending-approval' ? 'border-amber-400 bg-amber-50' : 'border-[#d1d5db] hover:border-[#4f6df5]'}`}
                                        >
                                            {t.status === 'completed' && <Check size={12} className="text-white" />}
                                            {t.status === 'in-progress' && <div className="w-2 h-2 rounded-sm bg-indigo-400" />}
                                            {t.status === 'pending-approval' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                                        </button>
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : t.id)}>
                                            <div className={`text-[13px] ${t.status === 'completed' ? 'text-emerald-600' : 'text-black font-medium'}`}>{t.title}</div>
                                            <div className="text-[11px] text-[#6b7280] flex items-center gap-1.5">
                                                {t.assignee && <span>{t.assignee}</span>}
                                                {t.due_date && <><span>·</span><span className="flex items-center gap-0.5"><Calendar size={10} /> {fmtDate(t.due_date)}</span></>}
                                                {docs.length > 0 && <><span>·</span><span className="flex items-center gap-0.5"><FileText size={10} /> {docs.length} doc{docs.length !== 1 ? 's' : ''}</span></>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {canManage && (
                                                <button
                                                    onClick={() => { docForm.setData('task_id', t.id); setShowDocModal(t.id); }}
                                                    className="p-1.5 rounded-md text-[#6b7280] hover:text-[#4f6df5] hover:bg-indigo-50 transition-colors"
                                                    title="Attach document"
                                                >
                                                    <Upload size={13} />
                                                </button>
                                            )}
                                            <Badge status={t.priority} />
                                            {canManage ? (
                                                <button
                                                    onClick={() => cycleStatus(t)}
                                                    title="Click to change status"
                                                    className="cursor-pointer"
                                                >
                                                    <Badge status={t.status} label={t.status === 'not-started' ? 'To Do' : t.status === 'in-progress' ? 'In Progress' : t.status === 'review' ? 'Review' : t.status === 'pending-approval' ? 'Pending Approval' : 'Done'} />
                                                </button>
                                            ) : (
                                                <Badge status={t.status} label={t.status === 'not-started' ? 'To Do' : t.status === 'in-progress' ? 'In Progress' : t.status === 'review' ? 'Review' : t.status === 'pending-approval' ? 'Pending Approval' : 'Done'} />
                                            )}
                                            {canManage && (
                                                <>
                                                    <button
                                                        onClick={() => openEdit(t)}
                                                        className="p-1.5 rounded-md text-[#6b7280] hover:text-[#4f6df5] hover:bg-indigo-50 transition-colors"
                                                        title="Edit task"
                                                    >
                                                        <Pencil size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTask(t)}
                                                        className="p-1.5 rounded-md text-[#6b7280] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Delete task"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {isExpanded && docs.length > 0 && (
                                        <div className="px-4 pb-3 pt-0">
                                            <div className="ml-8 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg overflow-hidden">
                                                <div className="px-3 py-2 border-b border-[#e5e7eb] text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium flex items-center gap-1.5">
                                                    <FileText size={11} /> Attached Documents
                                                </div>
                                                {docs.map(doc => (
                                                    <div key={doc.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#f0f0f0] last:border-b-0">
                                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[13px] flex-shrink-0 ${DOC_COLORS[doc.type] ?? 'bg-gray-100'}`}>
                                                            {DOC_ICONS[doc.type] ?? '📁'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[12px] font-medium text-black truncate">{doc.name}</div>
                                                            <div className="text-[10px] text-[#6b7280]">
                                                                {doc.uploader?.name ?? 'Team'} · {fmtDate(doc.created_at)} {doc.file_size ? `· ${doc.file_size}` : ''}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => setPreviewDoc(doc)} className="inline-flex items-center gap-1 text-[11px] text-[#4b5563] hover:text-black transition-colors px-2 py-1 rounded-md border border-[#e5e7eb] hover:bg-white">
                                                            <Eye size={11} /> View
                                                        </button>
                                                        <a href={`/documents/${doc.id}/download`} className="inline-flex items-center gap-1 text-[11px] text-[#4b5563] hover:text-black transition-colors px-2 py-1 rounded-md border border-[#e5e7eb] hover:bg-white">
                                                            <Download size={11} /> Download
                                                        </a>
                                                        {canManage && (
                                                            <button onClick={() => deleteDoc(doc)} className="p-1 rounded-md text-[#6b7280] hover:text-red-400 transition-colors">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {isExpanded && docs.length === 0 && (
                                        <div className="px-4 pb-3 pt-0">
                                            <div className="ml-8 text-[12px] text-[#6b7280] flex items-center gap-1.5 py-2">
                                                <FileText size={11} /> No documents attached
                                                {canManage && (
                                                    <button
                                                        onClick={() => { docForm.setData('task_id', t.id); setShowDocModal(t.id); }}
                                                        className="ml-1 text-[#4f6df5] hover:underline"
                                                    >
                                                        — Add one
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    )}
                </div>
                );
            })}

            {showModal && (
                <Modal title="Add Task" subtitle={`For ${project.name}`} onClose={() => setShowModal(false)} footer={<><Btn ghost onClick={() => setShowModal(false)}><X size={13} /> Cancel</Btn><Btn ghost onClick={submitAndAddAnother} disabled={processing}><Plus size={13} /> {processing ? 'Saving…' : 'Save & Add Another'}</Btn><Btn primary onClick={submit} disabled={processing}><Plus size={13} /> {processing ? 'Adding…' : 'Add Task'}</Btn></>}>
                    <div className="space-y-4 pb-2">
                        <FG label="Task Title *"><input className={inputCls} value={data.title} onChange={e => setData('title', e.target.value)} placeholder="What needs to be done?" /></FG>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Assignee">
                                <Select value={data.assignee_id} onChange={v => setData('assignee_id', v)} placeholder="Unassigned" clearable options={teamMembers.map(m => ({ value: m.id, label: `${m.name}${m.role ? ` — ${m.role}` : ''}` }))} />
                            </FG>
                            <FG label="Due Date"><input className={inputCls} type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Priority">
                                <Select value={data.priority} onChange={v => setData('priority', v)} options={['high','medium','low'].map(p => ({ value: p, label: p.charAt(0).toUpperCase()+p.slice(1) }))} />
                            </FG>
                            <FG label="Status">
                                <Select value={data.status} onChange={v => setData('status', v)} options={[['not-started','Not Started'],['in-progress','In Progress'],['review','Review'],['pending-approval','Pending Approval'],['completed','Completed']].map(([v,l]) => ({ value: v, label: l }))} />
                            </FG>
                        </div>
                        <FG label="Category">
                            {categoryOptions.length > 0 ? (
                                <Select value={data.category} onChange={v => setData('category', v)} options={[...(!categoryOptions.includes(data.category) ? [{ value: data.category, label: data.category }] : []), ...categoryOptions.map(c => ({ value: c, label: c }))]} />
                            ) : (
                                <input className={inputCls} value={data.category} onChange={e => setData('category', e.target.value)} placeholder="e.g. Deliverable, Client Approval, Milestone" />
                            )}
                            <p className="text-[11px] text-[#6b7280] mt-1.5">Manage categories in Settings → Task Categories.</p>
                        </FG>
                    </div>
                </Modal>
            )}

            {editTask && (
                <Modal title="Edit Task" subtitle={`For ${project.name}`} onClose={() => setEditTask(null)} footer={<><Btn ghost onClick={() => setEditTask(null)}><X size={13} /> Cancel</Btn><Btn primary onClick={submitEdit} disabled={editForm.processing}><Save size={13} /> {editForm.processing ? 'Saving…' : 'Save Changes'}</Btn></>}>
                    <div className="space-y-4 pb-2">
                        <FG label="Task Title *" error={editForm.errors.title}><input className={inputCls} value={editForm.data.title} onChange={e => editForm.setData('title', e.target.value)} placeholder="What needs to be done?" /></FG>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Assignee">
                                <Select value={editForm.data.assignee_id} onChange={v => editForm.setData('assignee_id', v)} placeholder="Unassigned" clearable options={teamMembers.map(m => ({ value: m.id, label: `${m.name}${m.role ? ` — ${m.role}` : ''}` }))} />
                            </FG>
                            <FG label="Due Date"><input className={inputCls} type="date" value={editForm.data.due_date} onChange={e => editForm.setData('due_date', e.target.value)} /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Priority">
                                <Select value={editForm.data.priority} onChange={v => editForm.setData('priority', v)} options={['high','medium','low'].map(p => ({ value: p, label: p.charAt(0).toUpperCase()+p.slice(1) }))} />
                            </FG>
                            <FG label="Status">
                                <Select value={editForm.data.status} onChange={v => editForm.setData('status', v)} options={[['not-started','Not Started'],['in-progress','In Progress'],['review','Review'],['pending-approval','Pending Approval'],['completed','Completed']].map(([v,l]) => ({ value: v, label: l }))} />
                            </FG>
                        </div>
                        <FG label="Category">
                            {categoryOptions.length > 0 ? (
                                <Select value={editForm.data.category} onChange={v => editForm.setData('category', v)} options={[...((!categoryOptions.includes(editForm.data.category) && editForm.data.category) ? [{ value: editForm.data.category, label: editForm.data.category }] : []), ...categoryOptions.map(c => ({ value: c, label: c }))]} />
                            ) : (
                                <input className={inputCls} value={editForm.data.category} onChange={e => editForm.setData('category', e.target.value)} placeholder="e.g. Deliverable, Client Approval, Milestone" />
                            )}
                        </FG>
                    </div>
                </Modal>
            )}

            {showDocModal && (
                <Modal title="Attach Document" subtitle={`To task: ${tasks.find(t => t.id === showDocModal)?.title ?? ''}`} onClose={() => { setShowDocModal(null); docForm.reset(); }} footer={<><Btn ghost onClick={() => { setShowDocModal(null); docForm.reset(); }}>Cancel</Btn><Btn primary onClick={submitDoc} disabled={docForm.processing}>{docForm.processing ? 'Uploading…' : 'Upload Document'}</Btn></>}>
                    <div className="space-y-4 pb-2">
                        <FG label="Document Name *"><input className={inputCls} value={docForm.data.name} onChange={e => docForm.setData('name', e.target.value)} placeholder="e.g. Final Mockup, Brand Guidelines" /></FG>
                        <FG label="Document Type">
                            <Select value={docForm.data.type} onChange={v => docForm.setData('type', v)} options={['contract','brief','report','asset','other'].map(t => ({ value: t, label: t.charAt(0).toUpperCase()+t.slice(1) }))} />
                        </FG>
                        <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center text-[#4b5563]">
                            <input type="file" onChange={e => docForm.setData('file', e.target.files[0])} className="hidden" id="task-file-upload" />
                            <label htmlFor="task-file-upload" className="cursor-pointer">
                                <div className="text-3xl mb-2">📎</div>
                                <div className="text-[13px]">{docForm.data.file ? docForm.data.file.name : 'Click to upload or drag & drop'}</div>
                                <div className="text-[11px] mt-1">PDF, DOCX, PNG, ZIP — up to 100MB</div>
                            </label>
                        </div>
                    </div>
                </Modal>
            )}

            <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        </>
    );
}

// ── Section helper ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
    return (
        <div>
            <div className="text-[10px] tracking-[1.5px] uppercase text-[#4b5563] mb-2">{title}</div>
            {children}
        </div>
    );
}

// Exchange-rate input shown only when an entry's currency differs from the
// project's. Converts the entry into the project currency for project-level totals.
function FxRateRow({ amount, currency, rate, projectCurrency, onChange }) {
    if (!currency || currency === projectCurrency) return null;
    const converted = (parseFloat(amount) || 0) * (parseFloat(rate) || 0);
    return (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 grid grid-cols-2 gap-3 items-end">
            <FG label={`Exchange rate (1 ${currency} → ${projectCurrency})`}>
                <input className={inputCls} type="number" step="0.000001" value={rate} onChange={e => onChange(e.target.value)} placeholder="0.00" />
            </FG>
            <div className="text-[12px] text-amber-700 pb-2">
                ≈ {formatMoney(converted, projectCurrency)} <span className="text-amber-500">in project currency</span>
            </div>
        </div>
    );
}

// ── BILLS TAB (Vendor/Contractor Invoices) ───────────────────────────────────
function BillsTab({ project, canManage, fmt }) {
    const projectCurrency = project.currency ?? 'USD';
    const confirm = useConfirm();
    const [showModal, setShowModal] = useState(false);
    const [editBill, setEditBill] = useState(null);
    const bills = project.bills ?? [];
    const { props } = usePage();
    const allClients = props.clients ?? [];
    const vendors = allClients.filter(c => c.type === 'vendor' || c.type === 'contractor');

    // Bills can be in different currencies than the project, so total per
    // currency and format each in its own currency rather than the project's.
    const billCur = (b) => b.currency ?? project.currency ?? 'USD';
    const sumByCurrency = (list) => list.reduce((m, b) => { const c = billCur(b); m[c] = (m[c] ?? 0) + parseFloat(b.amount ?? 0); return m; }, {});
    const fmtByCurrency = (map) => {
        const entries = Object.entries(map);
        return entries.length ? entries.map(([c, v]) => formatMoney(v, c)).join(' + ') : fmt(0);
    };
    const totalBills = sumByCurrency(bills);
    const totalPaid = sumByCurrency(bills.filter(b => b.status === 'paid'));
    const totalPending = sumByCurrency(bills.filter(b => b.status !== 'paid'));
    const hasPending = Object.values(totalPending).some(v => v > 0);

    const { data, setData, post, processing, reset, errors } = useForm({
        client_id: '', number: '', amount: '', currency: projectCurrency, exchange_rate: 1,
        date: new Date().toISOString().slice(0, 10), due_date: '',
        description: '', category: '', notes: '', file: null,
    });

    const submit = () => {
        post(route('projects.bills.store', project.id), {
            forceFormData: true,
            onSuccess: () => { setShowModal(false); reset(); },
        });
    };

    const editForm = useForm({
        client_id: '', number: '', amount: '', currency: projectCurrency, exchange_rate: 1,
        date: '', due_date: '', description: '', category: '', notes: '', file: null,
    });

    const openEdit = (bill) => {
        editForm.setData({
            client_id: bill.client_id ?? '', number: bill.number ?? '', amount: bill.amount ?? '',
            currency: bill.currency ?? projectCurrency, exchange_rate: bill.exchange_rate ?? 1,
            date: bill.date?.slice(0, 10) ?? '',
            due_date: bill.due_date?.slice(0, 10) ?? '', description: bill.description ?? '',
            category: bill.category ?? '', notes: bill.notes ?? '', file: null,
        });
        setEditBill(bill);
    };

    const submitEdit = () => {
        editForm.transform(data => ({ ...data, _method: 'PATCH' }));
        editForm.post(route('projects.bills.update', [project.id, editBill.id]), {
            forceFormData: true,
            onSuccess: () => { setEditBill(null); editForm.reset(); },
        });
    };

    const updateStatus = (bill, status) => {
        router.patch(route('projects.bills.update', [project.id, bill.id]), { status });
    };

    const deleteBill = async (bill) => {
        if (await confirm({ title: 'Delete this bill?', message: 'This vendor bill will be permanently removed.', danger: true })) {
            router.delete(route('projects.bills.destroy', [project.id, bill.id]));
        }
    };

    const statusColors = { pending: 'border-l-amber-400', approved: 'border-l-indigo-400', paid: 'border-l-emerald-400' };

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Vendor & Contractor Bills</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}><Plus size={13} /> Add Bill</Btn>}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {[
                    { l: 'Total Bills', v: fmtByCurrency(totalBills), icon: <Receipt size={16} />, bg: 'bg-indigo-50 border-indigo-100', iconC: 'text-indigo-500', textC: 'text-indigo-700' },
                    { l: 'Paid', v: fmtByCurrency(totalPaid), icon: <Check size={16} />, bg: 'bg-emerald-50 border-emerald-100', iconC: 'text-emerald-500', textC: 'text-emerald-700' },
                    { l: 'Pending', v: fmtByCurrency(totalPending), icon: <Clock size={16} />, bg: hasPending ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100', iconC: hasPending ? 'text-amber-500' : 'text-gray-600', textC: hasPending ? 'text-amber-700' : 'text-gray-600' },
                ].map(({ l, v, icon, bg, iconC, textC }) => (
                    <div key={l} className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
                        <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center ${iconC} shadow-sm`}>{icon}</div>
                        <div>
                            <div className="text-[10px] tracking-[1.5px] uppercase text-[#4b5563] font-medium">{l}</div>
                            <div className={`text-[20px] font-bold ${textC} leading-tight`}>{v}</div>
                        </div>
                    </div>
                ))}
            </div>

            {bills.length === 0 && !showModal && (
                <div className="text-center py-14 text-[#4b5563]">
                    <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><Receipt size={24} className="text-indigo-400" /></div></div>
                    <div className="text-[14px] font-semibold text-black mb-1">No bills yet</div>
                    <div className="text-[13px] text-[#4b5563] mb-4">Track invoices from vendors and contractors</div>
                    {canManage && <Btn primary onClick={() => setShowModal(true)}><Plus size={15} /> Add First Bill</Btn>}
                </div>
            )}

            {/* Bill list */}
            <div className="space-y-3">
                {bills.map(bill => (
                    <div key={bill.id} className={`bg-white border border-[#e5e7eb] ${statusColors[bill.status] ?? ''} border-l-[3px] rounded-xl p-5`}>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-0.5">
                                    {bill.vendor && <span className="text-[13px] font-semibold text-black">{bill.vendor.name}</span>}
                                    {bill.number && <span className="text-[12px] font-mono text-[#4b5563]">#{bill.number}</span>}
                                    <Badge status={bill.status} />
                                    {bill.category && <span className="text-[10px] px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-500 font-medium">{bill.category}</span>}
                                </div>
                                <div className="text-[12px] text-[#4b5563]">
                                    {bill.description}
                                    {bill.due_date && <span> · Due {fmtDate(bill.due_date)}</span>}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-[18px] font-bold text-black">{formatMoney(bill.amount, billCur(bill))}</div>
                                <div className="text-[11px] text-[#6b7280]">{fmtDate(bill.date)}</div>
                            </div>
                        </div>

                        {/* File */}
                        {bill.file_path && (
                            <div className="flex items-center gap-2 mb-3 bg-[#fafbfc] border border-[#e5e7eb] rounded-lg px-3 py-2">
                                <FileText size={14} className="text-[#4b5563]" />
                                <span className="text-[12px] text-[#374151] flex-1">{bill.file_name}</span>
                                <a href={`/storage/${bill.file_path}`} target="_blank" className="text-[12px] text-[#4f6df5] font-medium">View</a>
                            </div>
                        )}

                        {bill.notes && <div className="text-[12px] text-[#4b5563] mb-3 italic">{bill.notes}</div>}

                        {/* Actions */}
                        {canManage && (
                            <div className="flex items-center gap-2">
                                {bill.status === 'pending' && (
                                    <Btn ghost sm onClick={() => updateStatus(bill, 'approved')}><Check size={13} /> Approve</Btn>
                                )}
                                {bill.status === 'approved' && (
                                    <Btn ghost sm onClick={() => updateStatus(bill, 'paid')}><Check size={13} /> Mark Paid</Btn>
                                )}
                                {bill.status === 'paid' && (
                                    <>
                                        <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                                            Paid {bill.paid_date ? fmtDate(bill.paid_date) : ''}
                                        </span>
                                        <a href={`/bills/${bill.id}/remittance`} className="inline-flex items-center gap-1 text-[11px] text-[#4f6df5] hover:text-[#6380f7] font-medium transition-colors">
                                            <FileText size={12} /> Remittance Advice
                                        </a>
                                    </>
                                )}
                                <button onClick={() => openEdit(bill)} className="text-[#6b7280] hover:text-[#4f6df5] transition-colors p-1.5 ml-auto" title="Edit"><Pencil size={14} /></button>
                                <button onClick={() => deleteBill(bill)} className="text-[#6b7280] hover:text-red-500 transition-colors p-1.5" title="Delete"><Trash2 size={14} /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Bill Modal */}
            {showModal && (
                <Modal title="Add Vendor/Contractor Bill" subtitle={`For ${project.name}`} large onClose={() => setShowModal(false)} footer={
                    <><Btn ghost onClick={() => setShowModal(false)}><X size={13} /> Cancel</Btn>
                    <Btn primary onClick={submit} disabled={processing}><Plus size={13} /> {processing ? 'Adding…' : 'Add Bill'}</Btn></>
                }>
                    <div className="space-y-4 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Vendor / Contractor" error={errors.client_id}>
                                <Select value={data.client_id} onChange={v => setData('client_id', v)} placeholder="Select..." clearable options={vendors.map(v => ({ value: v.id, label: `${v.name} (${v.type})` }))} />
                            </FG>
                            <FG label="Their Invoice #"><input className={inputCls} value={data.number} onChange={e => setData('number', e.target.value)} placeholder="e.g. VND-001" /></FG>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <FG label="Amount *" error={errors.amount}><input className={inputCls} type="number" step="0.01" value={data.amount} onChange={e => setData('amount', e.target.value)} placeholder="0.00" /></FG>
                            <FG label="Currency">
                                <Select value={data.currency} onChange={v => { setData('currency', v); if (v === projectCurrency) setData('exchange_rate', 1); }} options={['USD','PHP','JPY','EUR','GBP','SGD','AUD','THB','VND','IDR','MYR'].map(c => ({ value: c, label: c }))} />
                            </FG>
                            <FG label="Category"><input className={inputCls} value={data.category} onChange={e => setData('category', e.target.value)} placeholder="e.g. Design, Dev" /></FG>
                        </div>
                        <FxRateRow amount={data.amount} currency={data.currency} rate={data.exchange_rate} projectCurrency={projectCurrency} onChange={v => setData('exchange_rate', v)} />
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Bill Date *" error={errors.date}><input className={inputCls} type="date" value={data.date} onChange={e => setData('date', e.target.value)} /></FG>
                            <FG label="Due Date"><input className={inputCls} type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} /></FG>
                        </div>
                        <FG label="Description"><input className={inputCls} value={data.description} onChange={e => setData('description', e.target.value)} placeholder="What is this bill for?" /></FG>
                        <FG label="Notes"><textarea className={`${inputCls} resize-y`} rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Payment terms, bank details, etc." /></FG>
                        <FG label="Attach Invoice File">
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setData('file', e.target.files[0])} className="text-[13px] text-[#4b5563]" />
                        </FG>
                    </div>
                </Modal>
            )}

            {/* Edit Bill Modal */}
            {editBill && (
                <Modal title="Edit Bill" subtitle={`${editBill.vendor?.name ?? ''} ${editBill.number ? '#' + editBill.number : ''}`} large onClose={() => setEditBill(null)} footer={
                    <><Btn ghost onClick={() => setEditBill(null)}><X size={13} /> Cancel</Btn>
                    <Btn primary onClick={submitEdit} disabled={editForm.processing}><Save size={13} /> {editForm.processing ? 'Saving…' : 'Save Changes'}</Btn></>
                }>
                    <div className="space-y-4 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Vendor / Contractor" error={editForm.errors.client_id}>
                                <Select value={editForm.data.client_id} onChange={v => editForm.setData('client_id', v)} placeholder="Select..." clearable options={vendors.map(v => ({ value: v.id, label: `${v.name} (${v.type})` }))} />
                            </FG>
                            <FG label="Their Invoice #"><input className={inputCls} value={editForm.data.number} onChange={e => editForm.setData('number', e.target.value)} placeholder="e.g. VND-001" /></FG>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <FG label="Amount *" error={editForm.errors.amount}><input className={inputCls} type="number" step="0.01" value={editForm.data.amount} onChange={e => editForm.setData('amount', e.target.value)} placeholder="0.00" /></FG>
                            <FG label="Currency">
                                <Select value={editForm.data.currency} onChange={v => { editForm.setData('currency', v); if (v === projectCurrency) editForm.setData('exchange_rate', 1); }} options={['USD','PHP','JPY','EUR','GBP','SGD','AUD','THB','VND','IDR','MYR'].map(c => ({ value: c, label: c }))} />
                            </FG>
                            <FG label="Category"><input className={inputCls} value={editForm.data.category} onChange={e => editForm.setData('category', e.target.value)} placeholder="e.g. Design, Dev" /></FG>
                        </div>
                        <FxRateRow amount={editForm.data.amount} currency={editForm.data.currency} rate={editForm.data.exchange_rate} projectCurrency={projectCurrency} onChange={v => editForm.setData('exchange_rate', v)} />
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Bill Date *" error={editForm.errors.date}><input className={inputCls} type="date" value={editForm.data.date} onChange={e => editForm.setData('date', e.target.value)} /></FG>
                            <FG label="Due Date"><input className={inputCls} type="date" value={editForm.data.due_date} onChange={e => editForm.setData('due_date', e.target.value)} /></FG>
                        </div>
                        <FG label="Description"><input className={inputCls} value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} placeholder="What is this bill for?" /></FG>
                        <FG label="Notes"><textarea className={`${inputCls} resize-y`} rows={2} value={editForm.data.notes} onChange={e => editForm.setData('notes', e.target.value)} placeholder="Payment terms, bank details, etc." /></FG>
                        <FG label="Replace Invoice File">
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => editForm.setData('file', e.target.files[0])} className="text-[13px] text-[#4b5563]" />
                            {editBill.file_name && !editForm.data.file && <div className="text-[11px] text-[#6b7280] mt-1">Current: {editBill.file_name}</div>}
                        </FG>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ── PAYROLL TAB ──────────────────────────────────────────────────────────────
function PayrollTab({ project, canManage, fmt }) {
    const confirm = useConfirm();
    const [showModal, setShowModal] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const entries = project.payroll ?? [];
    const { props } = usePage();
    const teamMembers = props.teamMembers ?? [];
    const projectCurrency = project.currency ?? 'USD';

    // Entries can be in different currencies — total per currency, format each in its own.
    const entryCur = (e) => e.currency ?? projectCurrency;
    const sumByCurrency = (list) => list.reduce((m, e) => { const c = entryCur(e); m[c] = (m[c] ?? 0) + parseFloat(e.amount ?? 0); return m; }, {});
    const fmtByCurrency = (map) => { const ent = Object.entries(map); return ent.length ? ent.map(([c, v]) => formatMoney(v, c)).join(' + ') : fmt(0); };
    const totalPayroll = sumByCurrency(entries);
    const totalPaid = sumByCurrency(entries.filter(e => e.status === 'paid'));

    const { data, setData, post, processing, reset } = useForm({
        team_member_id: '', period: '', pay_type: 'monthly', rate: '', hours: '', amount: '', currency: projectCurrency, exchange_rate: 1, notes: '',
    });

    // Auto-compute amount when rate/hours change
    const computeAmount = (payType, rate, hours) => {
        if (payType === 'hourly' && rate && hours) return (parseFloat(rate) * parseFloat(hours)).toFixed(2);
        if (payType === 'monthly' && rate) return rate;
        if (payType === 'fixed' && rate) return rate;
        return '';
    };

    const handleMemberSelect = (id) => {
        setData('team_member_id', id);
        const member = teamMembers.find(m => String(m.id) === id);
        if (member) {
            // Note: teamMembers shared props may not include rate fields, so we try
        }
    };

    const submit = () => {
        post(route('projects.payroll.store', project.id), { onSuccess: () => { setShowModal(false); reset(); } });
    };

    const editForm = useForm({
        team_member_id: '', period: '', pay_type: 'monthly', rate: '', hours: '', amount: '', currency: projectCurrency, exchange_rate: 1, notes: '',
    });

    const openEdit = (entry) => {
        editForm.setData({
            team_member_id: entry.team_member_id ?? '', period: entry.period ?? '', pay_type: entry.pay_type ?? 'monthly',
            rate: entry.rate ?? '', hours: entry.hours ?? '', amount: entry.amount ?? '',
            currency: entry.currency ?? projectCurrency, exchange_rate: entry.exchange_rate ?? 1, notes: entry.notes ?? '',
        });
        setEditEntry(entry);
    };

    const submitEdit = () => {
        editForm.transform(data => ({ ...data, _method: 'PATCH' }));
        editForm.post(route('projects.payroll.update', [project.id, editEntry.id]), {
            onSuccess: () => { setEditEntry(null); editForm.reset(); },
        });
    };

    const markPaid = (entry) => router.patch(route('projects.payroll.update', [project.id, entry.id]), { status: 'paid' });
    const deleteEntry = async (entry) => { if (await confirm({ title: 'Delete this payroll entry?', message: 'This entry will be permanently removed.', danger: true })) router.delete(route('projects.payroll.destroy', [project.id, entry.id])); };

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Team Payroll</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}><Plus size={13} /> Add Entry</Btn>}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                    { l: 'Total Payroll', v: fmtByCurrency(totalPayroll), icon: <Users size={16} />, bg: 'bg-indigo-50 border-indigo-100', iconC: 'text-indigo-500', textC: 'text-indigo-700' },
                    { l: 'Paid Out', v: fmtByCurrency(totalPaid), icon: <Check size={16} />, bg: 'bg-emerald-50 border-emerald-100', iconC: 'text-emerald-500', textC: 'text-emerald-700' },
                ].map(({ l, v, icon, bg, iconC, textC }) => (
                    <div key={l} className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
                        <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center ${iconC} shadow-sm`}>{icon}</div>
                        <div>
                            <div className="text-[10px] tracking-[1.5px] uppercase text-[#4b5563] font-medium">{l}</div>
                            <div className={`text-[20px] font-bold ${textC} leading-tight`}>{v}</div>
                        </div>
                    </div>
                ))}
            </div>

            {entries.length === 0 && !showModal && (
                <div className="text-center py-14 text-[#4b5563]">
                    <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><Users size={24} className="text-indigo-400" /></div></div>
                    <div className="text-[14px] font-semibold text-black mb-1">No payroll entries</div>
                    <div className="text-[13px] text-[#4b5563] mb-4">Track team member costs for this project</div>
                    {canManage && <Btn primary onClick={() => setShowModal(true)}><Plus size={15} /> Add First Entry</Btn>}
                </div>
            )}

            {/* Entries */}
            <div className="space-y-3">
                {entries.map(entry => (
                    <div key={entry.id} className={`bg-white border border-[#e5e7eb] ${entry.status === 'paid' ? 'border-l-emerald-400' : 'border-l-amber-400'} border-l-[3px] rounded-xl p-5`}>
                        <div className="flex items-start justify-between mb-1">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[14px] font-semibold text-black">{entry.team_member?.name ?? 'Unknown'}</span>
                                    <Badge status={entry.status} />
                                    <span className="text-[11px] px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-500 font-medium">{entry.pay_type}</span>
                                </div>
                                <div className="text-[12px] text-[#4b5563] mt-0.5">{entry.period}{entry.hours ? ` · ${entry.hours} hrs @ ${formatMoney(entry.rate, entryCur(entry))}/hr` : ''}</div>
                                {entry.notes && <div className="text-[12px] text-[#6b7280] italic mt-1">{entry.notes}</div>}
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-[18px] font-bold text-black">{formatMoney(entry.amount, entryCur(entry))}</div>
                                {entry.paid_date && <div className="text-[11px] text-emerald-600">Paid {fmtDate(entry.paid_date)}</div>}
                            </div>
                        </div>
                        {canManage && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f0f0f0]">
                                {entry.status === 'pending' && <Btn ghost sm onClick={() => markPaid(entry)}><Check size={13} /> Mark Paid</Btn>}
                                {entry.status === 'paid' && (
                                    <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                                        Paid {entry.paid_date ? fmtDate(entry.paid_date) : ''}
                                    </span>
                                )}
                                <div className="flex-1" />
                                <button onClick={() => openEdit(entry)} className="text-[#6b7280] hover:text-[#4f6df5] transition-colors p-1.5" title="Edit"><Pencil size={14} /></button>
                                <button onClick={() => deleteEntry(entry)} className="text-[#6b7280] hover:text-red-500 transition-colors p-1.5" title="Delete"><Trash2 size={14} /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {showModal && (
                <Modal title="Add Payroll Entry" subtitle={`For ${project.name}`} onClose={() => setShowModal(false)} footer={
                    <><Btn ghost onClick={() => setShowModal(false)}><X size={13} /> Cancel</Btn>
                    <Btn primary onClick={submit} disabled={processing || !data.team_member_id || !data.amount}><Plus size={13} /> Add Entry</Btn></>
                }>
                    <div className="space-y-4 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Team Member *">
                                <Select value={data.team_member_id} onChange={v => handleMemberSelect(v)} placeholder="Select..." clearable options={teamMembers.map(m => ({ value: m.id, label: `${m.name}${m.role ? ` — ${m.role}` : ''}` }))} />
                            </FG>
                            <FG label="Period *"><input className={inputCls} value={data.period} onChange={e => setData('period', e.target.value)} placeholder="e.g. Apr 2026, Sprint 3" /></FG>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <FG label="Pay Type">
                                <Select value={data.pay_type} onChange={v => { setData('pay_type', v); setData('amount', computeAmount(v, data.rate, data.hours)); }} options={[
                                    { value: 'monthly', label: 'Monthly' },
                                    { value: 'hourly', label: 'Hourly' },
                                    { value: 'fixed', label: 'Fixed' },
                                ]} />
                            </FG>
                            <FG label="Rate"><input className={inputCls} type="number" step="0.01" value={data.rate} onChange={e => { setData('rate', e.target.value); setData('amount', computeAmount(data.pay_type, e.target.value, data.hours)); }} placeholder="0.00" /></FG>
                            {data.pay_type === 'hourly' && (
                                <FG label="Hours"><input className={inputCls} type="number" step="0.5" value={data.hours} onChange={e => { setData('hours', e.target.value); setData('amount', computeAmount(data.pay_type, data.rate, e.target.value)); }} placeholder="0" /></FG>
                            )}
                            {data.pay_type !== 'hourly' && (
                                <FG label="Currency">
                                    <Select value={data.currency} onChange={v => { setData('currency', v); if (v === projectCurrency) setData('exchange_rate', 1); }} options={['PHP','USD','JPY','EUR','GBP','SGD','AUD'].map(c => ({ value: c, label: c }))} />
                                </FG>
                            )}
                        </div>
                        <FG label="Total Amount *">
                            <input className={`${inputCls} text-[16px] font-bold`} type="number" step="0.01" value={data.amount} onChange={e => setData('amount', e.target.value)} placeholder="0.00" />
                        </FG>
                        <FxRateRow amount={data.amount} currency={data.currency} rate={data.exchange_rate} projectCurrency={projectCurrency} onChange={v => setData('exchange_rate', v)} />
                        <FG label="Notes"><input className={inputCls} value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="e.g. April salary, overtime, bonus" /></FG>
                    </div>
                </Modal>
            )}

            {/* Edit Payroll Modal */}
            {editEntry && (
                <Modal title="Edit Payroll Entry" subtitle={editEntry.team_member?.name ?? ''} onClose={() => setEditEntry(null)} footer={
                    <><Btn ghost onClick={() => setEditEntry(null)}><X size={13} /> Cancel</Btn>
                    <Btn primary onClick={submitEdit} disabled={editForm.processing}><Save size={13} /> {editForm.processing ? 'Saving…' : 'Save Changes'}</Btn></>
                }>
                    <div className="space-y-4 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Team Member *">
                                <Select value={editForm.data.team_member_id} onChange={v => editForm.setData('team_member_id', v)} placeholder="Select..." clearable options={teamMembers.map(m => ({ value: m.id, label: `${m.name}${m.role ? ` — ${m.role}` : ''}` }))} />
                            </FG>
                            <FG label="Period *"><input className={inputCls} value={editForm.data.period} onChange={e => editForm.setData('period', e.target.value)} placeholder="e.g. Apr 2026, Sprint 3" /></FG>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <FG label="Pay Type">
                                <Select value={editForm.data.pay_type} onChange={v => { editForm.setData('pay_type', v); editForm.setData('amount', computeAmount(v, editForm.data.rate, editForm.data.hours)); }} options={[
                                    { value: 'monthly', label: 'Monthly' },
                                    { value: 'hourly', label: 'Hourly' },
                                    { value: 'fixed', label: 'Fixed' },
                                ]} />
                            </FG>
                            <FG label="Rate"><input className={inputCls} type="number" step="0.01" value={editForm.data.rate} onChange={e => { editForm.setData('rate', e.target.value); editForm.setData('amount', computeAmount(editForm.data.pay_type, e.target.value, editForm.data.hours)); }} placeholder="0.00" /></FG>
                            {editForm.data.pay_type === 'hourly' ? (
                                <FG label="Hours"><input className={inputCls} type="number" step="0.5" value={editForm.data.hours} onChange={e => { editForm.setData('hours', e.target.value); editForm.setData('amount', computeAmount(editForm.data.pay_type, editForm.data.rate, e.target.value)); }} placeholder="0" /></FG>
                            ) : (
                                <FG label="Currency">
                                    <Select value={editForm.data.currency} onChange={v => { editForm.setData('currency', v); if (v === projectCurrency) editForm.setData('exchange_rate', 1); }} options={['PHP','USD','JPY','EUR','GBP','SGD','AUD'].map(c => ({ value: c, label: c }))} />
                                </FG>
                            )}
                        </div>
                        <FG label="Total Amount *">
                            <input className={`${inputCls} text-[16px] font-bold`} type="number" step="0.01" value={editForm.data.amount} onChange={e => editForm.setData('amount', e.target.value)} placeholder="0.00" />
                        </FG>
                        <FxRateRow amount={editForm.data.amount} currency={editForm.data.currency} rate={editForm.data.exchange_rate} projectCurrency={projectCurrency} onChange={v => editForm.setData('exchange_rate', v)} />
                        <FG label="Notes"><input className={inputCls} value={editForm.data.notes} onChange={e => editForm.setData('notes', e.target.value)} placeholder="e.g. April salary, overtime, bonus" /></FG>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ── TIME TRACKING TAB ─────────────────────────────────────────────────────────
function TimeTab({ project, canManage, fmt }) {
    const confirm = useConfirm();
    const { props } = usePage();
    const teamMembers = props.teamMembers ?? [];
    const tasks = project.tasks ?? [];
    const entries = project.timeEntries ?? [];

    const [showModal, setShowModal] = useState(false);
    const [showBill, setShowBill] = useState(false);

    const totalHours = entries.reduce((s, e) => s + parseFloat(e.hours ?? 0), 0);
    const billableHours = entries.filter(e => e.billable).reduce((s, e) => s + parseFloat(e.hours ?? 0), 0);
    const unbilledHours = entries.filter(e => e.billable && !e.invoice_id).reduce((s, e) => s + parseFloat(e.hours ?? 0), 0);
    const fmtHrs = (h) => `${(+h).toLocaleString(undefined, { maximumFractionDigits: 2 })}h`;

    const today = new Date().toISOString().slice(0, 10);
    const { data, setData, post, processing, reset, errors } = useForm({
        date: today, hours: '', team_member_id: '', task_id: '', description: '', billable: true,
    });

    const submit = () => {
        post(route('projects.time.store', project.id), { onSuccess: () => { setShowModal(false); reset(); setData('date', today); } });
    };

    // ── Bill unbilled hours → draft invoice ──
    const billForm = useForm({ rate: '', date: today, due_date: '' });
    const billAmount = billForm.data.rate ? unbilledHours * parseFloat(billForm.data.rate) : 0;
    const submitBill = () => {
        billForm.post(route('projects.time.bill', project.id), {
            onSuccess: () => { setShowBill(false); billForm.reset(); billForm.setData('date', today); },
        });
    };

    const deleteEntry = async (entry) => {
        if (await confirm({ title: 'Delete this time entry?', message: `${fmtHrs(entry.hours)} logged will be removed.`, danger: true }))
            router.delete(route('projects.time.destroy', [project.id, entry.id]));
    };

    // Group entries by date for a clean timeline.
    const byDate = entries.reduce((acc, e) => { (acc[e.date] ??= []).push(e); return acc; }, {});
    const dates = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a));

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Time Tracking</h3>
                {canManage && (
                    <div className="flex items-center gap-2">
                        {unbilledHours > 0 && <Btn ghost sm onClick={() => setShowBill(true)}><Receipt size={13} /> Bill {fmtHrs(unbilledHours)}</Btn>}
                        <Btn primary sm onClick={() => setShowModal(true)}><Plus size={13} /> Log Time</Btn>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                    { l: 'Total Hours', v: fmtHrs(totalHours), icon: <Clock size={16} />, bg: 'bg-indigo-50 border-indigo-100', iconC: 'text-indigo-500', textC: 'text-indigo-700' },
                    { l: 'Billable Hours', v: fmtHrs(billableHours), icon: <CircleDollarSign size={16} />, bg: 'bg-emerald-50 border-emerald-100', iconC: 'text-emerald-500', textC: 'text-emerald-700' },
                ].map(({ l, v, icon, bg, iconC, textC }) => (
                    <div key={l} className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
                        <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center ${iconC} shadow-sm`}>{icon}</div>
                        <div>
                            <div className="text-[10px] tracking-[1.5px] uppercase text-[#4b5563] font-medium">{l}</div>
                            <div className={`text-[20px] font-bold ${textC} leading-tight`}>{v}</div>
                        </div>
                    </div>
                ))}
            </div>

            {entries.length === 0 && !showModal && (
                <div className="text-center py-14 text-[#4b5563]">
                    <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><Clock size={24} className="text-indigo-400" /></div></div>
                    <div className="text-[14px] font-semibold text-black mb-1">No time logged yet</div>
                    <div className="text-[13px] text-[#4b5563] mb-4">Track hours worked on this project</div>
                    {canManage && <Btn primary onClick={() => setShowModal(true)}><Plus size={15} /> Log First Entry</Btn>}
                </div>
            )}

            {/* Entries grouped by date */}
            <div className="space-y-5">
                {dates.map(date => {
                    const dayHours = byDate[date].reduce((s, e) => s + parseFloat(e.hours ?? 0), 0);
                    return (
                        <div key={date}>
                            <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-[11px] tracking-[1px] uppercase text-[#4b5563] font-semibold">{fmtDate(date)}</span>
                                <span className="text-[11px] text-[#6b7280] font-medium">{fmtHrs(dayHours)}</span>
                            </div>
                            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                                {byDate[date].map(entry => (
                                    <div key={entry.id} className="group flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-[#4f6df5] flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                                            {fmtHrs(entry.hours)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-black truncate">
                                                {entry.description || entry.task?.title || 'Time entry'}
                                            </div>
                                            <div className="text-[11px] text-[#6b7280] flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                {entry.team_member?.name && <span>{entry.team_member.name}</span>}
                                                {entry.task?.title && <><span>·</span><span className="truncate">{entry.task.title}</span></>}
                                            </div>
                                        </div>
                                        {entry.invoice_id
                                            ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex-shrink-0">Billed</span>
                                            : entry.billable
                                                ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0">Billable</span>
                                                : <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 flex-shrink-0">Non-billable</span>}
                                        {canManage && (
                                            <button onClick={() => deleteEntry(entry)} className="text-[#6b7280] hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 flex-shrink-0" title="Delete"><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Log Time Modal */}
            {showModal && (
                <Modal title="Log Time" subtitle={`For ${project.name}`} onClose={() => setShowModal(false)} footer={
                    <><Btn ghost onClick={() => setShowModal(false)}><X size={13} /> Cancel</Btn>
                    <Btn primary onClick={submit} disabled={processing || !data.hours}><Save size={13} /> Log Time</Btn></>
                }>
                    <div className="space-y-4 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Date *" error={errors.date}>
                                <input type="date" className={inputCls} value={data.date} onChange={e => setData('date', e.target.value)} />
                            </FG>
                            <FG label="Hours *" error={errors.hours}>
                                <input type="number" step="0.25" min="0" max="24" className={inputCls} value={data.hours} onChange={e => setData('hours', e.target.value)} placeholder="e.g. 2.5" />
                            </FG>
                        </div>
                        <FG label="Team Member" error={errors.team_member_id}>
                            <Select
                                value={data.team_member_id}
                                onChange={v => setData('team_member_id', v)}
                                options={teamMembers.map(m => ({ value: m.id, label: m.name }))}
                                placeholder="Select team member…"
                                clearable
                            />
                        </FG>
                        <FG label="Task (optional)" error={errors.task_id}>
                            <Select
                                value={data.task_id}
                                onChange={v => setData('task_id', v)}
                                options={tasks.map(t => ({ value: t.id, label: t.title }))}
                                placeholder="No specific task"
                                clearable
                            />
                        </FG>
                        <FG label="Description" error={errors.description}>
                            <input className={inputCls} value={data.description} onChange={e => setData('description', e.target.value)} placeholder="What did you work on?" />
                        </FG>
                        <button
                            type="button"
                            onClick={() => setData('billable', !data.billable)}
                            className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${data.billable ? 'border-[#4f6df5]/30 bg-indigo-50/40' : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'}`}
                        >
                            <span className="flex items-center gap-2.5 min-w-0">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${data.billable ? 'bg-[#4f6df5] text-white' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                                    <CircleDollarSign size={15} />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[13px] font-medium text-black">Billable hours</span>
                                    <span className="block text-[11px] text-[#6b7280]">{data.billable ? 'Counted toward client billing' : "Won't be billed to the client"}</span>
                                </span>
                            </span>
                            <span className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-all ${data.billable ? 'bg-[#4f6df5]' : 'bg-[#d1d5db]'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${data.billable ? 'left-[22px]' : 'left-0.5'}`} />
                            </span>
                        </button>
                    </div>
                </Modal>
            )}

            {/* Bill Hours Modal */}
            {showBill && (
                <Modal title="Bill Hours" subtitle={`Create a draft invoice from ${fmtHrs(unbilledHours)} unbilled`} onClose={() => setShowBill(false)} footer={
                    <><Btn ghost onClick={() => setShowBill(false)}><X size={13} /> Cancel</Btn>
                    <Btn primary onClick={submitBill} disabled={billForm.processing || !billForm.data.rate}><Receipt size={13} /> Create Invoice</Btn></>
                }>
                    <div className="space-y-4 pb-2">
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] uppercase tracking-[1px] text-[#4b5563] font-medium">Unbilled hours</div>
                                <div className="text-[22px] font-bold text-indigo-700 leading-tight">{fmtHrs(unbilledHours)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[11px] uppercase tracking-[1px] text-[#4b5563] font-medium">Invoice total</div>
                                <div className="text-[22px] font-bold text-black leading-tight">{fmt(billAmount)}</div>
                            </div>
                        </div>
                        <FG label="Hourly rate *" error={billForm.errors.rate}>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-[13px]">{getCurrency(project.currency ?? 'USD').symbol}</span>
                                <input type="number" step="0.01" min="0" className={`${inputCls} pl-8`} value={billForm.data.rate} onChange={e => billForm.setData('rate', e.target.value)} placeholder="e.g. 80" autoFocus />
                            </div>
                        </FG>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Invoice date *" error={billForm.errors.date}>
                                <input type="date" className={inputCls} value={billForm.data.date} onChange={e => billForm.setData('date', e.target.value)} />
                            </FG>
                            <FG label="Due date" error={billForm.errors.due_date}>
                                <input type="date" className={inputCls} value={billForm.data.due_date} onChange={e => billForm.setData('due_date', e.target.value)} />
                            </FG>
                        </div>
                        <p className="text-[11px] text-[#6b7280] leading-relaxed">
                            Billable hours not yet invoiced are grouped into one line per task. The draft invoice opens under the Invoices tab, where you can review and send it.
                        </p>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ── PAGES TAB ────────────────────────────────────────────────────────────────
function PagesTab({ project, canManage }) {
    const confirm = useConfirm();
    const [showEditor, setShowEditor] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [copied, setCopied] = useState(null);
    const [docModal, setDocModal] = useState(null); // page id
    const [previewDoc, setPreviewDoc] = useState(null);
    const [renaming, setRenaming] = useState(null); // page being renamed (HTML pages)
    const pages = project.pages ?? [];

    const { data, setData, post, put, processing, reset, errors } = useForm({ title: '', content: '' });

    // Title-only edit for full-HTML pages — leaves the imported markup untouched.
    const renameForm = useForm({ title: '' });
    const openRename = (page) => { renameForm.setData('title', page.title); setRenaming(page); };
    const submitRename = () => {
        renameForm.put(route('projects.pages.update', [project.id, renaming.id]), {
            onSuccess: () => setRenaming(null),
        });
    };

    const docForm = useForm({ name: '', type: 'other', file: null, page_id: null });
    const submitDoc = () => {
        docForm.post(route('projects.documents.store', project.id), {
            forceFormData: true,
            onSuccess: () => { setDocModal(null); docForm.reset(); },
        });
    };
    const deletePageDoc = async (doc) => {
        if (await confirm({ title: 'Delete this document?', message: 'This file will be permanently removed.', danger: true })) {
            router.delete(route('projects.documents.destroy', [project.id, doc.id]));
        }
    };

    const openNew = () => { setEditingPage(null); reset(); setShowEditor(true); };
    const openEdit = (page) => { setEditingPage(page); setData({ title: page.title, content: page.content ?? '' }); setShowEditor(true); };

    const importHtmlFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const html = ev.target.result;
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1] : file.name.replace(/\.html?$/i, '');
            // Case-insensitive: catches <!doctype html>, <html lang="…">, etc.
            const isFullDoc = /<!doctype\s+html|<html[\s>]/i.test(html);
            // A styled fragment (has its own CSS / inline styles) is a design, not rich text —
            // preserve it verbatim instead of letting the editor strip tags & styles.
            const isStyled = /<style[\s>]|style\s*=/i.test(html);
            setEditingPage(null);
            if (isFullDoc) {
                // Full document — save raw, skip the editor.
                setData({ title, content: html });
                router.post(route('projects.pages.store', project.id), { title, content: html });
            } else if (isStyled) {
                // Styled fragment — wrap in a minimal standalone shell so it renders on its own.
                const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1]?.trim() ?? html;
                const content = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</html>`;
                setData({ title, content });
                router.post(route('projects.pages.store', project.id), { title, content });
            } else {
                // Plain fragment — edit as rich text.
                const content = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1]?.trim() ?? html;
                setData({ title, content });
                setShowEditor(true);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // Import a multi-page mockup (.zip). The server extracts it and serves it as a
    // self-contained mini-site, so internal links between pages keep working.
    const importMockup = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        // Mirror the server-side validation cap (500MB) so oversized archives get a
        // clear message instead of a silent redirect.
        if (file.size > 500 * 1024 * 1024) {
            alert('That mockup is larger than 500MB. Please reduce the archive size and try again.');
            return;
        }
        const title = file.name.replace(/\.zip$/i, '');
        router.post(route('projects.pages.import-mockup', project.id), { title, file }, {
            forceFormData: true,
            onError: (errors) => alert(errors.file || 'Could not import the mockup. Please try again.'),
        });
    };

    const submit = () => {
        if (editingPage) {
            put(route('projects.pages.update', [project.id, editingPage.id]), { onSuccess: () => { setShowEditor(false); setEditingPage(null); } });
        } else {
            post(route('projects.pages.store', project.id), { onSuccess: () => { setShowEditor(false); reset(); } });
        }
    };

    const deletePage = async (page) => {
        if (await confirm({ title: `Delete "${page.title}"?`, message: 'This page will be permanently removed.', danger: true })) {
            router.delete(route('projects.pages.destroy', [project.id, page.id]));
        }
    };

    const toggleShare = (page) => {
        router.patch(route('projects.pages.toggle-share', [project.id, page.id]));
    };

    const copyLink = (page) => {
        navigator.clipboard.writeText(`${window.location.origin}/page/${page.share_code}`);
        setCopied(page.id);
        setTimeout(() => setCopied(null), 2000);
    };

    const [fbReplyId, setFbReplyId] = useState(null);
    const [fbReplyText, setFbReplyText] = useState('');
    const submitReply = (page, fb) => {
        if (!fbReplyText.trim()) return;
        router.post(route('projects.pages.feedback.reply', [project.id, page.id, fb.id]), { body: fbReplyText.replace(/\n/g, '<br>') }, {
            preserveScroll: true,
            onSuccess: () => { setFbReplyId(null); setFbReplyText(''); },
        });
    };
    const feedbackPageLabel = (p) => {
        if (!p) return '';
        const seg = p.split('?')[0].split('#')[0].replace(/\/+$/, '').split('/').filter(Boolean).pop() || '';
        if (!seg || seg.toLowerCase() === 'index.html' || /^[a-f0-9]{12}$/.test(seg)) return 'Home';
        try { return decodeURIComponent(seg); } catch (e) { return seg; }
    };
    const resolveFeedback = (page, fb) => {
        router.patch(route('projects.pages.feedback.resolve', [project.id, page.id, fb.id]), {}, { preserveScroll: true });
    };
    const deleteFeedback = async (page, fb) => {
        if (await confirm({ title: 'Delete this feedback?', message: 'This comment will be permanently removed.', danger: true })) {
            router.delete(route('projects.pages.feedback.destroy', [project.id, page.id, fb.id]), { preserveScroll: true });
        }
    };
    const renderFeedbackItem = (page, fb, isReply) => {
        const replies = (page.feedback ?? []).filter(x => x.parent_id === fb.id);
        return (
            <div key={fb.id} className={`bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-2.5 py-2 ${fb.resolved_at ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-semibold text-[#374151]">{fb.author_name || 'Anonymous'}</span>
                    {fb.is_admin && <span className="text-[9px] font-bold text-[#4f6df5] bg-[#eef1fe] rounded px-1.5 py-0.5">Team</span>}
                    <span className="text-[9px] text-[#9aa1ad]">#{fb.id}</span>
                    <span className="text-[9px] text-[#6b7280]">{fb.created_at && new Date(fb.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    {fb.updated_at && fb.updated_at !== fb.created_at && <span className="text-[9px] italic text-[#9aa1ad]">edited</span>}
                    {fb.resolved_at && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-medium">Resolved</span>}
                    <div className="flex-1" />
                    {canManage && (
                        <>
                            <button onClick={() => resolveFeedback(page, fb)} title={fb.resolved_at ? 'Reopen' : 'Resolve'} className="text-[#6b7280] hover:text-emerald-500 transition-colors"><CheckCircle size={12} /></button>
                            <button onClick={() => deleteFeedback(page, fb)} title="Delete" className="text-[#6b7280] hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                        </>
                    )}
                </div>
                {!isReply && feedbackPageLabel(fb.page_path) && (
                    <div className="inline-flex items-center gap-1 font-mono text-[9px] text-[#6b7280] bg-gray-100 rounded px-1.5 py-0.5 mb-0.5 max-w-full truncate">
                        <FileText size={9} /> {feedbackPageLabel(fb.page_path)}
                    </div>
                )}
                {fb.title && <div className="text-[11px] font-semibold text-[#4f6df5] mb-0.5">{fb.title}</div>}
                <div className="pf-body text-[11px] text-[#4b5563] break-words" dangerouslySetInnerHTML={{ __html: fb.body }} />
                {replies.length > 0 && (
                    <div className="mt-1.5 pl-2.5 border-l-2 border-[#e5e7eb] space-y-1.5">
                        {replies.map(r => renderFeedbackItem(page, r, true))}
                    </div>
                )}
                {canManage && (
                    fbReplyId === fb.id ? (
                        <div className="mt-2">
                            <textarea value={fbReplyText} onChange={e => setFbReplyText(e.target.value)} autoFocus placeholder="Write a reply…" rows={3} className="w-full border border-[#d1d5db] rounded-lg px-2.5 py-1.5 text-[11px] resize-y" />
                            <div className="flex gap-1.5 mt-1">
                                <button onClick={() => submitReply(page, fb)} className="px-3 py-1 rounded-md bg-[#4f6df5] text-white text-[11px] font-semibold">Reply</button>
                                <button onClick={() => { setFbReplyId(null); setFbReplyText(''); }} className="px-3 py-1 rounded-md border border-[#d1d5db] text-[#374151] text-[11px] font-semibold">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => { setFbReplyText(''); setFbReplyId(fb.id); }} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#4f6df5]">
                            <CornerDownRight size={11} /> Reply
                        </button>
                    )
                )}
            </div>
        );
    };

    return (
        <>
            <style>{`.pf-body ul{list-style:disc;padding-left:18px;margin:2px 0}.pf-body ol{list-style:decimal;padding-left:18px;margin:2px 0}.pf-body p{margin:2px 0}`}</style>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Pages</h3>
                {canManage && (
                    <div className="flex gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#374151] border border-[#d1d5db] hover:bg-gray-100 cursor-pointer transition-all">
                            <Upload size={13} /> Import HTML
                            <input type="file" accept=".html,.htm" className="hidden" onChange={importHtmlFile} />
                        </label>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#374151] border border-[#d1d5db] hover:bg-gray-100 cursor-pointer transition-all">
                            <Package size={13} /> Import Mockup
                            <input type="file" accept=".zip" className="hidden" onChange={importMockup} />
                        </label>
                        <Btn primary sm onClick={openNew}><Plus size={13} /> New Page</Btn>
                    </div>
                )}
            </div>

            {pages.length === 0 && !showEditor && (
                <div className="text-center py-14 text-[#4b5563]">
                    <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><FileText size={24} className="text-indigo-400" /></div></div>
                    <div className="text-[14px] font-semibold text-black mb-1">No pages yet</div>
                    <div className="text-[13px] text-[#4b5563] mb-4">Create pages to share meeting notes, specs, or updates</div>
                    {canManage && <Btn primary onClick={openNew}><Plus size={15} /> Create First Page</Btn>}
                </div>
            )}

            {/* Page list */}
            {!showEditor && pages.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    {pages.map(page => {
                        const isMockup = !!page.mockup_path;
                        const isHtml = isMockup || /<!doctype\s+html|<html[\s>]/i.test(page.content ?? '');
                        return (
                            <div key={page.id} className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden hover:shadow-md hover:border-[#4f6df5]/30 transition-all group">
                                {/* Preview bar */}
                                <div className={`h-1.5 ${isHtml ? 'bg-gradient-to-r from-violet-500 to-indigo-500' : 'bg-gradient-to-r from-[#4f6df5] to-[#6380f7]'}`} />

                                <div className="p-5">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isHtml ? 'bg-violet-50 text-violet-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                            {isMockup ? <Package size={18} /> : isHtml ? <Code size={18} /> : <FileText size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[14px] font-bold text-black group-hover:text-[#4f6df5] transition-colors truncate">{page.title}</div>
                                            <div className="text-[11px] text-[#6b7280] mt-0.5 flex items-center gap-1.5">
                                                {page.creator?.name && <span>{page.creator.name}</span>}
                                                {page.updated_at && <span>· {new Date(page.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                                {isMockup
                                                    ? <span className="text-[9px] px-1.5 py-0.5 bg-violet-50 text-violet-500 rounded font-medium">MOCKUP</span>
                                                    : isHtml && <span className="text-[9px] px-1.5 py-0.5 bg-violet-50 text-violet-500 rounded font-medium">HTML</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content preview */}
                                    {page.content && !isHtml && (
                                        <div className="text-[12px] text-[#4b5563] line-clamp-2 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: page.content.replace(/<[^>]*>/g, ' ').slice(0, 150) }} />
                                    )}
                                    {isHtml && (
                                        <div className="text-[12px] text-[#4b5563] mb-3 bg-[#fafbfc] rounded-lg px-3 py-2 border border-[#f0f0f0] font-mono line-clamp-2">
                                            {isMockup ? `Interactive mockup · entry: ${page.entry_file ?? 'index.html'}` : 'Full HTML document with styles'}
                                        </div>
                                    )}

                                    {/* Share link */}
                                    {page.is_shared && page.share_code && (
                                        <div className="flex items-center gap-2 mb-3 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                                            <div className="text-[11px] text-[#4f6df5] font-mono flex-1 truncate">/page/{page.share_code}</div>
                                            <button onClick={() => copyLink(page)} className="text-[11px] text-[#4f6df5] font-medium flex-shrink-0">
                                                {copied === page.id ? '✓ Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Page Documents */}
                                    {(page.documents ?? []).length > 0 && (
                                        <div className="mb-3">
                                            <div className="text-[10px] tracking-[1.2px] uppercase text-[#6b7280] font-medium mb-1.5">Attached Documents</div>
                                            <div className="space-y-1">
                                                {page.documents.map(doc => (
                                                    <div key={doc.id} className="flex items-center gap-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-2.5 py-1.5">
                                                        <span className="text-[13px]">{DOC_ICONS[doc.type] ?? '📁'}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[11px] font-medium text-black truncate">{doc.name}</div>
                                                            <div className="text-[9px] text-[#6b7280]">{doc.uploader?.name ?? 'Team'} · {doc.file_size ?? ''}</div>
                                                        </div>
                                                        <button onClick={() => setPreviewDoc(doc)} className="text-[#4b5563] hover:text-[#4f6df5] transition-colors"><Eye size={12} /></button>
                                                        <a href={`/documents/${doc.id}/download`} className="text-[#4b5563] hover:text-black transition-colors"><Download size={12} /></a>
                                                        {canManage && <button onClick={() => deletePageDoc(doc)} className="text-[#6b7280] hover:text-red-400 transition-colors"><Trash2 size={12} /></button>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Client Feedback */}
                                    {(page.feedback ?? []).length > 0 && (
                                        <div className="mb-3">
                                            <div className="text-[10px] tracking-[1.2px] uppercase text-[#6b7280] font-medium mb-1.5 flex items-center gap-1.5">
                                                <MessageSquare size={11} /> Client Feedback · {page.feedback.length}
                                            </div>
                                            <div className="space-y-1.5">
                                                {page.feedback.filter(fb => !fb.parent_id).map(fb => renderFeedbackItem(page, fb, false))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 pt-3 border-t border-[#f0f0f0]">
                                        {page.is_shared && page.share_code && (
                                            <a href={`/page/${page.share_code}`} target="_blank" className="inline-flex items-center gap-1 text-[12px] text-[#4f6df5] font-medium hover:text-[#6380f7]">
                                                <Eye size={13} /> View
                                            </a>
                                        )}
                                        <div className="flex-1" />
                                        {canManage && (
                                            <>
                                                <Btn ghost sm onClick={() => { docForm.setData('page_id', page.id); setDocModal(page.id); }}>
                                                    <Upload size={12} /> Attach
                                                </Btn>
                                                <Btn ghost sm onClick={() => toggleShare(page)}>
                                                    {page.is_shared ? <><Lock size={12} /> Shared</> : 'Share'}
                                                </Btn>
                                                <Btn ghost sm onClick={() => isHtml ? openRename(page) : openEdit(page)}><Pencil size={13} /></Btn>
                                                <button onClick={() => deletePage(page)} className="text-[#6b7280] hover:text-red-500 transition-colors p-1.5"><Trash2 size={14} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Editor */}
            {showEditor && (
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
                    <div className="mb-4">
                        <FG label="Page Title" error={errors.title}>
                            <input className={inputCls} value={data.title} onChange={e => setData('title', e.target.value)} placeholder="e.g. Meeting Notes — March 31" autoFocus />
                        </FG>
                    </div>
                    <Suspense fallback={<div className="text-[13px] text-[#4b5563] p-4">Loading editor…</div>}>
                        <RichEditor content={data.content} onChange={val => setData('content', val)} placeholder="Write your page content…" projectId={project.id} />
                    </Suspense>
                    <div className="flex justify-end gap-2 mt-4">
                        <Btn ghost onClick={() => { setShowEditor(false); setEditingPage(null); }}><X size={13} /> Cancel</Btn>
                        <Btn primary onClick={submit} disabled={processing || !data.title}>
                            <Save size={13} /> {processing ? 'Saving…' : editingPage ? 'Update Page' : 'Create Page'}
                        </Btn>
                    </div>
                </div>
            )}

            {/* Attach Document to Page Modal */}
            {docModal && (
                <Modal title="Attach Document" subtitle={`To page: ${pages.find(p => p.id === docModal)?.title ?? ''}`} onClose={() => { setDocModal(null); docForm.reset(); }} footer={<><Btn ghost onClick={() => { setDocModal(null); docForm.reset(); }}>Cancel</Btn><Btn primary onClick={submitDoc} disabled={docForm.processing}>{docForm.processing ? 'Uploading…' : 'Upload Document'}</Btn></>}>
                    <div className="space-y-4 pb-2">
                        <FG label="Document Name *"><input className={inputCls} value={docForm.data.name} onChange={e => docForm.setData('name', e.target.value)} placeholder="e.g. Meeting Notes PDF, Design Specs" /></FG>
                        <FG label="Document Type">
                            <Select value={docForm.data.type} onChange={v => docForm.setData('type', v)} options={['contract','brief','report','asset','other'].map(t => ({ value: t, label: t.charAt(0).toUpperCase()+t.slice(1) }))} />
                        </FG>
                        <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center text-[#4b5563]">
                            <input type="file" onChange={e => docForm.setData('file', e.target.files[0])} className="hidden" id="page-file-upload" />
                            <label htmlFor="page-file-upload" className="cursor-pointer">
                                <div className="text-3xl mb-2">📎</div>
                                <div className="text-[13px]">{docForm.data.file ? docForm.data.file.name : 'Click to upload or drag & drop'}</div>
                                <div className="text-[11px] mt-1">PDF, DOCX, PNG, ZIP — up to 100MB</div>
                            </label>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Rename Page Modal (HTML pages — title only, content preserved) */}
            {renaming && (
                <Modal title="Rename Page" subtitle="The imported HTML content stays unchanged." onClose={() => setRenaming(null)} footer={<><Btn ghost onClick={() => setRenaming(null)}>Cancel</Btn><Btn primary onClick={submitRename} disabled={renameForm.processing || !renameForm.data.title}>{renameForm.processing ? 'Saving…' : 'Save Title'}</Btn></>}>
                    <div className="pb-2">
                        <FG label="Page Title" error={renameForm.errors.title}>
                            <input className={inputCls} value={renameForm.data.title} onChange={e => renameForm.setData('title', e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && renameForm.data.title) submitRename(); }} autoFocus />
                        </FG>
                    </div>
                </Modal>
            )}

            <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        </>
    );
}

function ActivityTab({ activities = [] }) {
    const rel = (s) => {
        if (!s) return '';
        const d = new Date(s);
        const diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const dotColor = { created: 'bg-emerald-400', updated: 'bg-indigo-400', deleted: 'bg-red-400' };

    return (
        <>
            <h3 className="text-[17px] font-bold mb-5">Activity</h3>
            {activities.length === 0 ? (
                <div className="text-center py-14 text-[#4b5563]">
                    <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><Clock size={24} className="text-indigo-400" /></div></div>
                    <div className="text-[14px] font-semibold text-black mb-1">No activity yet</div>
                    <div className="text-[13px] text-[#4b5563]">Changes to tasks, invoices, proposals and more will show up here.</div>
                </div>
            ) : (
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
                    {activities.map(a => (
                        <div key={a.id} className="flex gap-3 pb-4 last:pb-0">
                            <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor[a.event] ?? 'bg-gray-300'}`} />
                            <div className="flex-1 min-w-0 border-b border-[#f0f0f0] pb-3 last:border-b-0">
                                <div className="text-[13px] text-black">{a.description}</div>
                                <div className="text-[11px] text-[#6b7280] mt-0.5">{a.user?.name ?? a.causer_name ?? 'System'} · {rel(a.created_at)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

// ── MAIN SHOW PAGE ─────────────────────────────────────────────────────────────
export default function Show({ project, canManage, taskCategories = [], activities = [], nextInvoiceNumber, nextProposalNumber, paymentDefaults = {} }) {
    // Keep the active tab in the URL (?tab=…) so a refresh, bookmark, or shared
    // link lands on the same tab. We read it from Inertia's page URL, which is
    // identical on the server and client (unlike window.location.hash).
    const validTabs = ['overview','proposal','invoices','meetings','documents','timeline','tasks','bills','payroll','time','pages','activity'];
    const { url } = usePage();
    const urlTab = new URLSearchParams(url.split('?')[1] ?? '').get('tab');
    const [tab, setTabState] = useState(validTabs.includes(urlTab) ? urlTab : 'overview');
    const setTab = (t) => {
        setTabState(t);
        const u = new URL(window.location.href);
        u.searchParams.set('tab', t);
        window.history.replaceState(null, '', u);
    };
    const projectCur = getCurrency(project.currency ?? 'USD');
    const fmt = (n) => formatMoney(n, projectCur.code);

    const tabs = [
        { id: 'overview',   label: 'Overview',  icon: <Eye size={15} /> },
        { id: 'proposal',   label: 'Proposal',  icon: <FileText size={15} />,     count: project.proposals?.length ?? 0 },
        { id: 'invoices',   label: 'Invoices',  icon: <Receipt size={15} />,      count: project.invoices?.length ?? 0 },
        { id: 'meetings',   label: 'Meetings',  icon: <CalendarDays size={15} />, count: project.meetings?.length ?? 0 },
        { id: 'documents',  label: 'Documents', icon: <FolderOpen size={15} />,   count: project.documents?.length ?? 0 },
        { id: 'timeline',   label: 'Timeline',  icon: <Clock size={15} /> },
        { id: 'tasks',      label: 'Tasks',     icon: <ListChecks size={15} />,   count: project.tasks?.length ?? 0 },
        { id: 'bills',      label: 'Bills',     icon: <Receipt size={15} />,      count: project.bills?.length ?? 0 },
        { id: 'payroll',    label: 'Payroll',   icon: <Users size={15} />,        count: project.payroll?.length ?? 0 },
        { id: 'time',       label: 'Time',      icon: <Clock size={15} />,        count: project.timeEntries?.length ?? 0 },
        { id: 'pages',      label: 'Pages',     icon: <FileText size={15} />,      count: project.pages?.length ?? 0 },
        { id: 'activity',   label: 'Activity',  icon: <Clock size={15} /> },
    ];

    return (
        <AppLayout
            title={project.name}
            breadcrumbs={[
                { label: 'Projects', href: route('projects.index') },
                { label: project.name },
            ]}
        >
            <Head title={project.name} />

            {/* Tab Bar */}
            <div className="-mx-4 md:-mx-8 px-4 md:px-8 mb-7 overflow-x-auto no-scrollbar">
                <div className="inline-flex items-center gap-1 p-1 bg-[#f3f4f6] border border-[#e5e7eb] rounded-xl min-w-max">
                    {tabs.map(t => {
                        const active = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-1.5 px-3 md:px-3.5 py-2 rounded-lg text-[12px] md:text-[13px] font-semibold whitespace-nowrap transition-all
                                    ${active
                                        ? 'bg-white text-[#4f6df5] shadow-[0_1px_3px_rgba(17,24,39,0.08)]'
                                        : 'text-[#1f2937] hover:text-black hover:bg-white/60'
                                    }`}
                            >
                                <span className={active ? 'text-[#4f6df5]' : 'text-[#374151]'}>{t.icon}</span>
                                {t.label}
                                {t.count !== undefined && (
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center
                                        ${active ? 'bg-[#4f6df5]/12 text-[#4f6df5]' : 'bg-[#e5e7eb] text-[#374151]'}`}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            {tab === 'overview'  && <OverviewTab  project={project} canManage={canManage} fmt={fmt} />}
            {tab === 'proposal'  && <ProposalTab  project={project} canManage={canManage} nextNumber={nextProposalNumber} fmt={fmt} />}
            {tab === 'invoices'  && <InvoicesTab  project={project} canManage={canManage} nextNumber={nextInvoiceNumber} paymentDefaults={paymentDefaults} fmt={fmt} />}
            {tab === 'meetings'  && <MeetingsTab  project={project} canManage={canManage} />}
            {tab === 'documents' && <DocumentsTab project={project} canManage={canManage} />}
            {tab === 'timeline'  && <TimelineTab  project={project} />}
            {tab === 'tasks'     && <TasksTab     project={project} canManage={canManage} taskCategories={taskCategories} />}
            {tab === 'bills'     && <BillsTab     project={project} canManage={canManage} fmt={fmt} />}
            {tab === 'payroll'   && <PayrollTab   project={project} canManage={canManage} fmt={fmt} />}
            {tab === 'time'      && <TimeTab      project={project} canManage={canManage} fmt={fmt} />}
            {tab === 'pages'     && <PagesTab     project={project} canManage={canManage} />}
            {tab === 'activity'  && <ActivityTab  activities={activities} />}
        </AppLayout>
    );
}
