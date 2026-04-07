import { useState, lazy, Suspense } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';
import currencies from '@/Utils/currencies';
import {
    Pencil, Eye, Plus, Save, X, Check, Send, ChevronUp, ChevronDown,
    FileText, Receipt, CalendarDays, Calendar, FolderOpen, Clock, ListChecks,
    Trash2, Download, Upload, CheckCircle, XCircle, AlertCircle, Lock, Code, Users, Maximize2, Minimize2,
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
                        {subtitle && <div className="text-[12px] text-[#6b7280] mt-1">{subtitle}</div>}
                    </div>
                    <button onClick={onClose} className="text-[#6b7280] hover:text-black text-[22px] leading-none transition-colors">×</button>
                </div>
                <div className="px-4 md:px-6 pb-2 overflow-y-auto flex-1">{children}</div>
                {footer && <div className="flex justify-end gap-2.5 p-4 md:p-6 pt-3 md:pt-4 flex-shrink-0">{footer}</div>}
            </div>
        </div>
    );
}

// ── Shared form field ─────────────────────────────────────────────────────────
const FG = ({ label, error, children }) => (
    <div>
        {label && <label className="block text-[10px] tracking-[1.2px] uppercase text-[#6b7280] font-medium mb-2">{label}</label>}
        {children}
        {error && <p className="text-red-400 text-[12px] mt-1">{error}</p>}
    </div>
);
const inputCls = 'w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[13px] text-black outline-none focus:border-[#4f6df5] transition-colors';
const Btn = ({ children, primary, ghost, danger, sm, onClick, type = 'button', disabled }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all disabled:opacity-60 whitespace-nowrap
            ${sm ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2.5 text-[13px]'}
            ${primary ? 'bg-[#4f6df5] hover:bg-[#6380f7] text-white' : ''}
            ${ghost  ? 'bg-transparent text-[#4b5563] border border-[#d1d5db] hover:bg-gray-100 hover:text-black' : ''}
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

    return (
        <div>
            {/* Hero */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 mb-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="font-serif text-[28px] font-semibold text-black leading-snug">{project.name}</h2>
                        <p className="text-[14px] text-[#6b7280] mt-1">
                            {project.client} · {project.contact_name}
                            {project.lead && <span> · Lead: <span className="text-[#4f6df5] font-medium">{project.lead.name}</span></span>}
                        </p>
                        <div className="flex gap-2 flex-wrap mt-2.5">
                            <Badge status={project.status} />
                            <span className="text-[11px] px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-600 font-medium">{project.phase}</span>
                            {(project.tags ?? []).map(t => <span key={t} className="text-[11px] px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-600 font-medium">{t}</span>)}
                        </div>
                    </div>
                    {canManage && (
                        <div className="flex gap-2">
                            <Btn ghost sm onClick={() => setShowProgressModal(true)}><Pencil size={13} /> Progress</Btn>
                            <Btn ghost sm onClick={() => setShowEditModal(true)}><Pencil size={13} /> Edit Project</Btn>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className={`grid grid-cols-2 ${project.launch_date ? 'md:grid-cols-5' : 'md:grid-cols-4'} border-t border-[#e5e7eb] pt-4 gap-0`}>
                    {[
                        { label: 'Progress', value: `${project.progress}%` },
                        { label: 'Budget', value: `${fmt(project.spent)} / ${fmt(project.budget)}` },
                        { label: 'Timeline', value: `${fmtDate(project.start_date)} – ${fmtDate(project.end_date)}` },
                        { label: 'Phase', value: project.phase },
                        ...(project.launch_date ? [{ label: '🚀 Launch', value: fmtDate(project.launch_date), highlight: true }] : []),
                    ].map((s, i, arr) => (
                        <div key={i} className={`text-center py-1 ${i < arr.length - 1 ? 'border-r border-[#e5e7eb]' : ''}`}>
                            <div className={`text-[16px] font-medium ${s.highlight ? 'text-[#4f6df5] font-bold' : 'text-black'}`}>{s.value}</div>
                            <div className="text-[11px] text-[#6b7280] mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                    <div className="flex justify-between text-[12px] text-[#6b7280] mb-2"><span>Overall Progress</span><span>{project.progress}%</span></div>
                    <div className="h-2 bg-[#d1d5db] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#4f6df5] to-[#6380f7] progress-fill" style={{ width: `${project.progress}%` }} />
                    </div>
                </div>
            </div>

            {/* Team / Contractors */}
            <TeamSection project={project} canManage={canManage} />

            {/* Client Access */}
            <ClientAccessSection project={project} canManage={canManage} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                    {/* Description */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Project Description</span></div>
                        <div className="px-5 py-4 text-[13.5px] text-[#4b5563] leading-relaxed">{project.description ?? '—'}</div>
                    </div>

                    {/* Client Info */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Client Information</span></div>
                        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { l: 'Contact', v: project.contact_name },
                                { l: 'Email', v: project.contact_email, gold: true },
                                { l: 'Phone', v: project.contact_phone },
                                { l: 'Company', v: project.client },
                            ].map(({ l, v, gold }) => (
                                <div key={l}>
                                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#6b7280] mb-1">{l}</div>
                                    <div className={`text-[13.5px] ${gold ? 'text-[#4f6df5]' : 'text-black'}`}>{v ?? '—'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Financial */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Financial Overview</span></div>
                        <div className="px-5 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                {[
                                    { l: 'Project Budget', v: fmt(project.budget), serif: true },
                                    { l: 'Spent (Bills)', v: fmt(project.spent), serif: true, warn: budgetPct > 90 },
                                    { l: 'Billed to Client', v: fmt(project.total_billed) },
                                    { l: 'Received', v: fmt(project.total_paid), green: true },
                                    { l: 'Vendor Bills', v: fmt(project.total_bills) },
                                    { l: 'Bills Paid', v: fmt(project.total_bills_paid), green: true },
                                ].map(({ l, v, serif, warn, green }) => (
                                    <div key={l}>
                                        <div className="text-[10px] tracking-[1.5px] uppercase text-[#6b7280] mb-1">{l}</div>
                                        <div className={`${serif ? 'font-serif text-[20px] font-semibold' : 'text-[14px]'} ${warn ? 'text-red-400' : green ? 'text-green-400' : 'text-black'}`}>{v}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-[12px] text-[#6b7280] flex justify-between mb-1.5"><span>Budget utilization</span><span style={{ color: budgetColor || '#4b5563' }}>{budgetPct}%</span></div>
                            <div className="h-1.5 bg-[#d1d5db] rounded-full overflow-hidden">
                                <div className="h-full rounded-full progress-fill" style={{ width: `${budgetPct}%`, background: budgetColor || 'linear-gradient(90deg, #4f6df5, #6380f7)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Quick Summary</span></div>
                        <div className="px-5 py-2">
                            {[
                                { l: 'Proposals', v: `${project.proposals?.length ?? 0} total` },
                                { l: 'Invoices', v: `${project.invoices?.length ?? 0} total · ${project.invoices?.filter(i => i.status === 'paid').length ?? 0} paid` },
                                { l: 'Meetings', v: `${project.meetings?.length ?? 0} total · ${project.meetings?.filter(m => m.status === 'scheduled').length ?? 0} upcoming` },
                                { l: 'Tasks', v: `${project.tasks?.filter(t => t.status === 'completed').length ?? 0} / ${project.tasks?.length ?? 0} complete` },
                            ].map(({ l, v }) => (
                                <div key={l} className="flex justify-between py-2.5 border-b border-[#e5e7eb] last:border-b-0 text-[13px]">
                                    <span className="text-[#6b7280]">{l}</span>
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
                                <label className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium">Progress</label>
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
                            <div className="flex justify-between text-[10px] text-[#9ca3af] mt-1.5 px-0.5">
                                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                            </div>
                        </div>

                        {/* Quick set buttons */}
                        <div>
                            <label className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2 block">Quick Set</label>
                            <div className="flex gap-2">
                                {[0, 10, 25, 50, 75, 90, 100].map(v => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => progressForm.setData('progress', v)}
                                        className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                                            Number(progressForm.data.progress) === v
                                                ? 'bg-[#4f6df5] text-white border-[#4f6df5]'
                                                : 'bg-white text-[#6b7280] border-[#d1d5db] hover:border-[#4f6df5] hover:text-[#4f6df5]'
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
                                                : 'bg-white text-[#4b5563] border-[#e5e7eb] hover:border-[#4f6df5]/30 hover:text-[#4f6df5]'
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
                                <div className="text-[12px] text-[#6b7280] mt-1">{project.name}</div>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-[#6b7280] hover:text-black text-[22px] leading-none transition-colors">×</button>
                        </div>
                        <div className="px-6 pb-4 overflow-y-auto flex-1">
                    <div className="space-y-5 pb-2">
                        {/* Section: General */}
                        <div>
                            <div className="text-[11px] tracking-[1px] uppercase text-[#9ca3af] font-medium mb-3 flex items-center gap-3">General <span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <FG label="Project Name *" error={editForm.errors.name}><input className={inputCls} value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} /></FG>
                                <FG label="Client / Company" error={editForm.errors.client}><input className={inputCls} value={editForm.data.client} onChange={e => editForm.setData('client', e.target.value)} /></FG>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <FG label="Status">
                                    <select className={inputCls} value={editForm.data.status} onChange={e => editForm.setData('status', e.target.value)}>
                                        <option value="active">Active</option>
                                        <option value="on-hold">On Hold</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </FG>
                                <FG label="Phase">
                                    <select className={inputCls} value={editForm.data.phase} onChange={e => editForm.setData('phase', e.target.value)}>
                                        {PROJECT_PHASES.map(ph => <option key={ph.name} value={ph.name}>{ph.name}</option>)}
                                    </select>
                                </FG>
                                <FG label="Project Lead">
                                    <select className={inputCls} value={editForm.data.lead_id} onChange={e => editForm.setData('lead_id', e.target.value)}>
                                        <option value="">No lead assigned</option>
                                        {(usePage().props.teamMembers ?? []).map(m => (
                                            <option key={m.id} value={m.id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>
                                        ))}
                                    </select>
                                </FG>
                            </div>
                        </div>

                        {/* Section: Client Contact */}
                        <div>
                            <div className="text-[11px] tracking-[1px] uppercase text-[#9ca3af] font-medium mb-3 flex items-center gap-3">Client Contact <span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <div className="grid grid-cols-3 gap-3">
                                <FG label="Contact Name"><input className={inputCls} value={editForm.data.contact_name} onChange={e => editForm.setData('contact_name', e.target.value)} /></FG>
                                <FG label="Contact Email"><input className={inputCls} type="email" value={editForm.data.contact_email} onChange={e => editForm.setData('contact_email', e.target.value)} /></FG>
                                <FG label="Contact Phone"><input className={inputCls} value={editForm.data.contact_phone} onChange={e => editForm.setData('contact_phone', e.target.value)} /></FG>
                            </div>
                        </div>

                        {/* Section: Timeline */}
                        <div>
                            <div className="text-[11px] tracking-[1px] uppercase text-[#9ca3af] font-medium mb-3 flex items-center gap-3">Timeline <span className="flex-1 h-px bg-[#e5e7eb]" /></div>
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
                            <div className="text-[11px] tracking-[1px] uppercase text-[#9ca3af] font-medium mb-3 flex items-center gap-3">Budget & Tax <span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <FG label="Currency">
                                    <select className={inputCls} value={editForm.data.currency} onChange={e => editForm.setData('currency', e.target.value)}>
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.country} ({c.symbol})</option>)}
                                    </select>
                                </FG>
                                <FG label="Budget" error={editForm.errors.budget}>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-[#6b7280]">
                                            {(currencies.find(c => c.code === editForm.data.currency) ?? currencies[0]).symbol}
                                        </span>
                                        <input className={`${inputCls} pl-8 text-[16px] font-semibold`} type="number" value={editForm.data.budget} onChange={e => editForm.setData('budget', e.target.value)} placeholder="0.00" />
                                    </div>
                                </FG>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FG label="Tax Type">
                                    <select className={inputCls} value={editForm.data.tax_type} onChange={e => editForm.setData('tax_type', e.target.value)}>
                                        <option value="">No Tax</option>
                                        <option value="vat">VAT (Value Added Tax)</option>
                                        <option value="gst">GST (Goods & Services Tax)</option>
                                        <option value="sales_tax">Sales Tax</option>
                                        <option value="withholding">Withholding Tax</option>
                                        <option value="consumption">Consumption Tax (Japan)</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </FG>
                                <FG label="Tax Rate (%)">
                                    <div className="relative">
                                        <input className={`${inputCls} pr-8`} type="number" step="0.01" min="0" max="100" value={editForm.data.tax_rate} onChange={e => editForm.setData('tax_rate', e.target.value)} placeholder="0" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9ca3af]">%</span>
                                    </div>
                                </FG>
                            </div>
                        </div>

                        {/* Section: Details */}
                        <div>
                            <div className="text-[11px] tracking-[1px] uppercase text-[#9ca3af] font-medium mb-3 flex items-center gap-3">Details <span className="flex-1 h-px bg-[#e5e7eb]" /></div>
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
    const [showAdd, setShowAdd] = useState(false);
    const { props } = usePage();
    const allClients = props.clients ?? [];
    const contractors = allClients.filter(c => c.type === 'contractor' || c.type === 'vendor');
    const members = project.members ?? [];

    const { data, setData, post, processing, reset } = useForm({ client_id: '', role: '', notes: '' });

    const submit = () => {
        post(route('projects.members.store', project.id), { onSuccess: () => { setShowAdd(false); reset(); } });
    };

    const removeMember = (member) => {
        if (confirm(`Remove ${member.client?.name} from this project?`)) {
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
                        <FG label="Contractor / Vendor">
                            <select className={inputCls} value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                <option value="">Select...</option>
                                {contractors.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                ))}
                            </select>
                        </FG>
                        <FG label="Role in Project">
                            <input className={inputCls} value={data.role} onChange={e => setData('role', e.target.value)} placeholder="e.g. Designer, Developer" />
                        </FG>
                        <div className="flex items-end">
                            <Btn primary sm onClick={submit} disabled={processing || !data.client_id}><Plus size={13} /> Add to Team</Btn>
                        </div>
                    </div>
                </div>
            )}

            {members.length === 0 && !showAdd && (
                <div className="px-5 py-6 text-center text-[13px] text-[#6b7280]">No team members added yet</div>
            )}

            {members.length > 0 && (
                <div>
                    {members.map(m => (
                        <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                            <div className="w-8 h-8 rounded-full bg-[#4f6df5]/10 flex items-center justify-center text-[11px] font-bold text-[#4f6df5] flex-shrink-0">
                                {(m.client?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-black truncate">{m.client?.name}</div>
                                <div className="text-[11px] text-[#6b7280]">
                                    {[m.role, m.client?.type].filter(Boolean).join(' · ')}
                                </div>
                            </div>
                            {canManage && (
                                <button onClick={() => removeMember(m)} className="text-[#9ca3af] hover:text-red-500 transition-colors">
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
                    <p className="text-[12px] text-[#6b7280] mb-3">Share this private link with your client. No login required — they can view proposals, invoices, and meetings.</p>
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
                <div className="px-5 py-5 text-center text-[13px] text-[#6b7280]">Enable the toggle to generate a private client link</div>
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
            <div className="text-center py-16 text-[#6b7280]">
                <div className="mb-4 flex justify-center"><div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center"><FileText size={28} className="text-indigo-400" /></div></div>
                <div className="text-[16px] font-semibold text-black mb-1">No proposals yet</div>
                <div className="text-[13px] text-[#6b7280] mb-5">Create your first proposal for this project</div>
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
                                    <div className="flex items-center gap-3 text-[12px] text-[#6b7280]">
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
                                <div className="text-[12px] text-[#6b7280] line-clamp-2 leading-relaxed mb-3 border-l-2 border-[#e5e7eb] pl-3" dangerouslySetInnerHTML={{ __html: pr.content.replace(/<[^>]*>/g, ' ').slice(0, 200) + '…' }} />
                            )}
                            {!pr.content && pr.summary && (
                                <div className="text-[12px] text-[#6b7280] line-clamp-2 leading-relaxed mb-3 border-l-2 border-[#e5e7eb] pl-3">{pr.summary.slice(0, 200)}…</div>
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
                                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#4b5563] border border-[#d1d5db] hover:bg-gray-100 cursor-pointer transition-all">
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
                        <div className="text-[12px] text-[#6b7280] mt-1">For {project.name}{!isEdit && nextNumber ? ` · ${nextNumber}` : ''}</div>
                    </div>
                    <button onClick={onClose} className="text-[#6b7280] hover:text-black text-[22px] leading-none transition-colors">×</button>
                </div>
                <div className="px-6 pb-2 overflow-y-auto flex-1">
            <div className="space-y-4 pb-2">
                {/* Proposal Number */}
                {!isEdit && nextNumber && (
                    <FG label="Proposal #"><input className={`${inputCls} bg-[#e5e7eb] font-mono font-semibold`} value={nextNumber} readOnly /></FG>
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
                    <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">
                        Proposal Content <span className="flex-1 h-px bg-[#e5e7eb]" />
                    </div>
                    <Suspense fallback={<div className="text-[13px] text-[#6b7280] p-4">Loading editor…</div>}>
                        <RichEditor content={data.content} onChange={val => setData('content', val)} placeholder="Write your proposal — use headings for sections, lists for scope/deliverables, tables for timelines…" />
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
function InvoicesTab({ project, canManage, nextNumber, fmt }) {
    const [showModal, setShowModal] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [paymentModal, setPaymentModal] = useState(null); // invoice object or null
    const invoices = project.invoices ?? [];

    const totalBilled   = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
    const totalPaid     = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total ?? 0), 0);
    const outstanding   = invoices.filter(i => ['sent','overdue'].includes(i.status)).reduce((s, i) => s + (i.total ?? 0), 0);

    const statusCycle = { draft: 'sent', sent: 'paid' };

    const updateStatus = (inv, status) => router.patch(route('invoices.status', inv.id), { status });

    const { data, setData, post, processing, reset, errors } = useForm({
        number: nextNumber ?? '', date: new Date().toISOString().slice(0, 10), due_date: '', description: '',
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
                    { l: 'Outstanding', v: fmt(outstanding), icon: <Clock size={16} />, bg: outstanding > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100', iconC: outstanding > 0 ? 'text-amber-500' : 'text-gray-400', textC: outstanding > 0 ? 'text-amber-700' : 'text-gray-600' },
                ].map(({ l, v, icon, bg, iconC, textC }) => (
                    <div key={l} className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
                        <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center ${iconC} shadow-sm`}>{icon}</div>
                        <div>
                            <div className="text-[10px] tracking-[1.5px] uppercase text-[#6b7280] font-medium">{l}</div>
                            <div className={`text-[20px] font-bold ${textC} leading-tight`}>{v}</div>
                        </div>
                    </div>
                ))}
            </div>

            {invoices.length === 0 && <div className="text-center py-14 text-[#6b7280]"><div className="mb-3 opacity-30 flex justify-center"><Receipt size={40} /></div><div className="text-[14px] mb-5">No invoices yet</div>{canManage && <Btn primary onClick={() => setShowModal(true)}><Plus size={15} /> Create First Invoice</Btn>}</div>}

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
                                    <div className="text-[12px] text-[#6b7280] truncate">{inv.description || 'No description'}</div>
                                </div>
                                <div className="text-right mr-2 flex-shrink-0">
                                    <div className="text-[17px] font-bold text-black">{fmt(inv.total)}</div>
                                    <div className="text-[11px] text-[#9ca3af]">{inv.status === 'paid' ? `Paid ${fmtDate(inv.date)}` : inv.due_date ? `Due ${fmtDate(inv.due_date)}` : fmtDate(inv.date)}</div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Link href={route('invoices.view', inv.id)} onClick={e => e.stopPropagation()}>
                                        <Btn ghost sm><Eye size={13} /></Btn>
                                    </Link>
                                    {canManage && inv.status === 'draft' && (
                                        <Btn ghost sm onClick={e => { e.stopPropagation(); updateStatus(inv, 'sent'); }}>
                                            <Send size={13} />
                                        </Btn>
                                    )}
                                    {canManage && (inv.status === 'sent' || (inv.status === 'paid' && !inv.received_amount)) && (
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
                                        <label className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-[#6b7280] border border-[#d1d5db] hover:bg-gray-100 cursor-pointer transition-all" onClick={e => e.stopPropagation()}>
                                            <Upload size={12} /> {inv.signed_file_path ? 'Signed ✓' : 'Upload'}
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => {
                                                if (!e.target.files[0]) return;
                                                const fd = new FormData(); fd.append('file', e.target.files[0]);
                                                router.post(route('invoices.signed-file', inv.id), fd);
                                            }} />
                                        </label>
                                    )}
                                    <span className="text-[#9ca3af]">{expanded === inv.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                                </div>
                            </div>
                            {expanded === inv.id && (
                                <div className="px-5 py-4 bg-[#fafbfc] border-t border-[#f0f0f0]">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#e5e7eb]">
                                                <th className="text-left text-[10px] tracking-wide uppercase text-[#9ca3af] font-medium pb-2">Description</th>
                                                <th className="text-center text-[10px] tracking-wide uppercase text-[#9ca3af] font-medium pb-2 w-16">Qty</th>
                                                <th className="text-right text-[10px] tracking-wide uppercase text-[#9ca3af] font-medium pb-2 w-24">Rate</th>
                                                <th className="text-right text-[10px] tracking-wide uppercase text-[#9ca3af] font-medium pb-2 w-24">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(inv.items ?? []).map((item, i) => (
                                                <tr key={i} className="border-b border-[#f0f0f0] last:border-b-0">
                                                    <td className="py-2.5 text-[13px] text-black">{item.description}</td>
                                                    <td className="py-2.5 text-[13px] text-center text-[#6b7280]">{item.quantity}</td>
                                                    <td className="py-2.5 text-[13px] text-right text-[#6b7280]">{fmt(item.rate)}</td>
                                                    <td className="py-2.5 text-[13px] text-right font-medium text-black">{fmt(item.quantity * item.rate)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="flex justify-end pt-3 mt-2 border-t border-[#e5e7eb]">
                                        <div className="flex items-center gap-6 text-[13px]">
                                            <span className="text-[#9ca3af] uppercase tracking-wide text-[10px] font-medium">Total</span>
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
                        <div className="pt-2">
                            <div className="text-[10px] tracking-[2px] uppercase text-[#6b7280] mb-3 flex items-center gap-3">Line Items<span className="flex-1 h-px bg-[#e5e7eb]" /></div>
                            <div className="grid grid-cols-[1fr_70px_90px_28px] gap-2 text-[10px] uppercase tracking-wide text-[#6b7280] mb-2 px-0.5">
                                <span>Description</span><span>Qty</span><span>Rate</span><span />
                            </div>
                            {data.items.map((item, i) => (
                                <div key={i} className="grid grid-cols-[1fr_70px_90px_28px] gap-2 mb-2">
                                    <input className={inputCls} style={{fontSize:12}} value={item.description} onChange={e => updateItem(i,'description',e.target.value)} placeholder="Item description" />
                                    <input className={inputCls} style={{fontSize:12}} type="number" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} min="1" />
                                    <input className={inputCls} style={{fontSize:12}} type="number" value={item.rate} onChange={e => updateItem(i,'rate',e.target.value)} placeholder="0" />
                                    <button onClick={() => removeItem(i)} className="text-[#6b7280] hover:text-red-400 text-[18px] pb-0.5">×</button>
                                </div>
                            ))}
                            <div className="flex justify-between items-center mt-3">
                                <Btn ghost sm onClick={addItem}>+ Add Line Item</Btn>
                                <div className="flex gap-8 text-[13.5px]"><span className="text-[#6b7280]">Total</span><span className="font-semibold text-black">{fmt(total)}</span></div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Record Payment Modal */}
            {paymentModal && <PaymentModal invoice={paymentModal} onClose={() => setPaymentModal(null)} />}
        </>
    );
}

function PaymentModal({ invoice, onClose }) {
    const invoiceCur = invoice.currency ?? 'USD';
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
                        <select className={inputCls} value={data.received_currency} onChange={e => setData('received_currency', e.target.value)}>
                            {currencyOptions.map(c => <option key={c.code} value={c.code}>{c.label} ({c.symbol})</option>)}
                        </select>
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
                    <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all capitalize ${filter === s ? 'bg-[#4f6df5]/10 border-[#4f6df5]/30 text-[#4f6df5]' : 'border-[#d1d5db] text-[#4b5563] hover:text-black hover:bg-gray-100'}`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && <div className="text-center py-14 text-[#6b7280]"><div className="mb-3 opacity-30 flex justify-center"><CalendarDays size={40} /></div><div className="text-[14px] mb-5">No meetings scheduled</div>{canManage && <Btn primary onClick={() => setShowModal(true)}><Plus size={15} /> Schedule a Meeting</Btn>}</div>}

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
                                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-[#4b5563]">{MTG_TYPES[m.type]}</span>
                                    </div>
                                    <div className="text-[12.5px] text-[#6b7280] mb-2">{m.time} · {m.duration} · {m.location}</div>
                                    {(m.attendees ?? []).length > 0 && <div className="text-[12px] text-[#6b7280]">👥 {m.attendees.join(', ')}</div>}
                                    {m.notes && <div className="mt-3 px-3 py-2.5 bg-[#f3f4f6] rounded-lg text-[12.5px] text-[#4b5563] leading-relaxed border-l-2 border-[#d1d5db]">{m.notes}</div>}
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
                                <select className={inputCls} value={kickoffNotes ? 'kickoff' : data.type} onChange={e => setData('type', e.target.value)}>
                                    {Object.entries(MTG_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
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
                <div className="text-center py-16 text-[#6b7280]">
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
    const deleteDoc = (doc) => {
        if (confirm('Delete this document?')) {
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
                    <button key={t} onClick={() => setFilter(t)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all capitalize ${filter === t ? 'bg-[#4f6df5]/10 border-[#4f6df5]/30 text-[#4f6df5]' : 'border-[#d1d5db] text-[#4b5563] hover:text-black hover:bg-gray-100'}`}>{t}</button>
                ))}
            </div>

            {filtered.length === 0 && <div className="text-center py-14 text-[#6b7280]"><div className="mb-3 opacity-30 flex justify-center"><FolderOpen size={40} /></div><div className="text-[14px] mb-5">No documents found</div>{canManage && <Btn primary onClick={() => setShowModal(true)}><Upload size={15} /> Add Document</Btn>}</div>}

            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                {filtered.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-[#e5e7eb] last:border-b-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 ${DOC_COLORS[doc.type] ?? 'bg-gray-100'}`}>{DOC_ICONS[doc.type] ?? '📁'}</div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium text-black truncate">{doc.name}</div>
                            <div className="text-[11.5px] text-[#6b7280]">
                                Added by {doc.uploader?.name ?? 'Team'} · {fmtDate(doc.created_at)} {doc.file_size ? `· ${doc.file_size}` : ''}
                            </div>
                        </div>
                        <Badge status={doc.type} label={doc.type} />
                        {doc.task_id && <span className="text-[10px] text-[#9ca3af] bg-[#f3f4f6] px-2 py-0.5 rounded-full">Task</span>}
                        <button onClick={() => setPreviewDoc(doc)} className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7280] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100"><Eye size={13} /> View</button>
                        <a href={`/documents/${doc.id}/download`} className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7280] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100"><Download size={13} /> Download</a>
                        {canManage && (
                            <>
                                <button onClick={() => openEditDoc(doc)} className="p-1.5 rounded-md text-[#9ca3af] hover:text-[#4f6df5] transition-colors" title="Edit"><Pencil size={14} /></button>
                                <button onClick={() => deleteDoc(doc)} className="p-1.5 rounded-md text-[#9ca3af] hover:text-red-500 transition-colors" title="Delete"><Trash2 size={14} /></button>
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
                            <select className={inputCls} value={data.type} onChange={e => setData('type', e.target.value)}>
                                {['contract','brief','report','asset','other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                            </select>
                        </FG>
                        <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center text-[#6b7280]">
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
                            <select className={inputCls} value={editForm.data.type} onChange={e => editForm.setData('type', e.target.value)}>
                                {['contract','brief','report','asset','other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                            </select>
                        </FG>
                        <FG label="Replace File">
                            <input type="file" onChange={e => editForm.setData('file', e.target.files[0])} className="text-[13px] text-[#6b7280]" />
                            {editDoc.file_size && !editForm.data.file && <div className="text-[11px] text-[#9ca3af] mt-1">Current file: {editDoc.file_size}</div>}
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
                        <div className="text-[13px] text-[#6b7280]">{isCompleted ? 'Project completed' : isOverdue ? 'Project overdue' : `${daysLeft} days remaining`}</div>
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
                                        done ? 'bg-emerald-500 text-white' : active ? 'bg-[#4f6df5] text-white ring-4 ring-[#4f6df5]/20' : 'bg-[#f0f0f0] text-[#9ca3af]'
                                    }`}>
                                        {done ? <CheckCircle size={14} /> : i + 1}
                                    </div>
                                    {i < PROJECT_PHASES.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-emerald-300' : 'bg-[#e5e7eb]'}`} />}
                                </div>
                                <span className={`text-[9px] text-center leading-tight mt-2 px-1 ${active ? 'text-[#4f6df5] font-bold' : done ? 'text-emerald-600' : 'text-[#9ca3af]'}`}>{ph.name}</span>
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
                            { l: 'Days Elapsed', v: `${Math.max(0, daysElapsed)} of ${daysTotal} days`, icon: <Clock size={13} className="text-[#6b7280]" /> },
                            { l: 'Current Phase', v: project.phase, icon: <CheckCircle size={13} className="text-[#4f6df5]" /> },
                        ].map(({ l, v, icon }) => (
                            <div key={l} className="flex items-center gap-3 py-3 border-b border-[#f0f0f0] last:border-b-0 text-[13px]">
                                {icon}
                                <span className="text-[#6b7280] flex-1">{l}</span>
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
                                        done ? 'bg-emerald-500 text-white' : active ? 'bg-[#4f6df5] text-white' : 'bg-[#f0f0f0] text-[#d1d5db]'
                                    }`}>
                                        {done ? <Check size={12} /> : active ? <div className="w-2 h-2 rounded-sm bg-white" /> : <span className="text-[10px]">{i + 1}</span>}
                                    </div>
                                    <span className={`text-[13px] flex-1 ${done ? 'text-emerald-600' : active ? 'text-[#4f6df5] font-semibold' : 'text-[#4b5563]'}`}>{ph.name}</span>
                                    <span className="text-[11px] text-[#9ca3af]">{ph.progress}%</span>
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
function TasksTab({ project, canManage }) {
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [expandedTask, setExpandedTask] = useState(null);
    const [showDocModal, setShowDocModal] = useState(null); // task id
    const [previewDoc, setPreviewDoc] = useState(null);
    const tasks = project.tasks ?? [];
    const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

    const { data, setData, post, processing, reset } = useForm({
        title: '', assignee: '', due_date: '', priority: 'medium', status: 'not-started', category: 'Deliverable',
    });
    const submit = () => post(route('projects.tasks.store', project.id), { onSuccess: () => { setShowModal(false); reset(); } });

    const docForm = useForm({ name: '', type: 'other', file: null, task_id: null });
    const submitDoc = () => {
        docForm.post(route('projects.documents.store', project.id), {
            forceFormData: true,
            onSuccess: () => { setShowDocModal(null); docForm.reset(); },
        });
    };

    const cycleStatus = (task) => {
        const next = { 'not-started': 'in-progress', 'in-progress': 'completed', 'review': 'completed', 'completed': 'not-started' };
        router.patch(route('tasks.status', task.id), { status: next[task.status] ?? 'not-started' });
    };

    const deleteDoc = (doc) => {
        if (confirm('Delete this document?')) {
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
            <div className="flex bg-[#f3f4f6] rounded-lg p-0.5 mb-5 w-fit">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'not-started', label: 'To Do' },
                    { key: 'in-progress', label: 'In Progress' },
                    { key: 'review', label: 'Review' },
                    { key: 'completed', label: 'Done' },
                ].map(s => (
                    <button key={s.key} onClick={() => setFilter(s.key)} className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${filter === s.key ? 'bg-white text-black shadow-sm' : 'text-[#6b7280] hover:text-black'}`}>
                        {s.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-14 text-[#6b7280]">
                    <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><ListChecks size={24} className="text-indigo-400" /></div></div>
                    <div className="text-[14px] font-semibold text-black mb-1">No tasks found</div>
                    <div className="text-[13px] text-[#6b7280] mb-4">Add tasks to track work on this project</div>
                    {canManage && <Btn primary onClick={() => setShowModal(true)}><Plus size={15} /> Add First Task</Btn>}
                </div>
            )}

            {Object.entries(byCategory).map(([cat, catTasks]) => (
                <div key={cat} className="mb-5">
                    <div className="flex items-center gap-2 text-[10.5px] tracking-[1.5px] uppercase text-[#6b7280] mb-2 pb-2 border-b border-[#e5e7eb]">
                        <ListChecks size={13} /> {cat} <span className="text-[#d1d5db]">({catTasks.length})</span>
                    </div>
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        {catTasks.map(t => {
                            const docs = t.documents ?? [];
                            const isExpanded = expandedTask === t.id;
                            return (
                                <div key={t.id} className="border-b border-[#f0f0f0] last:border-b-0">
                                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#fafbfc] transition-colors">
                                        <button
                                            onClick={() => cycleStatus(t)}
                                            className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all
                                                ${t.status === 'completed' ? 'border-emerald-400 bg-emerald-400' : t.status === 'in-progress' ? 'border-indigo-400 bg-indigo-50' : 'border-[#d1d5db] hover:border-[#4f6df5]'}`}
                                        >
                                            {t.status === 'completed' && <Check size={12} className="text-white" />}
                                            {t.status === 'in-progress' && <div className="w-2 h-2 rounded-sm bg-indigo-400" />}
                                        </button>
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : t.id)}>
                                            <div className={`text-[13px] ${t.status === 'completed' ? 'text-emerald-600' : 'text-black font-medium'}`}>{t.title}</div>
                                            <div className="text-[11px] text-[#9ca3af] flex items-center gap-1.5">
                                                {t.assignee && <span>{t.assignee}</span>}
                                                {t.due_date && <><span>·</span><span className="flex items-center gap-0.5"><Calendar size={10} /> {fmtDate(t.due_date)}</span></>}
                                                {docs.length > 0 && <><span>·</span><span className="flex items-center gap-0.5"><FileText size={10} /> {docs.length} doc{docs.length !== 1 ? 's' : ''}</span></>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {canManage && (
                                                <button
                                                    onClick={() => { docForm.setData('task_id', t.id); setShowDocModal(t.id); }}
                                                    className="p-1.5 rounded-md text-[#9ca3af] hover:text-[#4f6df5] hover:bg-indigo-50 transition-colors"
                                                    title="Attach document"
                                                >
                                                    <Upload size={13} />
                                                </button>
                                            )}
                                            <Badge status={t.priority} />
                                            <Badge status={t.status} label={t.status === 'not-started' ? 'To Do' : t.status === 'in-progress' ? 'In Progress' : t.status === 'review' ? 'Review' : 'Done'} />
                                        </div>
                                    </div>
                                    {isExpanded && docs.length > 0 && (
                                        <div className="px-4 pb-3 pt-0">
                                            <div className="ml-8 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg overflow-hidden">
                                                <div className="px-3 py-2 border-b border-[#e5e7eb] text-[10px] tracking-[1.2px] uppercase text-[#6b7280] font-medium flex items-center gap-1.5">
                                                    <FileText size={11} /> Attached Documents
                                                </div>
                                                {docs.map(doc => (
                                                    <div key={doc.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#f0f0f0] last:border-b-0">
                                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[13px] flex-shrink-0 ${DOC_COLORS[doc.type] ?? 'bg-gray-100'}`}>
                                                            {DOC_ICONS[doc.type] ?? '📁'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[12px] font-medium text-black truncate">{doc.name}</div>
                                                            <div className="text-[10px] text-[#9ca3af]">
                                                                {doc.uploader?.name ?? 'Team'} · {fmtDate(doc.created_at)} {doc.file_size ? `· ${doc.file_size}` : ''}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => setPreviewDoc(doc)} className="inline-flex items-center gap-1 text-[11px] text-[#6b7280] hover:text-black transition-colors px-2 py-1 rounded-md border border-[#e5e7eb] hover:bg-white">
                                                            <Eye size={11} /> View
                                                        </button>
                                                        <a href={`/documents/${doc.id}/download`} className="inline-flex items-center gap-1 text-[11px] text-[#6b7280] hover:text-black transition-colors px-2 py-1 rounded-md border border-[#e5e7eb] hover:bg-white">
                                                            <Download size={11} /> Download
                                                        </a>
                                                        {canManage && (
                                                            <button onClick={() => deleteDoc(doc)} className="p-1 rounded-md text-[#d1d5db] hover:text-red-400 transition-colors">
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
                                            <div className="ml-8 text-[12px] text-[#9ca3af] flex items-center gap-1.5 py-2">
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
                </div>
            ))}

            {showModal && (
                <Modal title="Add Task" subtitle={`For ${project.name}`} onClose={() => setShowModal(false)} footer={<><Btn ghost onClick={() => setShowModal(false)}><X size={13} /> Cancel</Btn><Btn primary onClick={submit} disabled={processing}><Plus size={13} /> {processing ? 'Adding…' : 'Add Task'}</Btn></>}>
                    <div className="space-y-4 pb-2">
                        <FG label="Task Title *"><input className={inputCls} value={data.title} onChange={e => setData('title', e.target.value)} placeholder="What needs to be done?" /></FG>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Assignee"><input className={inputCls} value={data.assignee} onChange={e => setData('assignee', e.target.value)} placeholder="Person responsible" /></FG>
                            <FG label="Due Date"><input className={inputCls} type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Priority">
                                <select className={inputCls} value={data.priority} onChange={e => setData('priority', e.target.value)}>
                                    {['high','medium','low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                                </select>
                            </FG>
                            <FG label="Status">
                                <select className={inputCls} value={data.status} onChange={e => setData('status', e.target.value)}>
                                    {[['not-started','Not Started'],['in-progress','In Progress'],['review','Review'],['completed','Completed']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </FG>
                        </div>
                        <FG label="Category"><input className={inputCls} value={data.category} onChange={e => setData('category', e.target.value)} placeholder="e.g. Deliverable, Client Approval, Milestone" /></FG>
                    </div>
                </Modal>
            )}

            {showDocModal && (
                <Modal title="Attach Document" subtitle={`To task: ${tasks.find(t => t.id === showDocModal)?.title ?? ''}`} onClose={() => { setShowDocModal(null); docForm.reset(); }} footer={<><Btn ghost onClick={() => { setShowDocModal(null); docForm.reset(); }}>Cancel</Btn><Btn primary onClick={submitDoc} disabled={docForm.processing}>{docForm.processing ? 'Uploading…' : 'Upload Document'}</Btn></>}>
                    <div className="space-y-4 pb-2">
                        <FG label="Document Name *"><input className={inputCls} value={docForm.data.name} onChange={e => docForm.setData('name', e.target.value)} placeholder="e.g. Final Mockup, Brand Guidelines" /></FG>
                        <FG label="Document Type">
                            <select className={inputCls} value={docForm.data.type} onChange={e => docForm.setData('type', e.target.value)}>
                                {['contract','brief','report','asset','other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                            </select>
                        </FG>
                        <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center text-[#6b7280]">
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
            <div className="text-[10px] tracking-[1.5px] uppercase text-[#6b7280] mb-2">{title}</div>
            {children}
        </div>
    );
}

// ── BILLS TAB (Vendor/Contractor Invoices) ───────────────────────────────────
function BillsTab({ project, canManage, fmt }) {
    const [showModal, setShowModal] = useState(false);
    const [editBill, setEditBill] = useState(null);
    const bills = project.bills ?? [];
    const { props } = usePage();
    const allClients = props.clients ?? [];
    const vendors = allClients.filter(c => c.type === 'vendor' || c.type === 'contractor');

    const totalBills = bills.reduce((s, b) => s + parseFloat(b.amount ?? 0), 0);
    const totalPaid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + parseFloat(b.amount ?? 0), 0);
    const totalPending = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + parseFloat(b.amount ?? 0), 0);

    const { data, setData, post, processing, reset, errors } = useForm({
        client_id: '', number: '', amount: '', currency: project.currency ?? 'USD',
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
        client_id: '', number: '', amount: '', currency: project.currency ?? 'USD',
        date: '', due_date: '', description: '', category: '', notes: '', file: null,
    });

    const openEdit = (bill) => {
        editForm.setData({
            client_id: bill.client_id ?? '', number: bill.number ?? '', amount: bill.amount ?? '',
            currency: bill.currency ?? project.currency ?? 'USD', date: bill.date?.slice(0, 10) ?? '',
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

    const deleteBill = (bill) => {
        if (confirm('Delete this bill?')) {
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
                    { l: 'Total Bills', v: fmt(totalBills), icon: <Receipt size={16} />, bg: 'bg-indigo-50 border-indigo-100', iconC: 'text-indigo-500', textC: 'text-indigo-700' },
                    { l: 'Paid', v: fmt(totalPaid), icon: <Check size={16} />, bg: 'bg-emerald-50 border-emerald-100', iconC: 'text-emerald-500', textC: 'text-emerald-700' },
                    { l: 'Pending', v: fmt(totalPending), icon: <Clock size={16} />, bg: totalPending > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100', iconC: totalPending > 0 ? 'text-amber-500' : 'text-gray-400', textC: totalPending > 0 ? 'text-amber-700' : 'text-gray-600' },
                ].map(({ l, v, icon, bg, iconC, textC }) => (
                    <div key={l} className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
                        <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center ${iconC} shadow-sm`}>{icon}</div>
                        <div>
                            <div className="text-[10px] tracking-[1.5px] uppercase text-[#6b7280] font-medium">{l}</div>
                            <div className={`text-[20px] font-bold ${textC} leading-tight`}>{v}</div>
                        </div>
                    </div>
                ))}
            </div>

            {bills.length === 0 && !showModal && (
                <div className="text-center py-14 text-[#6b7280]">
                    <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><Receipt size={24} className="text-indigo-400" /></div></div>
                    <div className="text-[14px] font-semibold text-black mb-1">No bills yet</div>
                    <div className="text-[13px] text-[#6b7280] mb-4">Track invoices from vendors and contractors</div>
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
                                    {bill.number && <span className="text-[12px] font-mono text-[#6b7280]">#{bill.number}</span>}
                                    <Badge status={bill.status} />
                                    {bill.category && <span className="text-[10px] px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-500 font-medium">{bill.category}</span>}
                                </div>
                                <div className="text-[12px] text-[#6b7280]">
                                    {bill.description}
                                    {bill.due_date && <span> · Due {fmtDate(bill.due_date)}</span>}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-[18px] font-bold text-black">{fmt(bill.amount)}</div>
                                <div className="text-[11px] text-[#9ca3af]">{fmtDate(bill.date)}</div>
                            </div>
                        </div>

                        {/* File */}
                        {bill.file_path && (
                            <div className="flex items-center gap-2 mb-3 bg-[#fafbfc] border border-[#e5e7eb] rounded-lg px-3 py-2">
                                <FileText size={14} className="text-[#6b7280]" />
                                <span className="text-[12px] text-[#4b5563] flex-1">{bill.file_name}</span>
                                <a href={`/storage/${bill.file_path}`} target="_blank" className="text-[12px] text-[#4f6df5] font-medium">View</a>
                            </div>
                        )}

                        {bill.notes && <div className="text-[12px] text-[#6b7280] mb-3 italic">{bill.notes}</div>}

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
                                <button onClick={() => openEdit(bill)} className="text-[#9ca3af] hover:text-[#4f6df5] transition-colors p-1.5 ml-auto" title="Edit"><Pencil size={14} /></button>
                                <button onClick={() => deleteBill(bill)} className="text-[#9ca3af] hover:text-red-500 transition-colors p-1.5" title="Delete"><Trash2 size={14} /></button>
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
                                <select className={inputCls} value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                    <option value="">Select...</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)}
                                </select>
                            </FG>
                            <FG label="Their Invoice #"><input className={inputCls} value={data.number} onChange={e => setData('number', e.target.value)} placeholder="e.g. VND-001" /></FG>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <FG label="Amount *" error={errors.amount}><input className={inputCls} type="number" step="0.01" value={data.amount} onChange={e => setData('amount', e.target.value)} placeholder="0.00" /></FG>
                            <FG label="Currency">
                                <select className={inputCls} value={data.currency} onChange={e => setData('currency', e.target.value)}>
                                    {['USD','PHP','JPY','EUR','GBP','SGD','AUD','THB','VND','IDR','MYR'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </FG>
                            <FG label="Category"><input className={inputCls} value={data.category} onChange={e => setData('category', e.target.value)} placeholder="e.g. Design, Dev" /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Bill Date *" error={errors.date}><input className={inputCls} type="date" value={data.date} onChange={e => setData('date', e.target.value)} /></FG>
                            <FG label="Due Date"><input className={inputCls} type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} /></FG>
                        </div>
                        <FG label="Description"><input className={inputCls} value={data.description} onChange={e => setData('description', e.target.value)} placeholder="What is this bill for?" /></FG>
                        <FG label="Notes"><textarea className={`${inputCls} resize-y`} rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Payment terms, bank details, etc." /></FG>
                        <FG label="Attach Invoice File">
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setData('file', e.target.files[0])} className="text-[13px] text-[#6b7280]" />
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
                                <select className={inputCls} value={editForm.data.client_id} onChange={e => editForm.setData('client_id', e.target.value)}>
                                    <option value="">Select...</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)}
                                </select>
                            </FG>
                            <FG label="Their Invoice #"><input className={inputCls} value={editForm.data.number} onChange={e => editForm.setData('number', e.target.value)} placeholder="e.g. VND-001" /></FG>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <FG label="Amount *" error={editForm.errors.amount}><input className={inputCls} type="number" step="0.01" value={editForm.data.amount} onChange={e => editForm.setData('amount', e.target.value)} placeholder="0.00" /></FG>
                            <FG label="Currency">
                                <select className={inputCls} value={editForm.data.currency} onChange={e => editForm.setData('currency', e.target.value)}>
                                    {['USD','PHP','JPY','EUR','GBP','SGD','AUD','THB','VND','IDR','MYR'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </FG>
                            <FG label="Category"><input className={inputCls} value={editForm.data.category} onChange={e => editForm.setData('category', e.target.value)} placeholder="e.g. Design, Dev" /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Bill Date *" error={editForm.errors.date}><input className={inputCls} type="date" value={editForm.data.date} onChange={e => editForm.setData('date', e.target.value)} /></FG>
                            <FG label="Due Date"><input className={inputCls} type="date" value={editForm.data.due_date} onChange={e => editForm.setData('due_date', e.target.value)} /></FG>
                        </div>
                        <FG label="Description"><input className={inputCls} value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} placeholder="What is this bill for?" /></FG>
                        <FG label="Notes"><textarea className={`${inputCls} resize-y`} rows={2} value={editForm.data.notes} onChange={e => editForm.setData('notes', e.target.value)} placeholder="Payment terms, bank details, etc." /></FG>
                        <FG label="Replace Invoice File">
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => editForm.setData('file', e.target.files[0])} className="text-[13px] text-[#6b7280]" />
                            {editBill.file_name && !editForm.data.file && <div className="text-[11px] text-[#9ca3af] mt-1">Current: {editBill.file_name}</div>}
                        </FG>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ── PAYROLL TAB ──────────────────────────────────────────────────────────────
function PayrollTab({ project, canManage, fmt }) {
    const [showModal, setShowModal] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const entries = project.payroll ?? [];
    const { props } = usePage();
    const teamMembers = props.teamMembers ?? [];

    const totalPayroll = entries.reduce((s, e) => s + parseFloat(e.amount ?? 0), 0);
    const totalPaid = entries.filter(e => e.status === 'paid').reduce((s, e) => s + parseFloat(e.amount ?? 0), 0);

    const { data, setData, post, processing, reset } = useForm({
        team_member_id: '', period: '', pay_type: 'monthly', rate: '', hours: '', amount: '', currency: project.currency ?? 'PHP', notes: '',
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
        team_member_id: '', period: '', pay_type: 'monthly', rate: '', hours: '', amount: '', currency: project.currency ?? 'PHP', notes: '',
    });

    const openEdit = (entry) => {
        editForm.setData({
            team_member_id: entry.team_member_id ?? '', period: entry.period ?? '', pay_type: entry.pay_type ?? 'monthly',
            rate: entry.rate ?? '', hours: entry.hours ?? '', amount: entry.amount ?? '',
            currency: entry.currency ?? project.currency ?? 'PHP', notes: entry.notes ?? '',
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
    const deleteEntry = (entry) => { if (confirm('Delete this payroll entry?')) router.delete(route('projects.payroll.destroy', [project.id, entry.id])); };

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Team Payroll</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}><Plus size={13} /> Add Entry</Btn>}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                    { l: 'Total Payroll', v: fmt(totalPayroll), icon: <Users size={16} />, bg: 'bg-indigo-50 border-indigo-100', iconC: 'text-indigo-500', textC: 'text-indigo-700' },
                    { l: 'Paid Out', v: fmt(totalPaid), icon: <Check size={16} />, bg: 'bg-emerald-50 border-emerald-100', iconC: 'text-emerald-500', textC: 'text-emerald-700' },
                ].map(({ l, v, icon, bg, iconC, textC }) => (
                    <div key={l} className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
                        <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center ${iconC} shadow-sm`}>{icon}</div>
                        <div>
                            <div className="text-[10px] tracking-[1.5px] uppercase text-[#6b7280] font-medium">{l}</div>
                            <div className={`text-[20px] font-bold ${textC} leading-tight`}>{v}</div>
                        </div>
                    </div>
                ))}
            </div>

            {entries.length === 0 && !showModal && (
                <div className="text-center py-14 text-[#6b7280]">
                    <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><Users size={24} className="text-indigo-400" /></div></div>
                    <div className="text-[14px] font-semibold text-black mb-1">No payroll entries</div>
                    <div className="text-[13px] text-[#6b7280] mb-4">Track team member costs for this project</div>
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
                                <div className="text-[12px] text-[#6b7280] mt-0.5">{entry.period}{entry.hours ? ` · ${entry.hours} hrs @ ${fmt(entry.rate)}/hr` : ''}</div>
                                {entry.notes && <div className="text-[12px] text-[#9ca3af] italic mt-1">{entry.notes}</div>}
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-[18px] font-bold text-black">{fmt(entry.amount)}</div>
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
                                <button onClick={() => openEdit(entry)} className="text-[#9ca3af] hover:text-[#4f6df5] transition-colors p-1.5" title="Edit"><Pencil size={14} /></button>
                                <button onClick={() => deleteEntry(entry)} className="text-[#9ca3af] hover:text-red-500 transition-colors p-1.5" title="Delete"><Trash2 size={14} /></button>
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
                                <select className={inputCls} value={data.team_member_id} onChange={e => handleMemberSelect(e.target.value)}>
                                    <option value="">Select...</option>
                                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>)}
                                </select>
                            </FG>
                            <FG label="Period *"><input className={inputCls} value={data.period} onChange={e => setData('period', e.target.value)} placeholder="e.g. Apr 2026, Sprint 3" /></FG>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <FG label="Pay Type">
                                <select className={inputCls} value={data.pay_type} onChange={e => { setData('pay_type', e.target.value); setData('amount', computeAmount(e.target.value, data.rate, data.hours)); }}>
                                    <option value="monthly">Monthly</option>
                                    <option value="hourly">Hourly</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </FG>
                            <FG label="Rate"><input className={inputCls} type="number" step="0.01" value={data.rate} onChange={e => { setData('rate', e.target.value); setData('amount', computeAmount(data.pay_type, e.target.value, data.hours)); }} placeholder="0.00" /></FG>
                            {data.pay_type === 'hourly' && (
                                <FG label="Hours"><input className={inputCls} type="number" step="0.5" value={data.hours} onChange={e => { setData('hours', e.target.value); setData('amount', computeAmount(data.pay_type, data.rate, e.target.value)); }} placeholder="0" /></FG>
                            )}
                            {data.pay_type !== 'hourly' && (
                                <FG label="Currency">
                                    <select className={inputCls} value={data.currency} onChange={e => setData('currency', e.target.value)}>
                                        {['PHP','USD','JPY','EUR','GBP','SGD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </FG>
                            )}
                        </div>
                        <FG label="Total Amount *">
                            <input className={`${inputCls} text-[16px] font-bold`} type="number" step="0.01" value={data.amount} onChange={e => setData('amount', e.target.value)} placeholder="0.00" />
                        </FG>
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
                                <select className={inputCls} value={editForm.data.team_member_id} onChange={e => editForm.setData('team_member_id', e.target.value)}>
                                    <option value="">Select...</option>
                                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>)}
                                </select>
                            </FG>
                            <FG label="Period *"><input className={inputCls} value={editForm.data.period} onChange={e => editForm.setData('period', e.target.value)} placeholder="e.g. Apr 2026, Sprint 3" /></FG>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <FG label="Pay Type">
                                <select className={inputCls} value={editForm.data.pay_type} onChange={e => { editForm.setData('pay_type', e.target.value); editForm.setData('amount', computeAmount(e.target.value, editForm.data.rate, editForm.data.hours)); }}>
                                    <option value="monthly">Monthly</option>
                                    <option value="hourly">Hourly</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </FG>
                            <FG label="Rate"><input className={inputCls} type="number" step="0.01" value={editForm.data.rate} onChange={e => { editForm.setData('rate', e.target.value); editForm.setData('amount', computeAmount(editForm.data.pay_type, e.target.value, editForm.data.hours)); }} placeholder="0.00" /></FG>
                            {editForm.data.pay_type === 'hourly' ? (
                                <FG label="Hours"><input className={inputCls} type="number" step="0.5" value={editForm.data.hours} onChange={e => { editForm.setData('hours', e.target.value); editForm.setData('amount', computeAmount(editForm.data.pay_type, editForm.data.rate, e.target.value)); }} placeholder="0" /></FG>
                            ) : (
                                <FG label="Currency">
                                    <select className={inputCls} value={editForm.data.currency} onChange={e => editForm.setData('currency', e.target.value)}>
                                        {['PHP','USD','JPY','EUR','GBP','SGD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </FG>
                            )}
                        </div>
                        <FG label="Total Amount *">
                            <input className={`${inputCls} text-[16px] font-bold`} type="number" step="0.01" value={editForm.data.amount} onChange={e => editForm.setData('amount', e.target.value)} placeholder="0.00" />
                        </FG>
                        <FG label="Notes"><input className={inputCls} value={editForm.data.notes} onChange={e => editForm.setData('notes', e.target.value)} placeholder="e.g. April salary, overtime, bonus" /></FG>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ── PAGES TAB ────────────────────────────────────────────────────────────────
function PagesTab({ project, canManage }) {
    const [showEditor, setShowEditor] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [copied, setCopied] = useState(null);
    const [docModal, setDocModal] = useState(null); // page id
    const [previewDoc, setPreviewDoc] = useState(null);
    const pages = project.pages ?? [];

    const { data, setData, post, put, processing, reset, errors } = useForm({ title: '', content: '' });

    const docForm = useForm({ name: '', type: 'other', file: null, page_id: null });
    const submitDoc = () => {
        docForm.post(route('projects.documents.store', project.id), {
            forceFormData: true,
            onSuccess: () => { setDocModal(null); docForm.reset(); },
        });
    };
    const deletePageDoc = (doc) => {
        if (confirm('Delete this document?')) {
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
            const isFullDoc = html.includes('<!DOCTYPE') || html.includes('<html');
            // Keep full HTML (with styles) for full documents, extract body for fragments
            const content = isFullDoc ? html : (html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1]?.trim() ?? html);
            setEditingPage(null);
            setData({ title, content });
            // Skip editor for full HTML docs — save directly
            if (isFullDoc) {
                router.post(route('projects.pages.store', project.id), { title, content });
            } else {
                setShowEditor(true);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const submit = () => {
        if (editingPage) {
            put(route('projects.pages.update', [project.id, editingPage.id]), { onSuccess: () => { setShowEditor(false); setEditingPage(null); } });
        } else {
            post(route('projects.pages.store', project.id), { onSuccess: () => { setShowEditor(false); reset(); } });
        }
    };

    const deletePage = (page) => {
        if (confirm(`Delete "${page.title}"?`)) {
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

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Pages</h3>
                {canManage && (
                    <div className="flex gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#4b5563] border border-[#d1d5db] hover:bg-gray-100 cursor-pointer transition-all">
                            <Upload size={13} /> Import HTML
                            <input type="file" accept=".html,.htm" className="hidden" onChange={importHtmlFile} />
                        </label>
                        <Btn primary sm onClick={openNew}><Plus size={13} /> New Page</Btn>
                    </div>
                )}
            </div>

            {pages.length === 0 && !showEditor && (
                <div className="text-center py-14 text-[#6b7280]">
                    <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><FileText size={24} className="text-indigo-400" /></div></div>
                    <div className="text-[14px] font-semibold text-black mb-1">No pages yet</div>
                    <div className="text-[13px] text-[#6b7280] mb-4">Create pages to share meeting notes, specs, or updates</div>
                    {canManage && <Btn primary onClick={openNew}><Plus size={15} /> Create First Page</Btn>}
                </div>
            )}

            {/* Page list */}
            {!showEditor && pages.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    {pages.map(page => {
                        const isHtml = (page.content ?? '').includes('<!DOCTYPE') || (page.content ?? '').includes('<html');
                        return (
                            <div key={page.id} className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden hover:shadow-md hover:border-[#4f6df5]/30 transition-all group">
                                {/* Preview bar */}
                                <div className={`h-1.5 ${isHtml ? 'bg-gradient-to-r from-violet-500 to-indigo-500' : 'bg-gradient-to-r from-[#4f6df5] to-[#6380f7]'}`} />

                                <div className="p-5">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isHtml ? 'bg-violet-50 text-violet-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                            {isHtml ? <Code size={18} /> : <FileText size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[14px] font-bold text-black group-hover:text-[#4f6df5] transition-colors truncate">{page.title}</div>
                                            <div className="text-[11px] text-[#9ca3af] mt-0.5 flex items-center gap-1.5">
                                                {page.creator?.name && <span>{page.creator.name}</span>}
                                                {page.updated_at && <span>· {new Date(page.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                                {isHtml && <span className="text-[9px] px-1.5 py-0.5 bg-violet-50 text-violet-500 rounded font-medium">HTML</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content preview */}
                                    {page.content && !isHtml && (
                                        <div className="text-[12px] text-[#6b7280] line-clamp-2 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: page.content.replace(/<[^>]*>/g, ' ').slice(0, 150) }} />
                                    )}
                                    {isHtml && (
                                        <div className="text-[12px] text-[#6b7280] mb-3 bg-[#fafbfc] rounded-lg px-3 py-2 border border-[#f0f0f0] font-mono line-clamp-2">Full HTML document with styles</div>
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
                                            <div className="text-[10px] tracking-[1.2px] uppercase text-[#9ca3af] font-medium mb-1.5">Attached Documents</div>
                                            <div className="space-y-1">
                                                {page.documents.map(doc => (
                                                    <div key={doc.id} className="flex items-center gap-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-2.5 py-1.5">
                                                        <span className="text-[13px]">{DOC_ICONS[doc.type] ?? '📁'}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[11px] font-medium text-black truncate">{doc.name}</div>
                                                            <div className="text-[9px] text-[#9ca3af]">{doc.uploader?.name ?? 'Team'} · {doc.file_size ?? ''}</div>
                                                        </div>
                                                        <button onClick={() => setPreviewDoc(doc)} className="text-[#6b7280] hover:text-[#4f6df5] transition-colors"><Eye size={12} /></button>
                                                        <a href={`/documents/${doc.id}/download`} className="text-[#6b7280] hover:text-black transition-colors"><Download size={12} /></a>
                                                        {canManage && <button onClick={() => deletePageDoc(doc)} className="text-[#d1d5db] hover:text-red-400 transition-colors"><Trash2 size={12} /></button>}
                                                    </div>
                                                ))}
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
                                                {!isHtml && <Btn ghost sm onClick={() => openEdit(page)}><Pencil size={13} /></Btn>}
                                                <button onClick={() => deletePage(page)} className="text-[#9ca3af] hover:text-red-500 transition-colors p-1.5"><Trash2 size={14} /></button>
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
                    <Suspense fallback={<div className="text-[13px] text-[#6b7280] p-4">Loading editor…</div>}>
                        <RichEditor content={data.content} onChange={val => setData('content', val)} placeholder="Write your page content…" />
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
                            <select className={inputCls} value={docForm.data.type} onChange={e => docForm.setData('type', e.target.value)}>
                                {['contract','brief','report','asset','other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                            </select>
                        </FG>
                        <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center text-[#6b7280]">
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

            <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        </>
    );
}

// ── MAIN SHOW PAGE ─────────────────────────────────────────────────────────────
export default function Show({ project, canManage, nextInvoiceNumber, nextProposalNumber }) {
    // Sync tab with URL hash
    const validTabs = ['overview','proposal','invoices','meetings','documents','timeline','tasks','bills','payroll','pages'];
    const hashTab = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    const [tab, setTabState] = useState(validTabs.includes(hashTab) ? hashTab : 'overview');
    const setTab = (t) => {
        setTabState(t);
        window.history.replaceState(null, '', `#${t}`);
    };
    const projectCur = getCurrency(project.currency ?? 'USD');
    const fmt = (n) => formatMoney(n, projectCur.code);

    const tabs = [
        { id: 'overview',   label: 'Overview',    icon: <Eye size={15} /> },
        { id: 'proposal',   label: `Proposal (${project.proposals?.length ?? 0})`, icon: <FileText size={15} /> },
        { id: 'invoices',   label: `Invoices (${project.invoices?.length ?? 0})`,  icon: <Receipt size={15} /> },
        { id: 'meetings',   label: `Meetings (${project.meetings?.length ?? 0})`,  icon: <CalendarDays size={15} /> },
        { id: 'documents',  label: `Documents (${project.documents?.length ?? 0})`, icon: <FolderOpen size={15} /> },
        { id: 'timeline',   label: 'Timeline',    icon: <Clock size={15} /> },
        { id: 'tasks',      label: `Tasks (${project.tasks?.length ?? 0})`,        icon: <ListChecks size={15} /> },
        { id: 'bills',      label: `Bills (${project.bills?.length ?? 0})`,        icon: <Receipt size={15} /> },
        { id: 'payroll',    label: `Payroll (${project.payroll?.length ?? 0})`,    icon: <Users size={15} /> },
        { id: 'pages',      label: `Pages (${project.pages?.length ?? 0})`,        icon: <FileText size={15} /> },
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
            <div className="-mx-4 md:-mx-8 px-4 md:px-8 border-b border-[#e5e7eb] mb-7 flex gap-0 overflow-x-auto">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-2.5 md:px-4 py-3 md:py-3.5 text-[12px] md:text-[13px] font-medium border-b-2 whitespace-nowrap transition-all
                            ${tab === t.id
                                ? 'border-[#4f6df5] text-[#4f6df5]'
                                : 'border-transparent text-[#6b7280] hover:text-black'
                            }`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'overview'  && <OverviewTab  project={project} canManage={canManage} fmt={fmt} />}
            {tab === 'proposal'  && <ProposalTab  project={project} canManage={canManage} nextNumber={nextProposalNumber} fmt={fmt} />}
            {tab === 'invoices'  && <InvoicesTab  project={project} canManage={canManage} nextNumber={nextInvoiceNumber} fmt={fmt} />}
            {tab === 'meetings'  && <MeetingsTab  project={project} canManage={canManage} />}
            {tab === 'documents' && <DocumentsTab project={project} canManage={canManage} />}
            {tab === 'timeline'  && <TimelineTab  project={project} />}
            {tab === 'tasks'     && <TasksTab     project={project} canManage={canManage} />}
            {tab === 'bills'     && <BillsTab     project={project} canManage={canManage} fmt={fmt} />}
            {tab === 'payroll'   && <PayrollTab   project={project} canManage={canManage} fmt={fmt} />}
            {tab === 'pages'     && <PagesTab     project={project} canManage={canManage} />}
        </AppLayout>
    );
}
