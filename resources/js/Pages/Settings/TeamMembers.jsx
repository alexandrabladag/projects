import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Plus, Pencil, Trash2, Save, X, Users } from 'lucide-react';

const inputCls = 'w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[13px] text-black outline-none focus:border-[#4f6df5] transition-colors';

export default function TeamMembers({ members }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '', email: '', phone: '', role: '', department: '', pay_type: 'monthly', rate: '', rate_currency: 'PHP',
    });

    const openNew = () => { setEditing(null); reset(); setShowForm(true); };
    const openEdit = (m) => { setEditing(m); setData({ name: m.name, email: m.email ?? '', phone: m.phone ?? '', role: m.role ?? '', department: m.department ?? '', pay_type: m.pay_type ?? 'monthly', rate: m.rate ?? '', rate_currency: m.rate_currency ?? 'PHP' }); setShowForm(true); };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('team.update', editing.id), { onSuccess: () => { setShowForm(false); setEditing(null); } });
        } else {
            post(route('team.store'), { onSuccess: () => { setShowForm(false); reset(); } });
        }
    };

    const remove = (m) => {
        if (confirm(`Remove ${m.name}?`)) router.delete(route('team.destroy', m.id));
    };

    return (
        <AppLayout title="Team Members" breadcrumbs={[{ label: 'Settings' }, { label: 'Team Members' }]}>
            <Head title="Team Members" />

            <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-[13px] text-[#6b7280]">Your company employees who can be assigned as project leads.</p>
                    <button onClick={openNew} className="inline-flex items-center gap-1.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-medium rounded-lg px-4 py-2 text-[13px] transition-all">
                        <Plus size={15} /> Add Member
                    </button>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <form onSubmit={submit} className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-6">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Name *</label>
                                <input className={inputCls} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Full name" autoFocus />
                                {errors.name && <p className="text-red-500 text-[12px] mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Role / Title</label>
                                <input className={inputCls} value={data.role} onChange={e => setData('role', e.target.value)} placeholder="e.g. Project Manager" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Email</label>
                                <input className={inputCls} type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="name@company.com" />
                            </div>
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Phone</label>
                                <input className={inputCls} value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+1 (___) ___-____" />
                            </div>
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Department</label>
                                <input className={inputCls} value={data.department} onChange={e => setData('department', e.target.value)} placeholder="e.g. Engineering" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Pay Type</label>
                                <select className={inputCls} value={data.pay_type} onChange={e => setData('pay_type', e.target.value)}>
                                    <option value="monthly">Monthly</option>
                                    <option value="hourly">Hourly</option>
                                    <option value="fixed">Fixed / Per Project</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Rate</label>
                                <input className={inputCls} type="number" step="0.01" value={data.rate} onChange={e => setData('rate', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Currency</label>
                                <select className={inputCls} value={data.rate_currency} onChange={e => setData('rate_currency', e.target.value)}>
                                    {['PHP','USD','JPY','EUR','GBP','SGD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] text-[#6b7280] border border-[#d1d5db] hover:bg-gray-50 transition-colors"><X size={14} /> Cancel</button>
                            <button type="submit" disabled={processing} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60"><Save size={14} /> {editing ? 'Update' : 'Add Member'}</button>
                        </div>
                    </form>
                )}

                {/* Members List */}
                {members.length === 0 && !showForm && (
                    <div className="text-center py-14 text-[#6b7280]">
                        <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><Users size={24} className="text-indigo-400" /></div></div>
                        <div className="text-[14px] font-semibold text-black mb-1">No team members yet</div>
                        <div className="text-[13px] text-[#6b7280] mb-4">Add your company employees to assign them as project leads</div>
                    </div>
                )}

                {members.length > 0 && (
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        {members.map(m => (
                            <div key={m.id} className="flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                                <div className="w-10 h-10 rounded-full bg-[#4f6df5]/10 flex items-center justify-center text-[13px] font-bold text-[#4f6df5] flex-shrink-0">
                                    {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[14px] font-semibold text-black">{m.name}</div>
                                    <div className="text-[12px] text-[#6b7280]">
                                        {[m.role, m.department].filter(Boolean).join(' · ')}
                                    </div>
                                    <div className="text-[11px] text-[#9ca3af] mt-0.5">
                                        {[m.email, m.phone].filter(Boolean).join(' · ')}
                                    </div>
                                </div>
                                {m.rate > 0 && (
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-[13px] font-bold text-black">{m.rate_currency} {Number(m.rate).toLocaleString()}</div>
                                        <div className="text-[10px] text-[#9ca3af]">/{m.pay_type === 'hourly' ? 'hr' : m.pay_type === 'monthly' ? 'mo' : 'project'}</div>
                                    </div>
                                )}
                                <button onClick={() => openEdit(m)} className="text-[#9ca3af] hover:text-[#4f6df5] transition-colors p-1.5"><Pencil size={14} /></button>
                                <button onClick={() => remove(m)} className="text-[#9ca3af] hover:text-red-500 transition-colors p-1.5"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
