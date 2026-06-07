import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import AdminNav from '@/Components/AdminNav';
import { Users, ShieldCheck, Briefcase, UserCircle, KeyRound, ArrowRight, Plus } from 'lucide-react';

const initials = (name) => (name ?? '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const roleBadge = {
    admin:   'bg-[#4f6df5]/10 text-[#4f6df5]',
    manager: 'bg-violet-50 text-violet-600',
    client:  'bg-blue-50 text-blue-600',
};

function StatCard({ icon: Icon, label, value, tint }) {
    return (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}><Icon size={19} /></div>
            <div>
                <div className="text-[22px] font-bold text-black leading-none">{value}</div>
                <div className="text-[12px] text-[#6b7280] mt-1">{label}</div>
            </div>
        </div>
    );
}

export default function AdminDashboard({ stats = {}, recent = [] }) {
    return (
        <AppLayout title="Admin" breadcrumbs={[{ label: 'Admin' }, { label: 'Overview' }]}>
            <Head title="Admin" />

            <div className="max-w-4xl">
                <AdminNav />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <StatCard icon={Users}       label="Total accounts" value={stats.total ?? 0}    tint="bg-indigo-50 text-[#4f6df5]" />
                    <StatCard icon={ShieldCheck} label="Admins"         value={stats.admins ?? 0}   tint="bg-indigo-50 text-[#4f6df5]" />
                    <StatCard icon={Briefcase}   label="Managers"       value={stats.managers ?? 0} tint="bg-violet-50 text-violet-600" />
                    <StatCard icon={UserCircle}  label="Clients"        value={stats.clients ?? 0}  tint="bg-blue-50 text-blue-600" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {/* Account management quick card */}
                    <Link href={route('admin.accounts.index')} className="group bg-white border border-[#e5e7eb] rounded-xl p-5 hover:border-[#4f6df5] transition-colors block">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-[#4f6df5]"><KeyRound size={19} /></div>
                            <div className="font-serif text-[16px] font-semibold text-black">Accounts</div>
                            <ArrowRight size={16} className="ml-auto text-[#9ca3af] group-hover:text-[#4f6df5] transition-colors" />
                        </div>
                        <p className="text-[13px] text-[#4b5563]">Create and review login accounts. Self sign-up is disabled — accounts are added here.</p>
                        <span className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-medium text-[#4f6df5]"><Plus size={13} /> Add an account</span>
                    </Link>

                    {/* Recent accounts */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
                        <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3">Recently added</div>
                        {recent.length === 0 ? (
                            <div className="text-[13px] text-[#9ca3af] py-4 text-center">No accounts yet</div>
                        ) : (
                            <div className="space-y-3">
                                {recent.map(a => (
                                    <div key={a.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#4f6df5]/10 flex items-center justify-center text-[11px] font-bold text-[#4f6df5] flex-shrink-0">
                                            {initials(a.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-black truncate">{a.name}</div>
                                            <div className="text-[11px] text-[#6b7280] truncate">{a.email}</div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {(a.roles ?? []).map(r => (
                                                <span key={r} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-[0.5px] ${roleBadge[r] ?? 'bg-gray-100 text-gray-600'}`}>{r}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
