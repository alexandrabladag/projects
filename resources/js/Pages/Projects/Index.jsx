import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';
import { Plus, FolderKanban, Calendar, ArrowRight, Search, LayoutGrid, List } from 'lucide-react';
import { formatMoney, getCurrency } from '@/Utils/currencies';

const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

export default function Index({ projects, canManage }) {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [view, setView] = useState('list');

    const filtered = (filter === 'all' ? projects : projects.filter(p => p.status === filter))
        .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.client ?? '').toLowerCase().includes(search.toLowerCase()));

    const counts = {
        all: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        'on-hold': projects.filter(p => p.status === 'on-hold').length,
    };

    return (
        <AppLayout title="Projects" breadcrumbs={[{ label: 'Projects' }]}>
            <Head title="Projects" />

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex bg-[#f3f4f6] rounded-lg p-0.5">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'active', label: 'Active' },
                            { key: 'completed', label: 'Done' },
                            { key: 'on-hold', label: 'On Hold' },
                        ].map(s => (
                            <button
                                key={s.key}
                                onClick={() => setFilter(s.key)}
                                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                                    filter === s.key ? 'bg-white text-black shadow-sm' : 'text-[#6b7280] hover:text-black'
                                }`}
                            >
                                {s.label} <span className="text-[10px] opacity-50 ml-0.5">{counts[s.key]}</span>
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                        <input
                            type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search projects..."
                            className="pl-9 pr-3 py-1.5 bg-[#f3f4f6] border border-transparent rounded-lg text-[12px] text-black outline-none focus:border-[#4f6df5] focus:bg-white transition-all w-48"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex bg-[#f3f4f6] rounded-lg p-0.5">
                        <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-white text-black shadow-sm' : 'text-[#9ca3af]'}`}><List size={15} /></button>
                        <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-white text-black shadow-sm' : 'text-[#9ca3af]'}`}><LayoutGrid size={15} /></button>
                    </div>

                    {canManage && (
                        <Link href={route('projects.create')} className="inline-flex items-center gap-1.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-medium rounded-lg px-4 py-2 text-[13px] transition-all">
                            <Plus size={15} /> New Project
                        </Link>
                    )}
                </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="text-center py-20">
                    <div className="mb-4 flex justify-center"><div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center"><FolderKanban size={28} className="text-indigo-400" /></div></div>
                    <div className="text-[16px] font-semibold text-black mb-1">{search ? 'No matches' : 'No projects yet'}</div>
                    <div className="text-[13px] text-[#6b7280] mb-5">{search ? 'Try a different search term' : 'Create your first project to get started'}</div>
                    {canManage && !search && (
                        <Link href={route('projects.create')} className="inline-flex items-center gap-1.5 bg-[#4f6df5] text-white font-medium rounded-lg px-4 py-2 text-[13px]"><Plus size={15} /> Create Project</Link>
                    )}
                </div>
            )}

            {/* List View */}
            {view === 'list' && filtered.length > 0 && (
                <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#e5e7eb] bg-[#fafbfc]">
                                {['Project', 'Client', 'Status', 'Phase', 'Progress', 'Budget', 'Due Date', ''].map(h => (
                                    <th key={h} className="text-left text-[10px] tracking-[1.5px] uppercase text-[#9ca3af] font-medium px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => {
                                const budgetPct = p.budget > 0 ? Math.min(100, Math.round((p.spent / p.budget) * 100)) : 0;
                                const progressColor = p.progress >= 90 ? 'from-emerald-500 to-emerald-400'
                                    : p.progress >= 50 ? 'from-[#4f6df5] to-[#6380f7]' : 'from-amber-400 to-amber-300';

                                return (
                                    <tr key={p.id} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors group">
                                        <td className="px-4 py-3.5">
                                            <Link href={route('projects.show', p.id)} className="text-[13px] font-semibold text-black group-hover:text-[#4f6df5] transition-colors">
                                                {p.name}
                                            </Link>
                                            {(p.tags ?? []).length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {(p.tags ?? []).slice(0, 2).map(t => (
                                                        <span key={t} className="text-[9px] px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-500 font-medium">{t}</span>
                                                    ))}
                                                    {(p.tags ?? []).length > 2 && <span className="text-[9px] text-[#9ca3af]">+{p.tags.length - 2}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-[12px] text-[#6b7280]">{p.client}</td>
                                        <td className="px-4 py-3.5"><Badge status={p.status} /></td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-[11px] px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-500 font-medium">{p.phase}</span>
                                        </td>
                                        <td className="px-4 py-3.5 w-36">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full bg-gradient-to-r ${progressColor} progress-fill`} style={{ width: `${p.progress}%` }} />
                                                </div>
                                                <span className="text-[11px] font-semibold text-black w-8 text-right">{p.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-[12px]">
                                            {p.budget > 0 ? (
                                                <span>
                                                    <span className="text-[#6b7280]">{formatMoney(p.spent, p.currency)}</span>
                                                    <span className="text-[#d1d5db]"> / </span>
                                                    <span className="font-medium text-black">{formatMoney(p.budget, p.currency)}</span>
                                                </span>
                                            ) : <span className="text-[#d1d5db]">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-[12px] text-[#6b7280]">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {fmtDate(p.end_date)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <Link href={route('projects.show', p.id)} className="text-[#d1d5db] group-hover:text-[#4f6df5] transition-colors">
                                                <ArrowRight size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Grid View */}
            {view === 'grid' && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(p => {
                        const progressColor = p.progress >= 90 ? 'from-emerald-500 to-emerald-400'
                            : p.progress >= 50 ? 'from-[#4f6df5] to-[#6380f7]' : 'from-amber-400 to-amber-300';
                        const statusBorder = { active: 'border-t-emerald-400', completed: 'border-t-blue-400', 'on-hold': 'border-t-amber-400' };

                        return (
                            <Link
                                key={p.id}
                                href={route('projects.show', p.id)}
                                className={`group block bg-white border border-[#e5e7eb] ${statusBorder[p.status] ?? ''} border-t-[3px] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5 transition-all`}
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[15px] font-bold text-black leading-snug mb-0.5 group-hover:text-[#4f6df5] transition-colors truncate">{p.name}</div>
                                            <div className="text-[12px] text-[#6b7280]">{p.client}</div>
                                        </div>
                                        <Badge status={p.status} />
                                    </div>

                                    {(p.tags ?? []).length > 0 && (
                                        <div className="flex gap-1.5 flex-wrap mb-3">
                                            {(p.tags ?? []).slice(0, 3).map(t => (
                                                <span key={t} className="text-[10px] px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-500 font-medium">{t}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[11px] text-[#6b7280]">{p.phase}</span>
                                            <span className="text-[12px] font-semibold text-black">{p.progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full bg-gradient-to-r ${progressColor} progress-fill`} style={{ width: `${p.progress}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-[#f0f0f0]">
                                        <div className="flex items-center gap-1 text-[11px] text-[#6b7280]"><Calendar size={12} /> {fmtDate(p.end_date)}</div>
                                        {p.budget > 0 && (
                                            <div className="text-[11px]"><span className="text-[#6b7280]">{formatMoney(p.spent, p.currency)}</span><span className="text-[#d1d5db] mx-1">/</span><span className="font-medium text-black">{formatMoney(p.budget, p.currency)}</span></div>
                                        )}
                                        <ArrowRight size={14} className="text-[#d1d5db] group-hover:text-[#4f6df5] transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </AppLayout>
    );
}
