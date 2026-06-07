import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import AdminNav from '@/Components/AdminNav';
import Select from '@/Components/ui/Select';
import { Plus, Save, X, KeyRound, Eye, EyeOff, RefreshCw } from 'lucide-react';

const inputCls = 'w-full bg-white border border-[#e5e7eb] rounded-lg px-3.5 py-2.5 text-[13px] text-black placeholder:text-[#9ca3af] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-150 hover:border-[#d1d5db] focus:border-[#4f6df5] focus:ring-[3px] focus:ring-[#4f6df5]/12';
const labelCls = 'block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2';

const initials = (name) => (name ?? '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const roleBadge = {
    admin:   'bg-[#4f6df5]/10 text-[#4f6df5]',
    manager: 'bg-violet-50 text-violet-600',
    client:  'bg-blue-50 text-blue-600',
};

// Generate a readable strong password (avoids ambiguous chars).
function generatePassword(len = 14) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?';
    const bytes = new Uint32Array(len);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export default function Accounts({ accounts = [], roleOptions = [] }) {
    const [showForm, setShowForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        first_name: '', last_name: '', email: '', username: '', phone: '', role: 'manager', password: '',
    });

    const openNew = () => { reset(); setShowPassword(false); setShowForm(true); };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.accounts.store'), { onSuccess: () => { reset(); setShowForm(false); } });
    };

    return (
        <AppLayout title="Admin" breadcrumbs={[{ label: 'Admin' }, { label: 'Accounts' }]}>
            <Head title="Accounts" />

            <div className="max-w-4xl">
                <AdminNav />

                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 text-[#4f6df5]"><KeyRound size={19} /></div>
                        <div>
                            <p className="text-[13px] text-[#4b5563]">Login accounts for your workspace. Self sign-up is disabled — only admins can create accounts here.</p>
                        </div>
                    </div>
                    <button onClick={openNew} className="inline-flex items-center gap-1.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-medium rounded-lg px-4 py-2 text-[13px] transition-all flex-shrink-0">
                        <Plus size={15} /> Add Account
                    </button>
                </div>

                {/* Add Form */}
                {showForm && (
                    <form onSubmit={submit} className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-6">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className={labelCls}>First Name *</label>
                                <input className={inputCls} value={data.first_name} onChange={e => setData('first_name', e.target.value)} placeholder="First name" autoFocus />
                                {errors.first_name && <p className="text-red-500 text-[12px] mt-1">{errors.first_name}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Last Name *</label>
                                <input className={inputCls} value={data.last_name} onChange={e => setData('last_name', e.target.value)} placeholder="Last name" />
                                {errors.last_name && <p className="text-red-500 text-[12px] mt-1">{errors.last_name}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className={labelCls}>Email *</label>
                                <input className={inputCls} type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="name@company.com" />
                                {errors.email && <p className="text-red-500 text-[12px] mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Phone</label>
                                <input className={inputCls} value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="Optional" />
                                {errors.phone && <p className="text-red-500 text-[12px] mt-1">{errors.phone}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className={labelCls}>Username</label>
                                <input className={inputCls} value={data.username} onChange={e => setData('username', e.target.value)} placeholder="Auto-generated from email" />
                                {errors.username && <p className="text-red-500 text-[12px] mt-1">{errors.username}</p>}
                                <p className="text-[11px] text-[#6b7280] mt-1.5">Leave blank to derive one from the email.</p>
                            </div>
                            <div>
                                <label className={labelCls}>Role *</label>
                                <Select
                                    value={data.role}
                                    onChange={v => setData('role', v)}
                                    options={roleOptions.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
                                />
                                {errors.role && <p className="text-red-500 text-[12px] mt-1">{errors.role}</p>}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className={labelCls}>Temporary Password *</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        className={inputCls + ' pr-10'}
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder="At least 8 characters"
                                        autoComplete="new-password"
                                    />
                                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563]" tabIndex={-1}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setData('password', generatePassword()); setShowPassword(true); }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-[#4b5563] border border-[#d1d5db] hover:bg-gray-50 transition-colors flex-shrink-0"
                                    title="Generate a strong password"
                                >
                                    <RefreshCw size={13} /> Generate
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-[12px] mt-1">{errors.password}</p>}
                            <p className="text-[11px] text-[#6b7280] mt-1.5">Share this with the person securely — they can change it from their profile after signing in.</p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowForm(false)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] text-[#4b5563] border border-[#d1d5db] hover:bg-gray-50 transition-colors"><X size={14} /> Cancel</button>
                            <button type="submit" disabled={processing} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60"><Save size={14} /> Create Account</button>
                        </div>
                    </form>
                )}

                {/* Accounts list */}
                {accounts.length === 0 && !showForm ? (
                    <div className="text-center py-14 text-[#4b5563]">
                        <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><KeyRound size={24} className="text-indigo-400" /></div></div>
                        <div className="text-[14px] font-semibold text-black mb-1">No accounts yet</div>
                        <div className="text-[13px] text-[#4b5563]">Create the first login account for your workspace</div>
                    </div>
                ) : (
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        {accounts.map(a => (
                            <div key={a.id} className="flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                                <div className="w-10 h-10 rounded-full bg-[#4f6df5]/10 flex items-center justify-center text-[13px] font-bold text-[#4f6df5] flex-shrink-0">
                                    {initials(a.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[14px] font-semibold text-black flex items-center gap-2 flex-wrap">
                                        {a.name}
                                        {a.is_self && <span className="text-[10px] font-medium text-[#6b7280] bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-[0.5px]">You</span>}
                                    </div>
                                    <div className="text-[12px] text-[#4b5563]">{a.email}{a.username ? ` · @${a.username}` : ''}</div>
                                    {a.phone && <div className="text-[11px] text-[#6b7280] mt-0.5">{a.phone}</div>}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {(a.roles ?? []).map(r => (
                                        <span key={r} className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-[0.5px] ${roleBadge[r] ?? 'bg-gray-100 text-gray-600'}`}>{r}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
