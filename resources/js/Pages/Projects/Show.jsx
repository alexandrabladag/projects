import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt    = (n) => '$' + Number(n ?? 0).toLocaleString();
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const parseDay = (s) => { const d = new Date(s); return { day: d.getDate(), mon: d.toLocaleString('en-US', { month: 'short' }) }; };
const MTG_TYPES   = { kickoff:'Kickoff', review:'Review', checkin:'Check-in', presentation:'Presentation', discovery:'Discovery', other:'Other' };
const DOC_ICONS   = { contract:'📋', brief:'📝', report:'📊', asset:'🖼️', other:'📁' };
const DOC_COLORS  = { contract:'bg-red-500/10', brief:'bg-orange-500/10', report:'bg-blue-500/10', asset:'bg-purple-500/10', other:'bg-white/5' };

// ── Modal Wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, subtitle, large, onClose, children, footer }) {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`bg-[#171a28] border border-[#252b40] rounded-2xl w-full flex flex-col max-h-[88vh] ${large ? 'max-w-[660px]' : 'max-w-[560px]'}`}>
                <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
                    <div>
                        <div className="font-serif text-[21px] font-semibold text-[#e2dcd2]">{title}</div>
                        {subtitle && <div className="text-[12px] text-[#58607a] mt-1">{subtitle}</div>}
                    </div>
                    <button onClick={onClose} className="text-[#58607a] hover:text-[#e2dcd2] text-[22px] leading-none transition-colors">×</button>
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
        {label && <label className="block text-[10px] tracking-[1.2px] uppercase text-[#58607a] font-medium mb-2">{label}</label>}
        {children}
        {error && <p className="text-red-400 text-[12px] mt-1">{error}</p>}
    </div>
);
const inputCls = 'w-full bg-[#11131d] border border-[#252b40] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e2dcd2] outline-none focus:border-[#c9a464] transition-colors';
const Btn = ({ children, primary, ghost, danger, sm, onClick, type = 'button', disabled }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all disabled:opacity-60 whitespace-nowrap
            ${sm ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2.5 text-[13px]'}
            ${primary ? 'bg-[#c9a464] hover:bg-[#d4b472] text-[#0b0d14]' : ''}
            ${ghost  ? 'bg-transparent text-[#9a9180] border border-[#252b40] hover:bg-white/[0.03] hover:text-[#e2dcd2]' : ''}
            ${danger ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15' : ''}
        `}
    >{children}</button>
);

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────
function OverviewTab({ project, canManage }) {
    const [editMode, setEditMode] = useState(false);
    const { data, setData, patch, processing } = useForm({ progress: project.progress, phase: project.phase });

    const saveProgress = () => {
        patch(route('projects.progress', project.id), { onSuccess: () => setEditMode(false) });
    };

    const budgetPct = project.budget > 0 ? Math.min(100, Math.round((project.spent / project.budget) * 100)) : 0;
    const budgetColor = budgetPct > 90 ? '#f56060' : budgetPct > 70 ? '#f0924c' : '';

    return (
        <div>
            {/* Hero */}
            <div className="bg-[#171a28] border border-[#1d2236] rounded-xl p-6 mb-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="font-serif text-[28px] font-semibold text-[#e2dcd2] leading-snug">{project.name}</h2>
                        <p className="text-[14px] text-[#58607a] mt-1">{project.client} · {project.contact_name}</p>
                        <div className="flex gap-2 flex-wrap mt-2.5">
                            <Badge status={project.status} />
                            <span className="text-[11px] px-2 py-0.5 bg-white/[0.05] border border-[#252b40] rounded text-[#9a9180]">{project.phase}</span>
                            {(project.tags ?? []).map(t => <span key={t} className="text-[11px] px-2 py-0.5 bg-white/[0.05] border border-[#252b40] rounded text-[#9a9180]">{t}</span>)}
                        </div>
                    </div>
                    {canManage && !editMode && (
                        <Btn ghost sm onClick={() => setEditMode(true)}>✎ Edit Progress</Btn>
                    )}
                    {editMode && (
                        <div className="flex items-center gap-2">
                            <input type="number" min="0" max="100" value={data.progress} onChange={e => setData('progress', e.target.value)} className={`${inputCls} w-20`} />
                            <input type="text" value={data.phase} onChange={e => setData('phase', e.target.value)} placeholder="Phase" className={`${inputCls} w-36`} />
                            <Btn primary sm onClick={saveProgress} disabled={processing}>Save</Btn>
                            <Btn ghost sm onClick={() => setEditMode(false)}>Cancel</Btn>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 border-t border-[#1d2236] pt-4 gap-0">
                    {[
                        { label: 'Progress', value: `${project.progress}%` },
                        { label: 'Budget', value: `${fmt(project.spent)} / ${fmt(project.budget)}` },
                        { label: 'Timeline', value: `${fmtDate(project.start_date)} – ${fmtDate(project.end_date)}` },
                        { label: 'Phase', value: project.phase },
                    ].map((s, i) => (
                        <div key={i} className={`text-center py-1 ${i < 3 ? 'border-r border-[#1d2236]' : ''}`}>
                            <div className="text-[16px] font-medium text-[#e2dcd2]">{s.value}</div>
                            <div className="text-[11px] text-[#58607a] mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                    <div className="flex justify-between text-[12px] text-[#58607a] mb-2"><span>Overall Progress</span><span>{project.progress}%</span></div>
                    <div className="h-2 bg-[#252b40] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#c9a464] to-[#d4b472] progress-fill" style={{ width: `${project.progress}%` }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-4">
                    {/* Description */}
                    <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#1d2236]"><span className="font-serif text-[16px] font-semibold">Project Description</span></div>
                        <div className="px-5 py-4 text-[13.5px] text-[#9a9180] leading-relaxed">{project.description ?? '—'}</div>
                    </div>

                    {/* Client Info */}
                    <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#1d2236]"><span className="font-serif text-[16px] font-semibold">Client Information</span></div>
                        <div className="px-5 py-4 grid grid-cols-2 gap-4">
                            {[
                                { l: 'Contact', v: project.contact_name },
                                { l: 'Email', v: project.contact_email, gold: true },
                                { l: 'Phone', v: project.contact_phone },
                                { l: 'Company', v: project.client },
                            ].map(({ l, v, gold }) => (
                                <div key={l}>
                                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#58607a] mb-1">{l}</div>
                                    <div className={`text-[13.5px] ${gold ? 'text-[#c9a464]' : 'text-[#e2dcd2]'}`}>{v ?? '—'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Financial */}
                    <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#1d2236]"><span className="font-serif text-[16px] font-semibold">Financial Overview</span></div>
                        <div className="px-5 py-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {[
                                    { l: 'Project Budget', v: fmt(project.budget), serif: true },
                                    { l: 'Total Spent', v: fmt(project.spent), serif: true, warn: budgetPct > 90 },
                                    { l: 'Total Billed', v: fmt(project.total_billed) },
                                    { l: 'Received', v: fmt(project.total_paid), green: true },
                                ].map(({ l, v, serif, warn, green }) => (
                                    <div key={l}>
                                        <div className="text-[10px] tracking-[1.5px] uppercase text-[#58607a] mb-1">{l}</div>
                                        <div className={`${serif ? 'font-serif text-[20px] font-semibold' : 'text-[14px]'} ${warn ? 'text-red-400' : green ? 'text-green-400' : 'text-[#e2dcd2]'}`}>{v}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-[12px] text-[#58607a] flex justify-between mb-1.5"><span>Budget utilization</span><span style={{ color: budgetColor || '#9a9180' }}>{budgetPct}%</span></div>
                            <div className="h-1.5 bg-[#252b40] rounded-full overflow-hidden">
                                <div className="h-full rounded-full progress-fill" style={{ width: `${budgetPct}%`, background: budgetColor || 'linear-gradient(90deg, #c9a464, #d4b472)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#1d2236]"><span className="font-serif text-[16px] font-semibold">Quick Summary</span></div>
                        <div className="px-5 py-2">
                            {[
                                { l: 'Proposals', v: `${project.proposals?.length ?? 0} total` },
                                { l: 'Invoices', v: `${project.invoices?.length ?? 0} total · ${project.invoices?.filter(i => i.status === 'paid').length ?? 0} paid` },
                                { l: 'Meetings', v: `${project.meetings?.length ?? 0} total · ${project.meetings?.filter(m => m.status === 'scheduled').length ?? 0} upcoming` },
                                { l: 'Tasks', v: `${project.tasks?.filter(t => t.status === 'completed').length ?? 0} / ${project.tasks?.length ?? 0} complete` },
                            ].map(({ l, v }) => (
                                <div key={l} className="flex justify-between py-2.5 border-b border-[#1d2236] last:border-b-0 text-[13px]">
                                    <span className="text-[#58607a]">{l}</span>
                                    <span className="text-[#e2dcd2]">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── PROPOSAL TAB ──────────────────────────────────────────────────────────────
function ProposalTab({ project, canManage }) {
    const [showModal, setShowModal] = useState(false);
    const proposals = project.proposals ?? [];
    const [selected, setSelected] = useState(proposals[0] ?? null);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: `${project.client} — Project Proposal`,
        amount: project.budget ?? '',
        date: new Date().toISOString().slice(0, 10),
        valid_until: '',
        summary: '',
        scope: '',
        deliverables: [],
        notes: '',
    });

    const [newDel, setNewDel] = useState('');

    const submit = () => {
        post(route('projects.proposals.store', project.id), { onSuccess: () => { setShowModal(false); reset(); } });
    };

    const updateStatus = (proposal, status) => {
        router.patch(route('proposals.status', proposal.id), { status });
    };

    if (proposals.length === 0 && !showModal) {
        return (
            <div className="text-center py-16 text-[#58607a]">
                <div className="text-4xl mb-3 opacity-50">📄</div>
                <div className="text-[14px] mb-5">No proposal yet for this project</div>
                {canManage && <Btn primary onClick={() => setShowModal(true)}>Create Proposal</Btn>}
                {showModal && <ProposalModal project={project} data={data} setData={setData} newDel={newDel} setNewDel={setNewDel} processing={processing} errors={errors} onClose={() => setShowModal(false)} onSubmit={submit} />}
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="font-serif text-[18px] font-semibold">Proposal</h3>
                {canManage && proposals.length === 0 && <Btn primary sm onClick={() => setShowModal(true)}>+ New Proposal</Btn>}
            </div>

            {proposals.length > 1 && (
                <div className="flex gap-2 mb-4">
                    {proposals.map(p => (
                        <button key={p.id} onClick={() => setSelected(p)} className={`px-3 py-1.5 rounded-full text-[12px] border transition-all ${selected?.id === p.id ? 'bg-[#c9a464]/10 border-[#c9a464]/30 text-[#c9a464]' : 'border-[#252b40] text-[#9a9180]'}`}>
                            {p.title.slice(0, 30)}…
                        </button>
                    ))}
                </div>
            )}

            {(selected ?? proposals[0]) && (() => {
                const pr = selected ?? proposals[0];
                const statusCycle = { draft: 'sent', sent: 'approved' };
                return (
                    <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                        <div className="flex justify-between items-start px-6 py-5 border-b border-[#1d2236]">
                            <div>
                                <div className="font-serif text-[20px] font-semibold text-[#e2dcd2] mb-1">{pr.title}</div>
                                <div className="text-[12px] text-[#58607a]">Issued {fmtDate(pr.date)} · Valid until {fmtDate(pr.valid_until)}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge status={pr.status} />
                                <div className="font-serif text-[22px] font-semibold text-[#c9a464]">{fmt(pr.amount)}</div>
                                {canManage && statusCycle[pr.status] && (
                                    <Btn ghost sm onClick={() => updateStatus(pr, statusCycle[pr.status])}>
                                        Mark {statusCycle[pr.status].charAt(0).toUpperCase() + statusCycle[pr.status].slice(1)}
                                    </Btn>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-5">
                            {pr.summary && <Section title="Executive Summary"><p className="text-[13.5px] text-[#9a9180] leading-relaxed">{pr.summary}</p></Section>}
                            {pr.scope && (
                                <Section title="Scope of Work">
                                    {pr.scope.split('\n').filter(Boolean).map((s, i) => (
                                        <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[#1d2236] last:border-b-0 text-[13px] text-[#e2dcd2]">
                                            <span className="w-4 h-4 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[9px] text-green-400 flex-shrink-0">✓</span>
                                            {s}
                                        </div>
                                    ))}
                                </Section>
                            )}
                            {(pr.deliverables ?? []).length > 0 && (
                                <Section title="Deliverables">
                                    {(pr.deliverables ?? []).map((d, i) => (
                                        <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[#1d2236] last:border-b-0 text-[13.5px] text-[#e2dcd2]">
                                            <span className="w-4 h-4 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[9px] text-green-400 flex-shrink-0">✓</span>
                                            {d}
                                        </div>
                                    ))}
                                </Section>
                            )}
                            {pr.notes && <Section title="Notes & Terms"><p className="text-[13.5px] text-[#9a9180] leading-relaxed">{pr.notes}</p></Section>}
                        </div>
                    </div>
                );
            })()}

            {showModal && <ProposalModal project={project} data={data} setData={setData} newDel={newDel} setNewDel={setNewDel} processing={processing} errors={errors} onClose={() => setShowModal(false)} onSubmit={submit} />}
        </>
    );
}

function ProposalModal({ project, data, setData, newDel, setNewDel, processing, errors, onClose, onSubmit }) {
    const addDel = () => { if (newDel.trim()) { setData('deliverables', [...data.deliverables, newDel.trim()]); setNewDel(''); } };
    return (
        <Modal title="New Proposal" subtitle={`For ${project.name}`} large onClose={onClose} footer={<><Btn ghost onClick={onClose}>Cancel</Btn><Btn primary onClick={onSubmit} disabled={processing}>{processing ? 'Creating…' : 'Create Proposal'}</Btn></>}>
            <div className="space-y-4 pb-2">
                <FG label="Title" error={errors.title}><input className={inputCls} value={data.title} onChange={e => setData('title', e.target.value)} /></FG>
                <div className="grid grid-cols-2 gap-3">
                    <FG label="Amount ($)" error={errors.amount}><input className={inputCls} type="number" value={data.amount} onChange={e => setData('amount', e.target.value)} /></FG>
                    <FG label="Valid Until"><input className={inputCls} type="date" value={data.valid_until} onChange={e => setData('valid_until', e.target.value)} /></FG>
                </div>
                <FG label="Executive Summary"><textarea className={`${inputCls} resize-y min-h-[80px]`} value={data.summary} onChange={e => setData('summary', e.target.value)} placeholder="High-level overview…" /></FG>
                <FG label="Scope of Work"><textarea className={`${inputCls} resize-y min-h-[80px]`} value={data.scope} onChange={e => setData('scope', e.target.value)} placeholder="One scope item per line…" /></FG>
                <FG label="Deliverables">
                    {data.deliverables.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 py-2 border-b border-[#1d2236]">
                            <span className="text-green-400 text-[12px]">✓</span>
                            <span className="flex-1 text-[13px] text-[#e2dcd2]">{d}</span>
                            <button onClick={() => setData('deliverables', data.deliverables.filter((_, j) => j !== i))} className="text-[#58607a] hover:text-red-400 text-[18px]">×</button>
                        </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                        <input className={inputCls} value={newDel} onChange={e => setNewDel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDel()} placeholder="Add a deliverable…" />
                        <Btn ghost sm onClick={addDel}>Add</Btn>
                    </div>
                </FG>
                <FG label="Notes / Payment Terms"><textarea className={`${inputCls} resize-y`} value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Payment schedule, special terms…" /></FG>
            </div>
        </Modal>
    );
}

// ── INVOICES TAB ──────────────────────────────────────────────────────────────
function InvoicesTab({ project, canManage }) {
    const [showModal, setShowModal] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const invoices = project.invoices ?? [];

    const totalBilled   = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
    const totalPaid     = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total ?? 0), 0);
    const outstanding   = invoices.filter(i => ['sent','overdue'].includes(i.status)).reduce((s, i) => s + (i.total ?? 0), 0);

    const statusCycle = { draft: 'sent', sent: 'paid' };

    const updateStatus = (inv, status) => router.patch(route('invoices.status', inv.id), { status });

    const nextNum = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const { data, setData, post, processing, reset, errors } = useForm({
        number: nextNum, date: new Date().toISOString().slice(0, 10), due_date: '', description: '',
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
                <h3 className="font-serif text-[18px] font-semibold">Invoices</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}>+ New Invoice</Btn>}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {[{ l: 'Total Billed', v: fmt(totalBilled), c: 'text-[#e2dcd2]' }, { l: 'Paid', v: fmt(totalPaid), c: 'text-green-400' }, { l: 'Outstanding', v: fmt(outstanding), c: outstanding > 0 ? 'text-orange-400' : 'text-[#e2dcd2]' }].map(({ l, v, c }) => (
                    <div key={l} className="bg-[#11131d] border border-[#1d2236] rounded-xl p-4">
                        <div className="text-[10px] tracking-[1.5px] uppercase text-[#58607a] mb-1.5">{l}</div>
                        <div className={`font-serif text-[22px] font-semibold ${c}`}>{v}</div>
                    </div>
                ))}
            </div>

            {invoices.length === 0 && <div className="text-center py-14 text-[#58607a]"><div className="text-4xl mb-3 opacity-50">🧾</div><div className="text-[14px] mb-5">No invoices yet</div>{canManage && <Btn primary onClick={() => setShowModal(true)}>Create First Invoice</Btn>}</div>}

            <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                {invoices.map(inv => (
                    <div key={inv.id}>
                        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1d2236] cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2.5 mb-1">
                                    <span className="text-[13px] font-semibold text-[#c9a464]">{inv.number}</span>
                                    <Badge status={inv.status} />
                                </div>
                                <div className="text-[12px] text-[#58607a]">{inv.description}</div>
                            </div>
                            <div className="text-right mr-3">
                                <div className="font-serif text-[18px] font-semibold">{fmt(inv.total)}</div>
                                <div className="text-[11.5px] text-[#58607a]">{inv.status === 'paid' ? 'Paid' : `Due ${fmtDate(inv.due_date)}`}</div>
                            </div>
                            {canManage && statusCycle[inv.status] && (
                                <Btn ghost sm onClick={e => { e.stopPropagation(); updateStatus(inv, statusCycle[inv.status]); }}>
                                    {inv.status === 'draft' ? 'Mark Sent' : 'Mark Paid'}
                                </Btn>
                            )}
                            <span className="text-[#58607a] text-[12px]">{expanded === inv.id ? '▲' : '▼'}</span>
                        </div>
                        {expanded === inv.id && (
                            <div className="px-5 py-4 bg-[#11131d] border-b border-[#1d2236]">
                                <div className="grid grid-cols-[1fr_80px_90px_80px] gap-3 text-[10px] tracking-[1.2px] uppercase text-[#58607a] border-b border-[#1d2236] pb-2 mb-1">
                                    <span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span>
                                </div>
                                {(inv.items ?? []).map((item, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_80px_90px_80px] gap-3 py-2.5 border-b border-[#1d2236] last:border-b-0 text-[13px]">
                                        <span>{item.description}</span>
                                        <span className="text-[#58607a]">{item.quantity}</span>
                                        <span className="text-[#58607a]">{fmt(item.rate)}</span>
                                        <span className="font-medium">{fmt(item.quantity * item.rate)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-end gap-10 pt-3 text-[13.5px] border-t border-[#1d2236] mt-1">
                                    <span className="text-[#58607a]">Total</span>
                                    <span className="font-semibold text-[#e2dcd2]">{fmt(inv.total)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Create Invoice Modal */}
            {showModal && (
                <Modal title="New Invoice" subtitle={`For ${project.name}`} large onClose={() => setShowModal(false)} footer={<><Btn ghost onClick={() => setShowModal(false)}>Cancel</Btn><Btn primary onClick={submit} disabled={processing}>{processing ? 'Creating…' : 'Create Invoice'}</Btn></>}>
                    <div className="space-y-4 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Invoice #" error={errors.number}><input className={inputCls} value={data.number} onChange={e => setData('number', e.target.value)} /></FG>
                            <FG label="Description"><input className={inputCls} value={data.description} onChange={e => setData('description', e.target.value)} placeholder="e.g. Initial retainer — 40%" /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Invoice Date"><input className={inputCls} type="date" value={data.date} onChange={e => setData('date', e.target.value)} /></FG>
                            <FG label="Due Date"><input className={inputCls} type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} /></FG>
                        </div>
                        <div className="pt-2">
                            <div className="text-[10px] tracking-[2px] uppercase text-[#58607a] mb-3 flex items-center gap-3">Line Items<span className="flex-1 h-px bg-[#1d2236]" /></div>
                            <div className="grid grid-cols-[1fr_70px_90px_28px] gap-2 text-[10px] uppercase tracking-wide text-[#58607a] mb-2 px-0.5">
                                <span>Description</span><span>Qty</span><span>Rate</span><span />
                            </div>
                            {data.items.map((item, i) => (
                                <div key={i} className="grid grid-cols-[1fr_70px_90px_28px] gap-2 mb-2">
                                    <input className={inputCls} style={{fontSize:12}} value={item.description} onChange={e => updateItem(i,'description',e.target.value)} placeholder="Item description" />
                                    <input className={inputCls} style={{fontSize:12}} type="number" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} min="1" />
                                    <input className={inputCls} style={{fontSize:12}} type="number" value={item.rate} onChange={e => updateItem(i,'rate',e.target.value)} placeholder="0" />
                                    <button onClick={() => removeItem(i)} className="text-[#58607a] hover:text-red-400 text-[18px] pb-0.5">×</button>
                                </div>
                            ))}
                            <div className="flex justify-between items-center mt-3">
                                <Btn ghost sm onClick={addItem}>+ Add Line Item</Btn>
                                <div className="flex gap-8 text-[13.5px]"><span className="text-[#58607a]">Total</span><span className="font-semibold text-[#e2dcd2]">{fmt(total)}</span></div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ── MEETINGS TAB ──────────────────────────────────────────────────────────────
function MeetingsTab({ project, canManage }) {
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const meetings = project.meetings ?? [];
    const filtered = filter === 'all' ? meetings : meetings.filter(m => m.status === filter);

    const { data, setData, post, processing, reset } = useForm({
        type: 'kickoff', title: 'Project Kickoff Meeting', date: '', time: '', duration: '1 hr', location: '', attendees: '', notes: '',
    });

    const typeToTitle = { kickoff:'Project Kickoff Meeting', review:'Project Review', checkin:'Monthly Check-in', presentation:'Client Presentation', discovery:'Discovery Session', other:'Meeting' };
    const submit = () => post(route('projects.meetings.store', project.id), { onSuccess: () => { setShowModal(false); reset(); } });
    const updateStatus = (m, status) => router.patch(route('meetings.status', m.id), { status });

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h3 className="font-serif text-[18px] font-semibold">Meetings</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}>+ Schedule Meeting</Btn>}
            </div>
            <div className="flex gap-2 mb-5">
                {['all','scheduled','completed','cancelled'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all capitalize ${filter === s ? 'bg-[#c9a464]/10 border-[#c9a464]/30 text-[#c9a464]' : 'border-[#252b40] text-[#9a9180] hover:text-[#e2dcd2] hover:bg-white/[0.03]'}`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && <div className="text-center py-14 text-[#58607a]"><div className="text-4xl mb-3 opacity-50">📅</div><div className="text-[14px] mb-5">No meetings scheduled</div>{canManage && <Btn primary onClick={() => setShowModal(true)}>Schedule a Meeting</Btn>}</div>}

            <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                {[...filtered].sort((a,b) => b.date.localeCompare(a.date)).map(m => {
                    const { day, mon } = parseDay(m.date);
                    return (
                        <div key={m.id} className="px-5 py-4 border-b border-[#1d2236] last:border-b-0">
                            <div className="flex gap-3.5 items-start">
                                <div className="w-11 h-11 bg-[#c9a464]/10 border border-[#c9a464]/15 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                                    <div className="text-[16px] font-bold text-[#c9a464] leading-none">{day}</div>
                                    <div className="text-[9px] text-[#c9a464] tracking-wide uppercase">{mon}</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-[14px] font-medium text-[#e2dcd2]">{m.title}</span>
                                        <Badge status={m.status} />
                                        <span className="text-[10px] px-2 py-0.5 bg-white/[0.05] rounded-full text-[#9a9180]">{MTG_TYPES[m.type]}</span>
                                    </div>
                                    <div className="text-[12.5px] text-[#58607a] mb-2">{m.time} · {m.duration} · {m.location}</div>
                                    {(m.attendees ?? []).length > 0 && <div className="text-[12px] text-[#58607a]">👥 {m.attendees.join(', ')}</div>}
                                    {m.notes && <div className="mt-3 px-3 py-2.5 bg-[#11131d] rounded-lg text-[12.5px] text-[#9a9180] leading-relaxed border-l-2 border-[#252b40]">{m.notes}</div>}
                                </div>
                                {canManage && m.status === 'scheduled' && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Btn ghost sm onClick={() => updateStatus(m, 'completed')}>Mark Complete</Btn>
                                        <Btn danger sm onClick={() => updateStatus(m, 'cancelled')}>Cancel</Btn>
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
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Meeting Type">
                                <select className={inputCls} value={data.type} onChange={e => { setData('type', e.target.value); setData('title', typeToTitle[e.target.value] ?? 'Meeting'); }}>
                                    {Object.entries(MTG_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </FG>
                            <FG label="Title"><input className={inputCls} value={data.title} onChange={e => setData('title', e.target.value)} /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Date"><input className={inputCls} type="date" value={data.date} onChange={e => setData('date', e.target.value)} /></FG>
                            <FG label="Time"><input className={inputCls} value={data.time} onChange={e => setData('time', e.target.value)} placeholder="e.g. 10:00 AM" /></FG>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FG label="Duration"><input className={inputCls} value={data.duration} onChange={e => setData('duration', e.target.value)} placeholder="e.g. 1 hr" /></FG>
                            <FG label="Location"><input className={inputCls} value={data.location} onChange={e => setData('location', e.target.value)} placeholder="Zoom, Office…" /></FG>
                        </div>
                        <FG label="Attendees (comma-separated)"><input className={inputCls} value={data.attendees} onChange={e => setData('attendees', e.target.value)} placeholder="Sarah Chen, Alex Rivera…" /></FG>
                        <FG label="Agenda / Notes"><textarea className={`${inputCls} resize-y`} value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Meeting agenda…" /></FG>
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
                <h3 className="font-serif text-[18px] font-semibold">Documents</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}>+ Add Document</Btn>}
            </div>
            <div className="flex gap-2 mb-5">
                {['all','contract','brief','report','asset','other'].map(t => (
                    <button key={t} onClick={() => setFilter(t)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all capitalize ${filter === t ? 'bg-[#c9a464]/10 border-[#c9a464]/30 text-[#c9a464]' : 'border-[#252b40] text-[#9a9180] hover:text-[#e2dcd2] hover:bg-white/[0.03]'}`}>{t}</button>
                ))}
            </div>

            {filtered.length === 0 && <div className="text-center py-14 text-[#58607a]"><div className="text-4xl mb-3 opacity-50">📂</div><div className="text-[14px] mb-5">No documents found</div>{canManage && <Btn primary onClick={() => setShowModal(true)}>Add Document</Btn>}</div>}

            <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                {filtered.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-[#1d2236] last:border-b-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 ${DOC_COLORS[doc.type] ?? 'bg-white/5'}`}>{DOC_ICONS[doc.type] ?? '📁'}</div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium text-[#e2dcd2] truncate">{doc.name}</div>
                            <div className="text-[11.5px] text-[#58607a]">
                                Added by {doc.uploader?.name ?? 'Team'} · {fmtDate(doc.created_at)} {doc.file_size ? `· ${doc.file_size}` : ''}
                            </div>
                        </div>
                        <Badge status={doc.type} label={doc.type} />
                        <a href={`/documents/${doc.id}/download`} className="text-[12px] text-[#58607a] hover:text-[#e2dcd2] transition-colors px-3 py-1.5 rounded-lg border border-[#252b40] hover:bg-white/[0.03]">⬇ Download</a>
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
                        <div className="border-2 border-dashed border-[#252b40] rounded-xl p-8 text-center text-[#58607a]">
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
                <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#1d2236]"><span className="font-serif text-[16px] font-semibold">Phase Timeline</span></div>
                    <div className="px-5 py-5">
                        {phases.map((ph, i) => (
                            <div key={i} className="flex gap-4 pb-6 last:pb-0">
                                <div className="flex flex-col items-center w-7 flex-shrink-0">
                                    <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-0.5 ${ph.done ? 'border-green-400 bg-green-400' : ph.active ? 'border-[#c9a464] bg-[#c9a464]' : 'border-[#252b40] bg-[#171a28]'}`} />
                                    {i < phases.length - 1 && <div className="w-px flex-1 bg-[#1d2236] mt-1" />}
                                </div>
                                <div className="flex-1 pt-0">
                                    <div className="text-[10.5px] text-[#58607a] mb-1">{fmtDate(ph.from)} → {fmtDate(ph.to)}</div>
                                    <div className="text-[13.5px] font-medium text-[#e2dcd2] mb-1">
                                        {ph.name} {ph.done ? <span className="text-green-400 text-[11px]">✓</span> : ph.active ? <span className="text-[#c9a464] text-[11px]">← Current</span> : ''}
                                    </div>
                                    <div className="text-[12px] text-[#58607a] leading-relaxed">{ph.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#1d2236]"><span className="font-serif text-[16px] font-semibold">Key Dates</span></div>
                    <div className="px-5 py-2">
                        {[
                            { l: 'Project Start', v: fmtDate(project.start_date), c: 'text-green-400' },
                            { l: 'Planned End', v: fmtDate(project.end_date), c: end < today ? 'text-red-400' : 'text-[#e2dcd2]' },
                            { l: 'Days Remaining', v: `${daysLeft} days`, c: daysLeft < 14 ? 'text-orange-400' : 'text-[#e2dcd2]' },
                            { l: 'Current Phase', v: project.phase, c: 'text-[#c9a464]' },
                        ].map(({ l, v, c }) => (
                            <div key={l} className="flex justify-between py-3 border-b border-[#1d2236] last:border-b-0 text-[13px]">
                                <span className="text-[#58607a]">{l}</span>
                                <span className={`font-medium ${c}`}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#1d2236]"><span className="font-serif text-[16px] font-semibold">Phase Progress</span></div>
                    <div className="px-5 py-4 space-y-3">
                        {phases.map((ph, i) => {
                            const pct = ph.done ? 100 : ph.active ? Math.min(99, project.progress) : 0;
                            return (
                                <div key={i}>
                                    <div className="flex justify-between text-[12px] text-[#58607a] mb-1.5">
                                        <span className="truncate pr-2">{ph.name}</span>
                                        <span className={ph.done ? 'text-green-400' : ph.active ? 'text-[#c9a464]' : 'text-[#252b40]'}>{ph.done ? 'Complete' : ph.active ? 'In Progress' : 'Upcoming'}</span>
                                    </div>
                                    <div className="h-1.5 bg-[#252b40] rounded-full overflow-hidden">
                                        <div className="h-full rounded-full progress-fill" style={{ width: `${pct}%`, background: ph.done ? '#3ecf8e' : ph.active ? 'linear-gradient(90deg,#c9a464,#d4b472)' : '#252b40' }} />
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
                <h3 className="font-serif text-[18px] font-semibold">Task List</h3>
                {canManage && <Btn primary sm onClick={() => setShowModal(true)}>+ Add Task</Btn>}
            </div>
            <div className="flex gap-2 mb-5">
                {['all','not-started','in-progress','review','completed'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all ${filter === s ? 'bg-[#c9a464]/10 border-[#c9a464]/30 text-[#c9a464]' : 'border-[#252b40] text-[#9a9180] hover:text-[#e2dcd2] hover:bg-white/[0.03]'}`}>
                        {s === 'all' ? 'All' : s === 'not-started' ? 'Not Started' : s === 'in-progress' ? 'In Progress' : s === 'review' ? 'Review' : 'Completed'}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && <div className="text-center py-14 text-[#58607a]"><div className="text-4xl mb-3 opacity-50">✅</div><div className="text-[14px] mb-5">No tasks found</div>{canManage && <Btn primary onClick={() => setShowModal(true)}>Add First Task</Btn>}</div>}

            {Object.entries(byCategory).map(([cat, catTasks]) => (
                <div key={cat} className="mb-5">
                    <div className="text-[10.5px] tracking-[1.5px] uppercase text-[#58607a] mb-2 pb-2 border-b border-[#1d2236]">{cat}</div>
                    <div className="bg-[#171a28] border border-[#1d2236] rounded-xl overflow-hidden">
                        {catTasks.map(t => (
                            <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1d2236] last:border-b-0">
                                <button
                                    onClick={() => cycleStatus(t)}
                                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                                        ${t.status === 'completed' ? 'border-green-400 bg-green-400' : 'border-[#252b40] hover:border-[#c9a464]'}`}
                                >
                                    {t.status === 'completed' && <span className="text-[#0b0d14] text-[10px] font-bold">✓</span>}
                                </button>
                                <div className="flex-1">
                                    <div className={`text-[13.5px] ${t.status === 'completed' ? 'line-through text-[#58607a]' : 'text-[#e2dcd2]'}`}>{t.title}</div>
                                    <div className="text-[11.5px] text-[#58607a]">{t.assignee}{t.due_date ? ` · Due ${fmtDate(t.due_date)}` : ''}</div>
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
            <div className="text-[10px] tracking-[1.5px] uppercase text-[#58607a] mb-2">{title}</div>
            {children}
        </div>
    );
}

// ── MAIN SHOW PAGE ─────────────────────────────────────────────────────────────
export default function Show({ project, canManage }) {
    const [tab, setTab] = useState('overview');

    const tabs = [
        { id: 'overview',   label: 'Overview' },
        { id: 'proposal',   label: `Proposal (${project.proposals?.length ?? 0})` },
        { id: 'invoices',   label: `Invoices (${project.invoices?.length ?? 0})` },
        { id: 'meetings',   label: `Meetings (${project.meetings?.length ?? 0})` },
        { id: 'documents',  label: `Documents (${project.documents?.length ?? 0})` },
        { id: 'timeline',   label: 'Timeline' },
        { id: 'tasks',      label: `Tasks (${project.tasks?.length ?? 0})` },
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
            <div className="-mx-8 px-8 border-b border-[#1d2236] mb-7 flex gap-0 overflow-x-auto">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-3.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-all
                            ${tab === t.id
                                ? 'border-[#c9a464] text-[#c9a464]'
                                : 'border-transparent text-[#58607a] hover:text-[#e2dcd2]'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'overview'  && <OverviewTab  project={project} canManage={canManage} />}
            {tab === 'proposal'  && <ProposalTab  project={project} canManage={canManage} />}
            {tab === 'invoices'  && <InvoicesTab  project={project} canManage={canManage} />}
            {tab === 'meetings'  && <MeetingsTab  project={project} canManage={canManage} />}
            {tab === 'documents' && <DocumentsTab project={project} canManage={canManage} />}
            {tab === 'timeline'  && <TimelineTab  project={project} />}
            {tab === 'tasks'     && <TasksTab     project={project} canManage={canManage} />}
        </AppLayout>
    );
}
