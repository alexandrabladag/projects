import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';

const fmt = (n) => '$' + Number(n ?? 0).toLocaleString();
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function Index({ projects, canManage }) {
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

    return (
        <AppLayout
            title="All Projects"
            breadcrumbs={[{ label: 'Projects' }]}
        >
            <Head title="Projects" />

            <div className="flex items-center justify-between mb-6">
                {/* Filter Pills */}
                <div className="flex gap-2">
                    {['all', 'active', 'completed', 'on-hold'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all capitalize
                                ${filter === s
                                    ? 'bg-[#c9a464]/10 border-[#c9a464]/30 text-[#c9a464]'
                                    : 'bg-transparent border-[#252b40] text-[#9a9180] hover:text-[#e2dcd2] hover:bg-white/[0.03]'
                                }`}
                        >
                            {s === 'on-hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {canManage && (
                    <Link href={route('projects.create')} className="inline-flex items-center gap-2 bg-[#c9a464] hover:bg-[#d4b472] text-[#0b0d14] font-medium rounded-lg px-4 py-2 text-[13px] transition-all">
                        + New Project
                    </Link>
                )}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 text-[#58607a]">
                    <div className="text-4xl mb-3 opacity-50">🗂️</div>
                    <div className="text-[14px] mb-5">No projects found</div>
                    {canManage && (
                        <Link href={route('projects.create')} className="inline-flex items-center gap-2 bg-[#c9a464] text-[#0b0d14] font-medium rounded-lg px-4 py-2 text-[13px]">
                            Create your first project
                        </Link>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(p => {
                    const budgetPct = p.budget > 0 ? Math.min(100, Math.round((p.spent / p.budget) * 100)) : 0;
                    const budgetColor = budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-orange-500' : '';

                    return (
                        <Link
                            key={p.id}
                            href={route('projects.show', p.id)}
                            className="block bg-[#171a28] border border-[#1d2236] rounded-xl p-5 hover:border-[#c9a464]/40 hover:-translate-y-0.5 transition-all hover:shadow-2xl hover:shadow-black/30"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-serif text-[17px] font-semibold text-[#e2dcd2] leading-snug mb-1">{p.name}</div>
                                    <div className="text-[11.5px] text-[#58607a]">{p.client}</div>
                                </div>
                                <Badge status={p.status} />
                            </div>

                            {/* Tags */}
                            <div className="flex gap-1.5 flex-wrap mb-3">
                                {(p.tags ?? []).map(t => (
                                    <span key={t} className="text-[11px] px-2 py-0.5 bg-white/[0.05] border border-[#252b40] rounded text-[#9a9180]">{t}</span>
                                ))}
                            </div>

                            {/* Description */}
                            <p className="text-[12.5px] text-[#9a9180] leading-relaxed mb-3 line-clamp-2">{p.description}</p>

                            {/* Budget */}
                            <div className="bg-[#11131d] rounded-lg p-3 mb-3">
                                <div className="flex justify-between text-[11.5px] text-[#58607a] mb-1.5">
                                    <span>Budget used</span>
                                    <span className={budgetPct > 90 ? 'text-red-400' : budgetPct > 70 ? 'text-orange-400' : 'text-[#9a9180]'}>
                                        {fmt(p.spent)} / {fmt(p.budget)}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-[#252b40] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full progress-fill ${budgetColor || 'bg-gradient-to-r from-[#c9a464] to-[#d4b472]'}`}
                                        style={{ width: `${budgetPct}%` }}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center text-[12px] text-[#58607a] mb-3">
                                <span>📅 {fmtDate(p.end_date)}</span>
                                <span className="text-[11px] px-2 py-0.5 bg-white/[0.05] border border-[#252b40] rounded">{p.phase}</span>
                            </div>

                            {/* Progress */}
                            <div>
                                <div className="flex justify-between text-[11.5px] text-[#58607a] mb-1.5">
                                    <span>Progress</span><span>{p.progress}%</span>
                                </div>
                                <div className="h-0.5 bg-[#252b40] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-[#c9a464] to-[#d4b472] progress-fill" style={{ width: `${p.progress}%` }} />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </AppLayout>
    );
}
