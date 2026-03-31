import { useState, lazy, Suspense } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';
import currencies from '@/Utils/currencies';
import {
    Pencil, Eye, Plus, Save, X, Check, Send, ChevronUp, ChevronDown,
    FileText, Receipt, CalendarDays, FolderOpen, Clock, ListChecks,
    Trash2, Download, Upload, CheckCircle, XCircle, AlertCircle,
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-5" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`bg-white border border-[#d1d5db] rounded-2xl w-full flex flex-col max-h-[88vh] ${large ? 'max-w-[660px]' : 'max-w-[560px]'}`}>
                <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
                    <div>
                        <div className="font-serif text-[21px] font-semibold text-black">{title}</div>
                        {subtitle && <div className="text-[12px] text-[#6b7280] mt-1">{subtitle}</div>}
                    </div>
                    <button onClick={onClose} className="text-[#6b7280] hover:text-black text-[22px] leading-none transition-colors">×</button>
                </div>
                <div className="px-6 pb-2 overflow-y-auto flex-1">{children}</div>
                {footer && <div className="flex justify-end gap-2.5 p-6 pt-4 flex-shrink-0">{footer}</div>}
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
        budget: project.budget ?? '', currency: project.currency ?? 'USD', description: project.description ?? '',
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
                        <p className="text-[14px] text-[#6b7280] mt-1">{project.client} · {project.contact_name}</p>
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
                <div className="grid grid-cols-4 border-t border-[#e5e7eb] pt-4 gap-0">
                    {[
                        { label: 'Progress', value: `${project.progress}%` },
                        { label: 'Budget', value: `${fmt(project.spent)} / ${fmt(project.budget)}` },
                        { label: 'Timeline', value: `${fmtDate(project.start_date)} – ${fmtDate(project.end_date)}` },
                        { label: 'Phase', value: project.phase },
                    ].map((s, i) => (
                        <div key={i} className={`text-center py-1 ${i < 3 ? 'border-r border-[#e5e7eb]' : ''}`}>
                            <div className="text-[16px] font-medium text-black">{s.value}</div>
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

            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-4">
                    {/* Description */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Project Description</span></div>
                        <div className="px-5 py-4 text-[13.5px] text-[#4b5563] leading-relaxed">{project.description ?? '—'}</div>
                    </div>

                    {/* Client Info */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Client Information</span></div>
                        <div className="px-5 py-4 grid grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {[
                                    { l: 'Project Budget', v: fmt(project.budget), serif: true },
                                    { l: 'Total Spent', v: fmt(project.spent), serif: true, warn: budgetPct > 90 },
                                    { l: 'Total Billed', v: fmt(project.total_billed) },
                                    { l: 'Received', v: fmt(project.total_paid), green: true },
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

            {/* Edit Project Modal */}
            {showEditModal && (
                <Modal title="Edit Project" subtitle={project.name} large onClose={() => setShowEditModal(false)} footer={
                    <><Btn ghost onClick={() => setShowEditModal(false)}><X size={13} /> Cancel</Btn>
                    <Btn primary onClick={saveEdit} disabled={editForm.processing}><Save size={13} /> Save Changes</Btn></>
                }>
                    <div className="space-y-4 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Project Name *" error={editForm.errors.name}><input className={inputCls} value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} /></FG>
                            <FG label="Client / Company" error={editForm.errors.client}><input className={inputCls} value={editForm.data.client} onChange={e => editForm.setData('client', e.target.value)} /></FG>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <FG label="Contact Name"><input className={inputCls} value={editForm.data.contact_name} onChange={e => editForm.setData('contact_name', e.target.value)} /></FG>
                            <FG label="Contact Email"><input className={inputCls} type="email" value={editForm.data.contact_email} onChange={e => editForm.setData('contact_email', e.target.value)} /></FG>
                            <FG label="Contact Phone"><input className={inputCls} value={editForm.data.contact_phone} onChange={e => editForm.setData('contact_phone', e.target.value)} /></FG>
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
                            <FG label="Budget" error={editForm.errors.budget}>
                                <div className="flex gap-2">
                                    <select value={editForm.data.currency} onChange={e => editForm.setData('currency', e.target.value)} className={`${inputCls} w-[110px] flex-shrink-0 text-[12px]`}>
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                                    </select>
                                    <input className={inputCls} type="number" value={editForm.data.budget} onChange={e => editForm.setData('budget', e.target.value)} />
                                </div>
                            </FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Start Date"><input className={inputCls} type="date" value={editForm.data.start_date} onChange={e => editForm.setData('start_date', e.target.value)} /></FG>
                            <FG label="End Date"><input className={inputCls} type="date" value={editForm.data.end_date} onChange={e => editForm.setData('end_date', e.target.value)} /></FG>
                        </div>
                        <FG label="Description">
                            <textarea className={`${inputCls} resize-y min-h-[120px]`} value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} placeholder="Project overview and goals…" />
                        </FG>
                        <FG label="Tags (comma-separated)" error={editForm.errors.tags}>
                            <input className={inputCls} value={editForm.data.tags} onChange={e => editForm.setData('tags', e.target.value)} placeholder="e.g. Branding, Design, Marketing" />
                        </FG>
                    </div>
                </Modal>
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
    const [showInvite, setShowInvite] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ name: '', email: '' });

    const submit = () => {
        post(route('projects.client-access.store', project.id), {
            onSuccess: () => { setShowInvite(false); reset(); },
        });
    };

    const removeAccess = () => {
        if (confirm('Remove client access from this project?')) {
            router.delete(route('projects.client-access.destroy', project.id));
        }
    };

    const clientUser = project.client_user;

    return (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb]">
                <span className="text-[16px] font-bold text-black">Client Portal Access</span>
                {canManage && !clientUser && (
                    <Btn ghost sm onClick={() => setShowInvite(!showInvite)}>
                        {showInvite ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Invite Client</>}
                    </Btn>
                )}
            </div>

            {showInvite && (
                <div className="px-5 py-4 bg-[#fafbfc] border-b border-[#e5e7eb]">
                    <p className="text-[12px] text-[#6b7280] mb-3">Create a client account or link an existing one. They'll be able to view this project's proposals, invoices, and meetings.</p>
                    <div className="grid grid-cols-3 gap-3">
                        <FG label="Client Name *" error={errors.name}>
                            <input className={inputCls} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Full name" />
                        </FG>
                        <FG label="Client Email *" error={errors.email}>
                            <input className={inputCls} type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="client@company.com" />
                        </FG>
                        <div className="flex items-end">
                            <Btn primary sm onClick={submit} disabled={processing || !data.name || !data.email}>
                                <Plus size={13} /> {processing ? 'Creating…' : 'Grant Access'}
                            </Btn>
                        </div>
                    </div>
                </div>
            )}

            {clientUser ? (
                <div className="flex items-center gap-3 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[12px] font-bold text-emerald-600 flex-shrink-0">
                        {(clientUser.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="text-[13px] font-semibold text-black">{clientUser.name}</div>
                        <div className="text-[11px] text-[#6b7280]">{clientUser.email} · Can view proposals, invoices & meetings</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full font-medium">Active</span>
                    {canManage && (
                        <button onClick={removeAccess} className="text-[#9ca3af] hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            ) : (
                !showInvite && <div className="px-5 py-5 text-center text-[13px] text-[#6b7280]">No client has access to this project yet</div>
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
            <div className="grid grid-cols-3 gap-3 mb-6">
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
    const [filter, setFilter] = useState('all');
    const [kickoffNotes, setKickoffNotes] = useState(null);
    const meetings = project.meetings ?? [];
    const filtered = filter === 'all' ? meetings : meetings.filter(m => m.status === filter);

    const { data, setData, post, processing, reset, errors } = useForm({
        type: 'kickoff', title: 'Project Kickoff Meeting', date: '', time: '', duration: '1 hr', location: '', attendees: '', notes: '',
    });

    const typeToTitle = { kickoff:'Project Kickoff Meeting', review:'Project Review', checkin:'Monthly Check-in', presentation:'Client Presentation', discovery:'Discovery Session', other:'Meeting' };
    const submit = () => {
        const payload = kickoffNotes ? {
            ...data,
            type: 'kickoff',
            title: `Project Kickoff — ${project.name}`,
            duration: data.duration || '1 hr',
            notes: kickoffNotes,
        } : data;

        router.post(route('projects.meetings.store', project.id), payload, {
            onSuccess: () => { setShowModal(false); reset(); setKickoffNotes(null); },
        });
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
                                {canManage && m.status === 'scheduled' && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Btn ghost sm onClick={() => updateStatus(m, 'completed')}><CheckCircle size={13} /> Complete</Btn>
                                        <Btn danger sm onClick={() => updateStatus(m, 'cancelled')}><XCircle size={13} /> Cancel</Btn>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <Modal title="Schedule Meeting" subtitle={`For ${project.name}`} onClose={() => setShowModal(false)} footer={<><Btn ghost onClick={() => setShowModal(false)}>Cancel</Btn><Btn primary onClick={submit} disabled={processing}>{processing ? 'Scheduling…' : 'Schedule'}</Btn></>}>
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

// ── DOCUMENTS TAB ─────────────────────────────────────────────────────────────
function DocumentsTab({ project, canManage }) {
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const documents = project.documents ?? [];
    const filtered = filter === 'all' ? documents : documents.filter(d => d.type === filter);

    const { data, setData, post, processing, reset } = useForm({ name: '', type: 'contract', file: null });
    const submit = () => { post(route('projects.documents.store', project.id), { onSuccess: () => { setShowModal(false); reset(); } }); };

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
                        <a href={`/documents/${doc.id}/download`} className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7280] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100"><Download size={13} /> Download</a>
                    </div>
                ))}
            </div>

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
        </>
    );
}

// ── TIMELINE TAB ──────────────────────────────────────────────────────────────
function TimelineTab({ project }) {
    const today = new Date();
    const start = new Date(project.start_date);
    const end   = new Date(project.end_date);
    const daysLeft = Math.max(0, Math.round((end - today) / (1000 * 60 * 60 * 24)));

    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10); };

    const phases = [
        { name: 'Discovery & Brief',      from: project.start_date, to: addDays(project.start_date, 14),  desc: 'Initial client meetings, requirements gathering, and project brief approval.', done: project.progress >= 10 },
        { name: 'Strategy & Planning',     from: addDays(project.start_date, 14), to: addDays(project.start_date, 45), desc: 'Strategic framework, timeline confirmation, resource allocation.', done: project.progress >= 30 },
        { name: 'Design & Development',    from: addDays(project.start_date, 45), to: addDays(project.start_date, 120), desc: 'Core creative or development work. Regular client check-ins and milestone reviews.', active: project.progress < 75, done: project.progress >= 75 },
        { name: 'Client Review & Revisions', from: addDays(project.start_date, 120), to: addDays(project.start_date, 155), desc: 'Structured feedback rounds, revisions, and formal approval.', active: project.progress >= 75 && project.progress < 90, done: project.progress >= 90 },
        { name: 'Final Delivery',          from: addDays(project.start_date, 155), to: project.end_date,  desc: 'Final file delivery, handover documentation, and project closure.', done: project.progress === 100 },
    ];

    return (
        <div className="grid grid-cols-2 gap-5">
            <div>
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Phase Timeline</span></div>
                    <div className="px-5 py-5">
                        {phases.map((ph, i) => (
                            <div key={i} className="flex gap-4 pb-6 last:pb-0">
                                <div className="flex flex-col items-center w-7 flex-shrink-0">
                                    <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-0.5 ${ph.done ? 'border-green-400 bg-green-400' : ph.active ? 'border-[#4f6df5] bg-[#4f6df5]' : 'border-[#d1d5db] bg-white'}`} />
                                    {i < phases.length - 1 && <div className="w-px flex-1 bg-[#e5e7eb] mt-1" />}
                                </div>
                                <div className="flex-1 pt-0">
                                    <div className="text-[10.5px] text-[#6b7280] mb-1">{fmtDate(ph.from)} → {fmtDate(ph.to)}</div>
                                    <div className="text-[13.5px] font-medium text-black mb-1">
                                        {ph.name} {ph.done ? <span className="text-green-400 text-[11px]">✓</span> : ph.active ? <span className="text-[#4f6df5] text-[11px]">← Current</span> : ''}
                                    </div>
                                    <div className="text-[12px] text-[#6b7280] leading-relaxed">{ph.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Key Dates</span></div>
                    <div className="px-5 py-2">
                        {[
                            { l: 'Project Start', v: fmtDate(project.start_date), c: 'text-green-400' },
                            { l: 'Planned End', v: fmtDate(project.end_date), c: end < today ? 'text-red-400' : 'text-black' },
                            { l: 'Days Remaining', v: `${daysLeft} days`, c: daysLeft < 14 ? 'text-orange-400' : 'text-black' },
                            { l: 'Current Phase', v: project.phase, c: 'text-[#4f6df5]' },
                        ].map(({ l, v, c }) => (
                            <div key={l} className="flex justify-between py-3 border-b border-[#e5e7eb] last:border-b-0 text-[13px]">
                                <span className="text-[#6b7280]">{l}</span>
                                <span className={`font-medium ${c}`}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#e5e7eb]"><span className="text-[15px] font-bold">Phase Progress</span></div>
                    <div className="px-5 py-4 space-y-3">
                        {phases.map((ph, i) => {
                            const pct = ph.done ? 100 : ph.active ? Math.min(99, project.progress) : 0;
                            return (
                                <div key={i}>
                                    <div className="flex justify-between text-[12px] text-[#6b7280] mb-1.5">
                                        <span className="truncate pr-2">{ph.name}</span>
                                        <span className={ph.done ? 'text-green-400' : ph.active ? 'text-[#4f6df5]' : 'text-[#d1d5db]'}>{ph.done ? 'Complete' : ph.active ? 'In Progress' : 'Upcoming'}</span>
                                    </div>
                                    <div className="h-1.5 bg-[#d1d5db] rounded-full overflow-hidden">
                                        <div className="h-full rounded-full progress-fill" style={{ width: `${pct}%`, background: ph.done ? '#3ecf8e' : ph.active ? 'linear-gradient(90deg,#4f6df5,#6380f7)' : '#d1d5db' }} />
                                    </div>
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
    const tasks = project.tasks ?? [];
    const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

    const { data, setData, post, processing, reset } = useForm({
        title: '', assignee: '', due_date: '', priority: 'medium', status: 'not-started', category: 'Deliverable',
    });
    const submit = () => post(route('projects.tasks.store', project.id), { onSuccess: () => { setShowModal(false); reset(); } });

    const cycleStatus = (task) => {
        const next = { 'not-started': 'in-progress', 'in-progress': 'completed', 'review': 'completed', 'completed': 'not-started' };
        router.patch(route('tasks.status', task.id), { status: next[task.status] ?? 'not-started' });
    };

    // Group by category
    const byCategory = {};
    filtered.forEach(t => { if (!byCategory[t.category]) byCategory[t.category] = []; byCategory[t.category].push(t); });

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[17px] font-bold">Task List</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}>+ Add Task</Btn>}
            </div>
            <div className="flex gap-2 mb-5">
                {['all','not-started','in-progress','review','completed'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all ${filter === s ? 'bg-[#4f6df5]/10 border-[#4f6df5]/30 text-[#4f6df5]' : 'border-[#d1d5db] text-[#4b5563] hover:text-black hover:bg-gray-100'}`}>
                        {s === 'all' ? 'All' : s === 'not-started' ? 'Not Started' : s === 'in-progress' ? 'In Progress' : s === 'review' ? 'Review' : 'Completed'}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && <div className="text-center py-14 text-[#6b7280]"><div className="text-4xl mb-3 opacity-50">✅</div><div className="text-[14px] mb-5">No tasks found</div>{canManage && <Btn primary onClick={() => setShowModal(true)}>Add First Task</Btn>}</div>}

            {Object.entries(byCategory).map(([cat, catTasks]) => (
                <div key={cat} className="mb-5">
                    <div className="text-[10.5px] tracking-[1.5px] uppercase text-[#6b7280] mb-2 pb-2 border-b border-[#e5e7eb]">{cat}</div>
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        {catTasks.map(t => (
                            <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e5e7eb] last:border-b-0">
                                <button
                                    onClick={() => cycleStatus(t)}
                                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                                        ${t.status === 'completed' ? 'border-green-400 bg-green-400' : 'border-[#d1d5db] hover:border-[#4f6df5]'}`}
                                >
                                    {t.status === 'completed' && <span className="text-[#0b0d14] text-[10px] font-bold">✓</span>}
                                </button>
                                <div className="flex-1">
                                    <div className={`text-[13.5px] ${t.status === 'completed' ? 'line-through text-[#6b7280]' : 'text-black'}`}>{t.title}</div>
                                    <div className="text-[11.5px] text-[#6b7280]">{t.assignee}{t.due_date ? ` · Due ${fmtDate(t.due_date)}` : ''}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge status={t.priority} />
                                    <Badge status={t.status} label={t.status === 'not-started' ? 'Not Started' : t.status === 'in-progress' ? 'In Progress' : t.status === 'review' ? 'Review' : 'Done'} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {showModal && (
                <Modal title="Add Task" subtitle={`For ${project.name}`} onClose={() => setShowModal(false)} footer={<><Btn ghost onClick={() => setShowModal(false)}>Cancel</Btn><Btn primary onClick={submit} disabled={processing}>{processing ? 'Adding…' : 'Add Task'}</Btn></>}>
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

// ── MAIN SHOW PAGE ─────────────────────────────────────────────────────────────
export default function Show({ project, canManage, nextInvoiceNumber, nextProposalNumber }) {
    const [tab, setTab] = useState('overview');
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
            <div className="-mx-8 px-8 border-b border-[#e5e7eb] mb-7 flex gap-0 overflow-x-auto">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-all
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
        </AppLayout>
    );
}
