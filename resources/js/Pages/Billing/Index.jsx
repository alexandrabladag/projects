import { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FileText, ReceiptText, ChevronRight, Search, ExternalLink, Inbox, Plus, Save, X, Trash2 } from 'lucide-react';
import { formatMoney } from '@/Utils/currencies';
import { fmtDate } from '@/Utils/format';
import Button from '@/Components/ui/Button';
import Select from '@/Components/ui/Select';
import FormField, { inputCls } from '@/Components/ui/FormField';

const today = () => new Date().toISOString().slice(0, 10);

// ── status styling ───────────────────────────────────────────────────────────
const PROPOSAL_STATUS = {
    draft:    { label: 'Draft',    cls: 'bg-gray-100 text-[#4b5563] border-gray-200' },
    sent:     { label: 'Sent',     cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-500 border-red-100' },
};
const INVOICE_STATUS = {
    draft:   { label: 'Draft',   cls: 'bg-gray-100 text-[#4b5563] border-gray-200' },
    sent:    { label: 'Sent',    cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    paid:    { label: 'Paid',    cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    overdue: { label: 'Overdue', cls: 'bg-red-50 text-red-500 border-red-100' },
};

const Pill = ({ map, status }) => {
    const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-[#4b5563] border-gray-200' };
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${s.cls}`}>{s.label}</span>;
};

// Render a currency-keyed totals object ({ USD: 1200, PHP: 5000 }) as formatted lines.
const totalLines = (obj, base) => {
    const entries = Object.entries(obj ?? {});
    if (!entries.length) return [formatMoney(0, base)];
    return entries.map(([cur, amt]) => formatMoney(amt, cur));
};

function StageCard({ label, totals, base, accent, count }) {
    const lines = totalLines(totals, base);
    return (
        <div className={`flex-1 min-w-0 rounded-xl border p-4 ${accent.bg} ${accent.border}`}>
            <div className="text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-semibold mb-1.5">{label}</div>
            <div className="space-y-0.5">
                <div className={`text-[19px] font-bold leading-tight ${accent.text} truncate`}>{lines[0]}</div>
                {lines.slice(1).map((l, i) => (
                    <div key={i} className={`text-[12px] font-semibold ${accent.text} opacity-80 truncate`}>{l}</div>
                ))}
            </div>
            {count != null && <div className="text-[11px] text-[#6b7280] mt-1.5">{count} {count === 1 ? 'item' : 'items'}</div>}
        </div>
    );
}

const matches = (q, ...fields) => !q || fields.some(f => (f ?? '').toLowerCase().includes(q.toLowerCase()));

export default function Index({ proposals = [], invoices = [], pipeline = {}, baseCurrency = 'USD', canManage, projectOptions = [], nextInvoiceNumber = '' }) {
    const [search, setSearch] = useState('');
    const [propFilter, setPropFilter] = useState('all');
    const [invFilter, setInvFilter] = useState('all');
    const [modal, setModal] = useState(null); // 'proposal' | 'invoice' | null

    const filteredProposals = useMemo(() => proposals
        .filter(p => propFilter === 'all' || p.status === propFilter)
        .filter(p => matches(search, p.title, p.project?.name, p.project?.client)), [proposals, propFilter, search]);

    const filteredInvoices = useMemo(() => invoices
        .filter(i => invFilter === 'all' || i.status === invFilter)
        .filter(i => matches(search, i.number, i.description, i.project?.name, i.project?.client)), [invoices, invFilter, search]);

    const propCounts = proposals.reduce((a, p) => ((a[p.status] = (a[p.status] ?? 0) + 1), a), {});
    const invCounts = invoices.reduce((a, i) => ((a[i.status] = (a[i.status] ?? 0) + 1), a), {});

    const stages = [
        { key: 'proposed',  label: 'Proposed',  count: proposals.filter(p => p.status !== 'rejected').length, accent: { bg: 'bg-indigo-50',  border: 'border-indigo-100',  text: 'text-indigo-700' } },
        { key: 'approved',  label: 'Signed',    count: proposals.filter(p => p.status === 'approved').length, accent: { bg: 'bg-violet-50',  border: 'border-violet-100',  text: 'text-violet-700' } },
        { key: 'invoiced',  label: 'Invoiced',  count: invoices.length,                                       accent: { bg: 'bg-sky-50',     border: 'border-sky-100',     text: 'text-sky-700' } },
        { key: 'collected', label: 'Collected', count: invoices.filter(i => i.status === 'paid').length,      accent: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' } },
    ];

    return (
        <AppLayout title="Billing" breadcrumbs={[{ label: 'Billing' }]}>
            <Head title="Billing" />

            <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
                <div>
                    <h2 className="font-serif text-[22px] md:text-[26px] font-semibold text-black leading-tight">Billing</h2>
                    <p className="text-[13px] text-[#4b5563] mt-1">Your proposal-to-payment pipeline across every project.</p>
                </div>
                {canManage && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" sm onClick={() => setModal('proposal')}><FileText size={14} /> New Proposal</Button>
                        <Button sm onClick={() => setModal('invoice')}><ReceiptText size={14} /> New Invoice</Button>
                    </div>
                )}
            </div>

            {/* ── Pipeline funnel ─────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-stretch gap-2 md:gap-1 mb-7">
                {stages.map((s, i) => (
                    <div key={s.key} className="flex items-center gap-1 md:flex-1 md:min-w-0">
                        <StageCard label={s.label} totals={pipeline[s.key]} base={baseCurrency} accent={s.accent} count={s.count} />
                        {i < stages.length - 1 && (
                            <ChevronRight size={18} className="text-[#9ca3af] flex-shrink-0 hidden md:block" />
                        )}
                    </div>
                ))}
            </div>

            {/* ── Search ──────────────────────────────────────────────────────── */}
            <div className="relative mb-5 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by project, client, title, or number…"
                    className="w-full bg-white border border-[#e5e7eb] rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-black placeholder:text-[#9ca3af] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-150 hover:border-[#d1d5db] focus:border-[#4f6df5] focus:ring-[3px] focus:ring-[#4f6df5]/12"
                />
            </div>

            {/* ── Two columns ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Proposals */}
                <Column
                    icon={<FileText size={16} className="text-indigo-500" />}
                    title="Proposals"
                    total={proposals.length}
                    statusMap={PROPOSAL_STATUS}
                    counts={propCounts}
                    filter={propFilter}
                    setFilter={setPropFilter}
                    empty="No proposals yet"
                >
                    {filteredProposals.map(p => (
                        <Row
                            key={`prop-${p.id}`}
                            href={`${route('projects.show', p.project?.id)}?tab=proposal`}
                            viewHref={route('proposals.view', p.id)}
                            title={p.title || 'Untitled proposal'}
                            subtitle={[p.project?.name, p.project?.client].filter(Boolean).join(' · ')}
                            amount={formatMoney(p.amount, p.currency)}
                            meta={p.valid_until ? `Valid until ${fmtDate(p.valid_until)}` : fmtDate(p.date)}
                            pill={<Pill map={PROPOSAL_STATUS} status={p.status} />}
                        />
                    ))}
                    {filteredProposals.length === 0 && <EmptyRow text="No proposals match" />}
                </Column>

                {/* Invoices */}
                <Column
                    icon={<ReceiptText size={16} className="text-sky-500" />}
                    title="Invoices"
                    total={invoices.length}
                    statusMap={INVOICE_STATUS}
                    counts={invCounts}
                    filter={invFilter}
                    setFilter={setInvFilter}
                    empty="No invoices yet"
                >
                    {filteredInvoices.map(i => (
                        <Row
                            key={`inv-${i.id}`}
                            href={`${route('projects.show', i.project?.id)}?tab=invoices`}
                            viewHref={route('invoices.view', i.id)}
                            title={i.number ? `#${i.number}` : 'Invoice'}
                            subtitle={[i.project?.name, i.project?.client].filter(Boolean).join(' · ')}
                            amount={formatMoney(i.amount, i.currency)}
                            meta={i.due_date ? `Due ${fmtDate(i.due_date)}` : fmtDate(i.date)}
                            pill={<Pill map={INVOICE_STATUS} status={i.status} />}
                        />
                    ))}
                    {filteredInvoices.length === 0 && <EmptyRow text="No invoices match" />}
                </Column>
            </div>

            {modal === 'proposal' && (
                <NewProposalModal projectOptions={projectOptions} onClose={() => setModal(null)} />
            )}
            {modal === 'invoice' && (
                <NewInvoiceModal projectOptions={projectOptions} nextInvoiceNumber={nextInvoiceNumber} onClose={() => setModal(null)} />
            )}
        </AppLayout>
    );
}

// ── generic modal shell ───────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-5" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white border border-[#d1d5db] rounded-t-2xl md:rounded-2xl w-full flex flex-col max-h-[92vh] md:max-h-[88vh] md:max-w-[560px]">
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

const projOpts = (projectOptions) => projectOptions.map(p => ({ value: p.id, label: p.name, sublabel: p.client || undefined }));
const curOf = (projectOptions, id) => projectOptions.find(p => String(p.id) === String(id))?.currency;

// ── new proposal ──────────────────────────────────────────────────────────────
function NewProposalModal({ projectOptions, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        project_id: '', title: '', amount: '', date: today(), valid_until: '',
    });
    const currency = curOf(projectOptions, data.project_id);

    const submit = () => {
        if (!data.project_id) return;
        post(route('projects.proposals.store', data.project_id), { onSuccess: onClose, preserveScroll: true });
    };

    return (
        <Modal
            title="New Proposal"
            subtitle="Create a proposal for any project"
            onClose={onClose}
            footer={<>
                <Button variant="ghost" onClick={onClose}><X size={13} /> Cancel</Button>
                <Button onClick={submit} disabled={processing || !data.project_id || !data.title || !data.amount}><Save size={13} /> Create Proposal</Button>
            </>}
        >
            <div className="space-y-4 pb-2">
                <FormField label="Project *" error={errors.project_id}>
                    <Select value={data.project_id} onChange={v => setData('project_id', v)} options={projOpts(projectOptions)} placeholder="Select a project…" />
                </FormField>
                <FormField label="Title *" error={errors.title}>
                    <input className={inputCls} value={data.title} onChange={e => setData('title', e.target.value)} placeholder="e.g. Website Redesign Proposal" />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                    <FormField label={`Amount *${currency ? ` (${currency})` : ''}`} error={errors.amount}>
                        <input className={inputCls} type="number" step="0.01" min="0" value={data.amount} onChange={e => setData('amount', e.target.value)} placeholder="0.00" />
                    </FormField>
                    <FormField label="Date *" error={errors.date}>
                        <input className={inputCls} type="date" value={data.date} onChange={e => setData('date', e.target.value)} />
                    </FormField>
                </div>
                <FormField label="Valid Until" error={errors.valid_until} hint="Optional — when the proposal expires.">
                    <input className={inputCls} type="date" value={data.valid_until} onChange={e => setData('valid_until', e.target.value)} />
                </FormField>
            </div>
        </Modal>
    );
}

// ── new invoice ───────────────────────────────────────────────────────────────
function NewInvoiceModal({ projectOptions, nextInvoiceNumber, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        project_id: '', number: nextInvoiceNumber, date: today(), due_date: '', description: '',
        items: [{ description: '', quantity: 1, rate: '' }],
    });
    const currency = curOf(projectOptions, data.project_id);

    const setItem = (i, key, val) => setData('items', data.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it));
    const addItem = () => setData('items', [...data.items, { description: '', quantity: 1, rate: '' }]);
    const removeItem = (i) => setData('items', data.items.length > 1 ? data.items.filter((_, idx) => idx !== i) : data.items);
    const total = data.items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0), 0);

    const submit = () => {
        if (!data.project_id) return;
        post(route('projects.invoices.store', data.project_id), { onSuccess: onClose, preserveScroll: true });
    };

    return (
        <Modal
            title="New Invoice"
            subtitle="Create an invoice for any project"
            onClose={onClose}
            footer={<>
                <Button variant="ghost" onClick={onClose}><X size={13} /> Cancel</Button>
                <Button onClick={submit} disabled={processing || !data.project_id || !data.number}><Save size={13} /> Create Invoice</Button>
            </>}
        >
            <div className="space-y-4 pb-2">
                <FormField label="Project *" error={errors.project_id}>
                    <Select value={data.project_id} onChange={v => setData('project_id', v)} options={projOpts(projectOptions)} placeholder="Select a project…" />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="Invoice # *" error={errors.number}>
                        <input className={`${inputCls} font-mono font-semibold`} value={data.number} onChange={e => setData('number', e.target.value)} />
                    </FormField>
                    <FormField label="Description" error={errors.description}>
                        <input className={inputCls} value={data.description} onChange={e => setData('description', e.target.value)} placeholder="e.g. Initial retainer" />
                    </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="Invoice Date *" error={errors.date}>
                        <input className={inputCls} type="date" value={data.date} onChange={e => setData('date', e.target.value)} />
                    </FormField>
                    <FormField label="Due Date" error={errors.due_date}>
                        <input className={inputCls} type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} />
                    </FormField>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-semibold">Line Items *{currency ? ` (${currency})` : ''}</label>
                        <button type="button" onClick={addItem} className="text-[12px] font-medium text-[#4f6df5] hover:text-[#6380f7] inline-flex items-center gap-1"><Plus size={13} /> Add item</button>
                    </div>
                    {typeof errors.items === 'string' && <p className="text-red-500 text-[11px] font-medium mb-2">{errors.items}</p>}
                    <div className="space-y-2">
                        {data.items.map((it, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <input className={`${inputCls} flex-1`} style={{ fontSize: 12 }} value={it.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Item description" />
                                <input className={inputCls} style={{ fontSize: 12, width: 60 }} type="number" min="1" value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} title="Qty" />
                                <input className={inputCls} style={{ fontSize: 12, width: 90 }} type="number" min="0" step="0.01" value={it.rate} onChange={e => setItem(i, 'rate', e.target.value)} placeholder="Rate" />
                                <button type="button" onClick={() => removeItem(i)} disabled={data.items.length === 1} className="text-[#9ca3af] hover:text-red-500 disabled:opacity-30 disabled:hover:text-[#9ca3af] p-2 flex-shrink-0" title="Remove"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end mt-3 pt-3 border-t border-[#f0f0f0]">
                        <div className="text-right">
                            <span className="text-[11px] uppercase tracking-[1px] text-[#6b7280] font-semibold mr-2">Total</span>
                            <span className="text-[18px] font-bold text-black">{formatMoney(total, currency || 'USD')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

// ── column shell with status filter chips ─────────────────────────────────────
function Column({ icon, title, total, statusMap, counts, filter, setFilter, empty, children }) {
    const chips = [{ key: 'all', label: 'All', count: total }, ...Object.keys(statusMap).map(k => ({ key: k, label: statusMap[k].label, count: counts[k] ?? 0 }))];
    return (
        <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3.5 border-b border-[#f0f0f0]">
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">{icon}</span>
                    <h3 className="text-[15px] font-bold text-black">{title}</h3>
                    <span className="text-[12px] text-[#6b7280] font-medium">{total}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {chips.map(c => (
                        <button
                            key={c.key}
                            onClick={() => setFilter(c.key)}
                            className={`text-[11.5px] font-medium px-2.5 py-1 rounded-full transition-colors ${filter === c.key ? 'bg-[#4f6df5] text-white' : 'bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]'}`}
                        >
                            {c.label}{c.count > 0 && <span className={filter === c.key ? 'opacity-80' : 'text-[#9ca3af]'}> {c.count}</span>}
                        </button>
                    ))}
                </div>
            </div>
            <div className="divide-y divide-[#f0f0f0] max-h-[560px] overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

function Row({ href, viewHref, title, subtitle, amount, meta, pill }) {
    return (
        <div className="group flex items-center gap-3 px-4 py-3 hover:bg-[#fafbfc] transition-colors">
            <Link href={href} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-black truncate">{title}</span>
                    {pill}
                </div>
                <div className="text-[12px] text-[#6b7280] truncate mt-0.5">{subtitle || '—'}</div>
            </Link>
            <div className="text-right flex-shrink-0">
                <div className="text-[13.5px] font-bold text-black">{amount}</div>
                <div className="text-[11px] text-[#6b7280] mt-0.5">{meta}</div>
            </div>
            <a
                href={viewHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-[#9ca3af] hover:text-[#4f6df5] transition-colors p-1 opacity-0 group-hover:opacity-100 flex-shrink-0"
                title="Open document"
            >
                <ExternalLink size={14} />
            </a>
        </div>
    );
}

const EmptyRow = ({ text }) => (
    <div className="flex flex-col items-center justify-center py-12 text-[#6b7280]">
        <Inbox size={22} className="text-[#9ca3af] mb-2" />
        <span className="text-[13px]">{text}</span>
    </div>
);
