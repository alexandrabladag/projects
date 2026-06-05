import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useConfirm } from '@/Components/ui/ConfirmDialog';
import Select from '@/Components/ui/Select';
import { Plus, Pencil, Trash2, Save, X, Users, Link2 as LinkIcon } from 'lucide-react';

const inputCls = 'w-full bg-white border border-[#e5e7eb] rounded-lg px-3.5 py-2.5 text-[13px] text-black placeholder:text-[#9ca3af] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-150 hover:border-[#d1d5db] focus:border-[#4f6df5] focus:ring-[3px] focus:ring-[#4f6df5]/12';

const initials = (name) => (name ?? '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function TeamMembers({ members, accounts = [], users = [] }) {
    const confirm = useConfirm();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '', email: '', phone: '', role: '', department: '', pay_type: 'monthly', rate: '', rate_currency: 'PHP', user_id: '',
    });

    const openNew = () => { setEditing(null); reset(); setShowForm(true); };
    const openEdit = (m) => { setEditing(m); setData({ name: m.name, email: m.email ?? '', phone: m.phone ?? '', role: m.role ?? '', department: m.department ?? '', pay_type: m.pay_type ?? 'monthly', rate: m.rate ?? '', rate_currency: m.rate_currency ?? 'PHP', user_id: m.user_id ?? '' }); setShowForm(true); };
    // Pre-fill the form from an access account so it can be saved as a managed member, linked to that login.
    const openFromAccount = (a) => { setEditing(null); reset(); setData({ name: a.name, email: a.email ?? '', phone: '', role: a.role ?? '', department: '', pay_type: 'monthly', rate: '', rate_currency: 'PHP', user_id: a.id }); setShowForm(true); };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('team.update', editing.id), { onSuccess: () => { setShowForm(false); setEditing(null); } });
        } else {
            post(route('team.store'), { onSuccess: () => { setShowForm(false); reset(); } });
        }
    };

    const remove = async (m) => {
        if (await confirm({ title: `Remove ${m.name}?`, message: 'They will be removed from your team members.', danger: true, confirmLabel: 'Remove' }))
            router.delete(route('team.destroy', m.id));
    };

    return (
        <AppLayout title="Team Members" breadcrumbs={[{ label: 'Settings' }, { label: 'Team Members' }]}>
            <Head title="Team Members" />

            <div className="max-w-3xl">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 text-[#4f6df5]"><Users size={19} /></div>
                        <div>
                            <p className="text-[13px] text-[#4b5563]">Employees who can be assigned as project leads. Everyone with manage access is listed here.</p>
                        </div>
                    </div>
                    <button onClick={openNew} className="inline-flex items-center gap-1.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-medium rounded-lg px-4 py-2 text-[13px] transition-all flex-shrink-0">
                        <Plus size={15} /> Add Member
                    </button>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <form onSubmit={submit} className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-6">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Name *</label>
                                <input className={inputCls} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Full name" autoFocus />
                                {errors.name && <p className="text-red-500 text-[12px] mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Role / Title</label>
                                <input className={inputCls} value={data.role} onChange={e => setData('role', e.target.value)} placeholder="e.g. Project Manager" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Email</label>
                                <input className={inputCls} type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="name@company.com" />
                            </div>
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Phone</label>
                                <input className={inputCls} value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+1 (___) ___-____" />
                            </div>
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Department</label>
                                <input className={inputCls} value={data.department} onChange={e => setData('department', e.target.value)} placeholder="e.g. Engineering" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Pay Type</label>
                                <Select
                                    value={data.pay_type}
                                    onChange={v => setData('pay_type', v)}
                                    options={[
                                        { value: 'monthly', label: 'Monthly' },
                                        { value: 'hourly', label: 'Hourly' },
                                        { value: 'fixed', label: 'Fixed / Per Project' },
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Rate</label>
                                <input className={inputCls} type="number" step="0.01" value={data.rate} onChange={e => setData('rate', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Currency</label>
                                <Select
                                    value={data.rate_currency}
                                    onChange={v => setData('rate_currency', v)}
                                    options={['PHP','USD','JPY','EUR','GBP','SGD','AUD'].map(c => ({ value: c, label: c }))}
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Linked Login Account</label>
                            <Select
                                value={data.user_id}
                                onChange={v => setData('user_id', v)}
                                placeholder="Not linked (cannot log in)"
                                clearable
                                options={users.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                            />
                            {errors.user_id && <p className="text-red-500 text-[12px] mt-1">{errors.user_id}</p>}
                            <p className="text-[11px] text-[#6b7280] mt-1.5">Link this person to an account so they can see their own tasks in “My Tasks”.</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] text-[#4b5563] border border-[#d1d5db] hover:bg-gray-50 transition-colors"><X size={14} /> Cancel</button>
                            <button type="submit" disabled={processing} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60"><Save size={14} /> {editing ? 'Update' : 'Add Member'}</button>
                        </div>
                    </form>
                )}

                {/* Members List */}
                {members.length === 0 && accounts.length === 0 && !showForm && (
                    <div className="text-center py-14 text-[#4b5563]">
                        <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><Users size={24} className="text-indigo-400" /></div></div>
                        <div className="text-[14px] font-semibold text-black mb-1">No team members yet</div>
                        <div className="text-[13px] text-[#4b5563] mb-4">Add your company employees to assign them as project leads</div>
                    </div>
                )}

                {(members.length > 0 || accounts.length > 0) && (
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        {members.map(m => (
                            <div key={m.id} className="flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                                <div className="w-10 h-10 rounded-full bg-[#4f6df5]/10 flex items-center justify-center text-[13px] font-bold text-[#4f6df5] flex-shrink-0">
                                    {initials(m.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[14px] font-semibold text-black">{m.name}</div>
                                    <div className="text-[12px] text-[#4b5563]">
                                        {[m.role, m.department].filter(Boolean).join(' · ')}
                                    </div>
                                    <div className="text-[11px] text-[#6b7280] mt-0.5">
                                        {[m.email, m.phone].filter(Boolean).join(' · ')}
                                    </div>
                                    {m.user && (
                                        <div className="text-[11px] text-emerald-600 mt-0.5 inline-flex items-center gap-1">
                                            <LinkIcon size={11} /> Linked to {m.user.name}
                                        </div>
                                    )}
                                </div>
                                {m.rate > 0 && (
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-[13px] font-bold text-black">{m.rate_currency} {Number(m.rate).toLocaleString()}</div>
                                        <div className="text-[10px] text-[#6b7280]">/{m.pay_type === 'hourly' ? 'hr' : m.pay_type === 'monthly' ? 'mo' : 'project'}</div>
                                    </div>
                                )}
                                <button onClick={() => openEdit(m)} className="text-[#6b7280] hover:text-[#4f6df5] transition-colors p-1.5"><Pencil size={14} /></button>
                                <button onClick={() => remove(m)} className="text-[#6b7280] hover:text-red-500 transition-colors p-1.5"><Trash2 size={14} /></button>
                            </div>
                        ))}

                        {accounts.map(a => (
                            <div key={`acct-${a.id}`} className="flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                                <div className="w-10 h-10 rounded-full bg-[#4f6df5]/10 flex items-center justify-center text-[13px] font-bold text-[#4f6df5] flex-shrink-0">
                                    {initials(a.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[14px] font-semibold text-black flex items-center gap-2">
                                        {a.name}
                                        {a.role && <span className="text-[10px] font-medium text-[#4f6df5] bg-[#4f6df5]/10 px-2 py-0.5 rounded-full uppercase tracking-[0.5px]">{a.role}</span>}
                                    </div>
                                    <div className="text-[11px] text-[#6b7280] mt-0.5">{a.email}</div>
                                    <div className="text-[11px] text-emerald-600 mt-0.5 inline-flex items-center gap-1">
                                        <LinkIcon size={11} /> Has login access
                                    </div>
                                </div>
                                <button onClick={() => openFromAccount(a)} className="inline-flex items-center gap-1.5 text-[12px] text-[#4b5563] hover:text-[#4f6df5] border border-[#d1d5db] hover:border-[#4f6df5] rounded-lg px-3 py-1.5 transition-colors">
                                    <Pencil size={13} /> Add details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
