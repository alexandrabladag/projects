import { Head, Link, router } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';
import { ListTodo, Calendar, AlertTriangle, FolderKanban } from 'lucide-react';

const statusLabel = (s) => ({
    'not-started': 'To Do',
    'in-progress': 'In Progress',
    'review': 'Review',
    'pending-approval': 'Pending Approval',
    'completed': 'Done',
}[s] ?? s);

const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

function bucketOf(due) {
    if (!due) return 'none';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(due + 'T00:00:00');
    const diff = Math.round((d - today) / 86400000);
    if (diff < 0) return 'overdue';
    if (diff <= 7) return 'week';
    return 'later';
}

const GROUPS = [
    { key: 'overdue', label: 'Overdue', tone: 'text-red-600' },
    { key: 'week', label: 'Due this week', tone: 'text-amber-600' },
    { key: 'later', label: 'Later', tone: 'text-[#6b7280]' },
    { key: 'none', label: 'No due date', tone: 'text-[#9ca3af]' },
];

export default function MyTasks({ tasks = [], filter, linkedId, canManage, members = [] }) {
    const grouped = { overdue: [], week: [], later: [], none: [] };
    tasks.forEach(t => grouped[bucketOf(t.due_date)].push(t));

    const changeMember = (val) => router.get(route('my-tasks'), val === 'all' ? {} : { member: val }, { preserveState: false, preserveScroll: true });

    return (
        <AppLayout title="My Tasks" breadcrumbs={[{ label: 'My Tasks' }]}>
            <Head title="My Tasks" />

            <div className="max-w-4xl">
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                    <div>
                        <h2 className="text-[18px] font-bold text-black flex items-center gap-2"><ListTodo size={20} className="text-[#4f6df5]" /> My Tasks</h2>
                        <p className="text-[13px] text-[#6b7280] mt-0.5">Open tasks across all your projects, by due date.</p>
                    </div>
                    {canManage && (
                        <select value={filter} onChange={e => changeMember(e.target.value)} className="px-3 py-2 rounded-lg text-[13px] font-medium bg-[#f3f4f6] text-black border border-[#d1d5db] cursor-pointer">
                            <option value="all">All team members</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}{String(m.id) === String(linkedId) ? ' (me)' : ''}</option>)}
                        </select>
                    )}
                </div>

                {!canManage && !linkedId && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-700 mb-6 flex items-center gap-2">
                        <AlertTriangle size={16} /> Your account isn’t linked to a team member yet, so no tasks can be shown. Ask an admin to link you in Settings → Team Members.
                    </div>
                )}

                {tasks.length === 0 ? (
                    <div className="text-center py-16 text-[#6b7280]">
                        <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center"><ListTodo size={24} className="text-emerald-400" /></div></div>
                        <div className="text-[14px] font-semibold text-black mb-1">All clear</div>
                        <div className="text-[13px] text-[#6b7280]">No open tasks to show.</div>
                    </div>
                ) : (
                    GROUPS.map(g => grouped[g.key].length > 0 && (
                        <div key={g.key} className="mb-6">
                            <div className={`flex items-center gap-2 text-[11px] tracking-[1.5px] uppercase font-semibold mb-2 ${g.tone}`}>
                                {g.key === 'overdue' && <AlertTriangle size={13} />} {g.label} <span className="text-[#d1d5db]">({grouped[g.key].length})</span>
                            </div>
                            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                                {grouped[g.key].map(t => (
                                    <Link
                                        key={t.id}
                                        href={`${route('projects.show', t.project?.id)}?tab=tasks`}
                                        className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-black truncate">{t.title}</div>
                                            <div className="text-[11px] text-[#9ca3af] flex items-center gap-1.5 mt-0.5">
                                                {t.project && <span className="flex items-center gap-0.5"><FolderKanban size={10} /> {t.project.name}</span>}
                                                {t.category && <><span>·</span><span>{t.category}</span></>}
                                                {t.due_date && <><span>·</span><span className={`flex items-center gap-0.5 ${g.key === 'overdue' ? 'text-red-500' : ''}`}><Calendar size={10} /> {fmtDate(t.due_date)}</span></>}
                                            </div>
                                        </div>
                                        {t.priority === 'high' && <Badge status="high" label="High" />}
                                        <Badge status={t.status} label={statusLabel(t.status)} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
