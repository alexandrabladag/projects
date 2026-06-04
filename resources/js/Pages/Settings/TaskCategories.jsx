import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useConfirm } from '@/Components/ui/ConfirmDialog';
import { Plus, Pencil, Trash2, Save, X, Tag } from 'lucide-react';

const inputCls = 'w-full bg-white border border-[#e5e7eb] rounded-lg px-3.5 py-2.5 text-[13px] text-black placeholder:text-[#9ca3af] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-150 hover:border-[#d1d5db] focus:border-[#4f6df5] focus:ring-[3px] focus:ring-[#4f6df5]/12';

const SWATCHES = ['#6b7280', '#4f6df5', '#3ecf8e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9'];

export default function TaskCategories({ categories }) {
    const confirm = useConfirm();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '', color: '#6b7280',
    });

    const openNew = () => { setEditing(null); reset(); setShowForm(true); };
    const openEdit = (c) => { setEditing(c); setData({ name: c.name, color: c.color ?? '#6b7280' }); setShowForm(true); };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('categories.update', editing.id), { onSuccess: () => { setShowForm(false); setEditing(null); } });
        } else {
            post(route('categories.store'), { onSuccess: () => { setShowForm(false); reset(); } });
        }
    };

    const remove = async (c) => {
        const extra = c.task_count > 0 ? `${c.task_count} task(s) using it will move to "General".` : 'This cannot be undone.';
        if (await confirm({ title: `Delete "${c.name}"?`, message: extra, danger: true }))
            router.delete(route('categories.destroy', c.id));
    };

    return (
        <AppLayout title="Task Categories" breadcrumbs={[{ label: 'Settings' }, { label: 'Task Categories' }]}>
            <Head title="Task Categories" />

            <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-[13px] text-[#4b5563]">Categories used to organise and filter tasks across all your projects.</p>
                    <button onClick={openNew} className="inline-flex items-center gap-1.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-medium rounded-lg px-4 py-2 text-[13px] transition-all">
                        <Plus size={15} /> Add Category
                    </button>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <form onSubmit={submit} className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-6">
                        <div className="mb-4">
                            <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Name *</label>
                            <input className={inputCls} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Deliverable, Client Approval, Milestone" autoFocus />
                            {errors.name && <p className="text-red-500 text-[12px] mt-1">{errors.name}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-[11px] tracking-[1px] uppercase text-[#4b5563] font-medium mb-2">Color</label>
                            <div className="flex items-center gap-2">
                                {SWATCHES.map(s => (
                                    <button key={s} type="button" onClick={() => setData('color', s)}
                                        className={`w-7 h-7 rounded-full transition-all ${data.color === s ? 'ring-2 ring-offset-2 ring-[#4f6df5]' : ''}`}
                                        style={{ background: s }} aria-label={s} />
                                ))}
                                <input type="color" value={data.color} onChange={e => setData('color', e.target.value)}
                                    className="w-7 h-7 rounded-full border-0 bg-transparent cursor-pointer p-0" title="Custom color" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] text-[#4b5563] border border-[#d1d5db] hover:bg-gray-50 transition-colors"><X size={14} /> Cancel</button>
                            <button type="submit" disabled={processing} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60"><Save size={14} /> {editing ? 'Update' : 'Add Category'}</button>
                        </div>
                    </form>
                )}

                {/* Empty state */}
                {categories.length === 0 && !showForm && (
                    <div className="text-center py-14 text-[#4b5563]">
                        <div className="mb-4 flex justify-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center"><Tag size={24} className="text-indigo-400" /></div></div>
                        <div className="text-[14px] font-semibold text-black mb-1">No categories yet</div>
                        <div className="text-[13px] text-[#4b5563] mb-4">Add categories to organise and filter tasks</div>
                    </div>
                )}

                {/* Categories List */}
                {categories.length > 0 && (
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        {categories.map(c => (
                            <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                                <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[14px] font-semibold text-black">{c.name}</div>
                                    <div className="text-[12px] text-[#4b5563]">{c.task_count} task{c.task_count === 1 ? '' : 's'}</div>
                                </div>
                                <button onClick={() => openEdit(c)} className="text-[#6b7280] hover:text-[#4f6df5] transition-colors p-1.5"><Pencil size={14} /></button>
                                <button onClick={() => remove(c)} className="text-[#6b7280] hover:text-red-500 transition-colors p-1.5"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
