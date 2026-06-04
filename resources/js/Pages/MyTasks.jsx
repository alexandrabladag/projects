import { Head, Link, router } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';
import EmptyState from '@/Components/ui/EmptyState';
import Select from '@/Components/ui/Select';
import { ListTodo, Calendar, AlertTriangle, FolderKanban, Clock, CalendarClock } from 'lucide-react';

const PRIORITY_DOT = { high: '#ef4444', medium: '#f59e0b', low: '#16a34a' };

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
    { key: 'later', label: 'Later', tone: 'text-[#4b5563]' },
    { key: 'none', label: 'No due date', tone: 'text-[#6b7280]' },
];

export default function MyTasks({ tasks = [], filter, linkedId, canManage, members = [] }) {
    const grouped = { overdue: [], week: [], later: [], none: [] };
    tasks.forEach(t => grouped[bucketOf(t.due_date)].push(t));

    const changeMember = (val) => router.get(route('my-tasks'), val === 'all' ? {} : { member: val }, { preserveState: false, preserveScroll: true });

    return (
        <AppLayout title="My Tasks" breadcrumbs={[{ label: 'My Tasks' }]}>
            <Head title="My Tasks" />

            <div className="max-w-4xl">
                <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
                    <div>
                        <h2 className="font-serif text-[22px] md:text-[26px] font-semibold text-black leading-tight">My Tasks</h2>
                        <p className="text-[13px] text-[#4b5563] mt-1">Open tasks across all your projects, by due date.</p>
                    </div>
                    {canManage && (
                        <Select
                            value={filter}
                            onChange={v => changeMember(v)}
                            options={[
                                { value: 'all', label: 'All team members' },
                                ...members.map(m => ({ value: m.id, label: `${m.name}${String(m.id) === String(linkedId) ? ' (me)' : ''}` })),
                            ]}
                        />
                    )}
                </div>

                {!canManage && !linkedId && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-700 mb-6 flex items-center gap-2">
                        <AlertTriangle size={16} /> Your account isn’t linked to a team member yet, so no tasks can be shown. Ask an admin to link you in Settings → Team Members.
                    </div>
                )}

                {/* Summary */}
                {tasks.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
                        {[
                            { label: 'Open tasks', value: tasks.length, icon: <ListTodo size={17} />, accent: '#4f6df5' },
                            { label: 'Overdue', value: grouped.overdue.length, icon: <AlertTriangle size={17} />, accent: grouped.overdue.length ? '#ef4444' : '#9ca3af' },
                            { label: 'Due this week', value: grouped.week.length, icon: <CalendarClock size={17} />, accent: grouped.week.length ? '#f59e0b' : '#9ca3af' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-4 md:p-5 hover:shadow-[0_2px_14px_rgba(17,24,39,0.05)] hover:border-[#d6dae0] transition-all">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3.5" style={{ background: `${s.accent}14`, color: s.accent }}>{s.icon}</div>
                                <div className="text-[22px] md:text-[24px] font-bold text-black leading-none tracking-tight">{s.value}</div>
                                <div className="text-[12px] text-[#4b5563] mt-1.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {tasks.length === 0 ? (
                    <EmptyState
                        icon={<ListTodo size={24} />}
                        accent="#16a34a"
                        title="All clear"
                        subtitle="You have no open tasks to show."
                    />
                ) : (
                    GROUPS.map(g => grouped[g.key].length > 0 && (
                        <div key={g.key} className="mb-6">
                            <div className={`flex items-center gap-2 text-[11px] tracking-[1.5px] uppercase font-semibold mb-2 ${g.tone}`}>
                                {g.key === 'overdue' && <AlertTriangle size={13} />} {g.label} <span className="text-[#6b7280]">({grouped[g.key].length})</span>
                            </div>
                            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                                {grouped[g.key].map(t => (
                                    <Link
                                        key={t.id}
                                        href={`${route('projects.show', t.project?.id)}?tab=tasks`}
                                        className="group flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors"
                                    >
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PRIORITY_DOT[t.priority] ?? '#9ca3af' }} title={`${t.priority ?? 'no'} priority`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-black truncate group-hover:text-[#4f6df5] transition-colors">{t.title}</div>
                                            <div className="text-[11px] text-[#6b7280] flex items-center gap-1.5 mt-0.5">
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
