import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';
import { Pencil, Trash2, Plus, UserPlus } from 'lucide-react';

const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const inputCls = 'w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[13px] text-black outline-none focus:border-[#4f6df5] transition-colors';

function ContactModal({ clientId, contact, onClose }) {
    const isEdit = !!contact;
    const { data, setData, post, put, processing, errors } = useForm({
        name: contact?.name ?? '',
        role: contact?.role ?? '',
        email: contact?.email ?? '',
        phone: contact?.phone ?? '',
        is_primary: contact?.is_primary ?? false,
        notes: contact?.notes ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('contacts.update', contact.id), { onSuccess: onClose });
        } else {
            post(route('clients.contacts.store', clientId), { onSuccess: onClose });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-5" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white border border-[#d1d5db] rounded-2xl w-full max-w-[500px] flex flex-col max-h-[88vh]">
                <div className="flex justify-between items-start p-6 pb-4">
                    <div>
                        <div className="text-[18px] font-bold text-black">{isEdit ? 'Edit Contact' : 'Add Contact'}</div>
                        <div className="text-[12px] text-[#6b7280] mt-1">Company representative</div>
                    </div>
                    <button onClick={onClose} className="text-[#6b7280] hover:text-black text-[22px] leading-none transition-colors">×</button>
                </div>
                <form onSubmit={submit} className="px-6 pb-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Name *</label>
                            <input className={inputCls} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Full name" />
                            {errors.name && <p className="text-red-500 text-[12px] mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Role / Title</label>
                            <input className={inputCls} value={data.role} onChange={e => setData('role', e.target.value)} placeholder="e.g. Project Manager" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Email</label>
                            <input className={inputCls} type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="name@company.com" />
                            {errors.email && <p className="text-red-500 text-[12px] mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Phone</label>
                            <input className={inputCls} value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+1 (___) ___-____" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Notes</label>
                        <textarea className={`${inputCls} resize-y`} rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Notes about this contact..." />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.is_primary}
                            onChange={e => setData('is_primary', e.target.checked)}
                            className="rounded border-[#d1d5db] text-[#4f6df5]"
                        />
                        <span className="text-[13px] text-[#4b5563]">Primary contact</span>
                    </label>
                    <div className="flex justify-end gap-2.5 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-[13px] text-[#6b7280] border border-[#d1d5db] hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={processing} className="px-5 py-2.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60">
                            {processing ? 'Saving…' : isEdit ? 'Update' : 'Add Contact'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Show({ client }) {
    const projects = client.projects ?? [];
    const contacts = client.contacts ?? [];
    const [showContactModal, setShowContactModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const typeLabel = { client: 'client', vendor: 'vendor', contractor: 'contractor' }[client.type] ?? 'client';

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete this ${typeLabel}?`)) {
            router.delete(route('clients.destroy', client.id));
        }
    };

    const deleteContact = (contact) => {
        if (confirm(`Remove ${contact.name}?`)) {
            router.delete(route('contacts.destroy', contact.id));
        }
    };

    const info = [
        { l: 'Email', v: client.email, gold: true },
        { l: 'Phone', v: client.phone },
        { l: 'Website', v: client.website, gold: true },
        { l: 'Tax ID', v: client.tax_id },
        { l: 'Type', v: client.type },
    ];

    const address = [client.address_line_1, client.address_line_2, [client.city, client.state].filter(Boolean).join(', '), client.postal_code, client.country].filter(Boolean).join('\n');

    return (
        <AppLayout
            title={client.name}
            breadcrumbs={[
                { label: 'Clients & Vendors', href: route('clients.index') },
                { label: client.name },
            ]}
        >
            <Head title={client.name} />

            <div className="flex gap-3 mb-6">
                <Link
                    href={route('clients.edit', client.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-[#6b7280] border border-[#d1d5db] hover:bg-gray-50 transition-colors"
                >
                    <Pencil size={14} /> Edit
                </Link>
                <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={14} /> Delete
                </button>
            </div>

            <div className="grid grid-cols-2 gap-5">
                {/* Details */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#e5e7eb]">
                        <span className="text-[16px] font-bold text-black">Company Details</span>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-2 gap-4">
                        {info.map(({ l, v, gold }) => (
                            <div key={l}>
                                <div className="text-[11px] tracking-[1.5px] uppercase text-[#6b7280] mb-1">{l}</div>
                                <div className={`text-[13.5px] ${gold ? 'text-[#4f6df5]' : 'text-black'}`}>{v ?? '—'}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Address & Notes */}
                <div className="space-y-5">
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e5e7eb]">
                            <span className="text-[16px] font-bold text-black">Address</span>
                        </div>
                        <div className="px-5 py-4 text-[13.5px] text-[#4b5563] whitespace-pre-line">
                            {address || '—'}
                        </div>
                    </div>

                    {client.notes && (
                        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-[#e5e7eb]">
                                <span className="text-[16px] font-bold text-black">Notes</span>
                            </div>
                            <div className="px-5 py-4 text-[13.5px] text-[#4b5563] leading-relaxed">{client.notes}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Contacts / Representatives */}
            <div className="mt-6 bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb]">
                    <span className="text-[16px] font-bold text-black">Contacts ({contacts.length})</span>
                    <button
                        onClick={() => { setEditingContact(null); setShowContactModal(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-medium rounded-lg text-[12px] transition-all"
                    >
                        <UserPlus size={14} /> Add Contact
                    </button>
                </div>
                {contacts.length === 0 ? (
                    <div className="text-center py-10 text-[#6b7280] text-[13px]">
                        No contacts yet — add representatives you work with
                    </div>
                ) : (
                    <div>
                        {contacts.map(c => (
                            <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#e5e7eb] last:border-b-0 hover:bg-gray-50 transition-colors">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-[#4f6df5]/10 flex items-center justify-center text-[14px] font-bold text-[#4f6df5] flex-shrink-0">
                                    {c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13.5px] font-semibold text-black">{c.name}</span>
                                        {c.is_primary && (
                                            <span className="text-[10px] px-2 py-0.5 bg-[#4f6df5]/10 text-[#4f6df5] rounded-full font-medium">Primary</span>
                                        )}
                                    </div>
                                    <div className="text-[12px] text-[#6b7280]">
                                        {[c.role, c.email, c.phone].filter(Boolean).join(' · ')}
                                    </div>
                                    {c.notes && <div className="text-[12px] text-[#6b7280] mt-0.5 italic">{c.notes}</div>}
                                </div>
                                {/* Actions */}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => { setEditingContact(c); setShowContactModal(true); }}
                                        className="inline-flex items-center gap-1 text-[12px] text-[#6b7280] hover:text-black transition-colors px-2 py-1 rounded border border-[#d1d5db] hover:bg-gray-50"
                                    >
                                        <Pencil size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => deleteContact(c)}
                                        className="inline-flex items-center gap-1 text-[12px] text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                                    >
                                        <Trash2 size={12} /> Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Projects */}
            <div className="mt-6 bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb]">
                    <span className="text-[16px] font-bold text-black">Projects ({projects.length})</span>
                </div>
                {projects.length === 0 ? (
                    <div className="text-center py-10 text-[#6b7280] text-[13px]">{`No projects linked to this ${typeLabel}`}</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#e5e7eb]">
                                {['Project', 'Status', 'Phase', 'Progress', 'End Date'].map(h => (
                                    <th key={h} className="text-left text-[11px] tracking-[1.5px] uppercase text-[#6b7280] font-medium px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(p => (
                                <tr key={p.id} className="border-b border-[#e5e7eb] last:border-b-0 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3.5">
                                        <Link href={route('projects.show', p.id)} className="text-[13px] font-semibold text-black hover:text-[#4f6df5] transition-colors">
                                            {p.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3.5"><Badge status={p.status} /></td>
                                    <td className="px-4 py-3.5 text-[13px] text-[#6b7280]">{p.phase ?? '—'}</td>
                                    <td className="px-4 py-3.5 text-[13px] text-[#4b5563]">{p.progress ?? 0}%</td>
                                    <td className="px-4 py-3.5 text-[13px] text-[#6b7280]">{fmtDate(p.end_date)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showContactModal && (
                <ContactModal
                    clientId={client.id}
                    contact={editingContact}
                    onClose={() => { setShowContactModal(false); setEditingContact(null); }}
                />
            )}
        </AppLayout>
    );
}
