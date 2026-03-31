import { Head, Link } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { Badge } from '@/Layouts/AppLayout';
import { formatMoney } from '@/Utils/currencies';
import { ArrowRight, Calendar, FileText, Receipt } from 'lucide-react';

const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function Dashboard({ projects }) {
    return (
        <ClientLayout title="Your Projects">
            <Head title="Client Portal" />

            {projects.length === 0 && (
                <div className="text-center py-20 text-[#6b7280]">
                    <div className="text-[16px] font-semibold text-black mb-1">No projects yet</div>
                    <div className="text-[13px]">Your projects will appear here once they are assigned to you.</div>
                </div>
            )}

            <div className="space-y-4">
                {projects.map(p => {
                    const cur = p.currency ?? 'USD';
                    const progressColor = p.progress >= 90 ? 'from-emerald-500 to-emerald-400'
                        : p.progress >= 50 ? 'from-[#4f6df5] to-[#6380f7]' : 'from-amber-400 to-amber-300';

                    return (
                        <Link
                            key={p.id}
                            href={route('portal.project', p.id)}
                            className="block bg-white border border-[#e5e7eb] rounded-xl p-5 hover:border-[#4f6df5]/30 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="text-[16px] font-bold text-black group-hover:text-[#4f6df5] transition-colors">{p.name}</div>
                                    <div className="text-[12px] text-[#6b7280] mt-0.5">{p.phase} · Started {fmtDate(p.start_date)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge status={p.status} />
                                    <ArrowRight size={16} className="text-[#d1d5db] group-hover:text-[#4f6df5] transition-colors" />
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="mb-3">
                                <div className="flex justify-between text-[11px] mb-1">
                                    <span className="text-[#6b7280]">Progress</span>
                                    <span className="font-semibold text-black">{p.progress}%</span>
                                </div>
                                <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full bg-gradient-to-r ${progressColor} progress-fill`} style={{ width: `${p.progress}%` }} />
                                </div>
                            </div>

                            {/* Quick stats */}
                            <div className="flex gap-4 text-[12px] text-[#6b7280]">
                                <span className="flex items-center gap-1"><FileText size={13} /> {p.proposals_count ?? 0} proposals</span>
                                <span className="flex items-center gap-1"><Receipt size={13} /> {p.invoices_count ?? 0} invoices</span>
                                <span className="flex items-center gap-1"><Calendar size={13} /> Due {fmtDate(p.end_date)}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </ClientLayout>
    );
}
