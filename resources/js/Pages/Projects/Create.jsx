import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '', client: '', contact_name: '', contact_email: '',
        contact_phone: '', status: 'active', start_date: '', end_date: '',
        budget: '', description: '', tags: '', phase: 'Discovery',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('projects.store'));
    };

    const field = (label, key, type = 'text', placeholder = '', half = false) => (
        <div className={half ? '' : 'col-span-2'}>
            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#58607a] font-medium mb-2">{label}</label>
            <input
                type={type}
                value={data[key]}
                onChange={e => setData(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#11131d] border border-[#252b40] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e2dcd2] outline-none focus:border-[#c9a464] transition-colors"
            />
            {errors[key] && <p className="text-red-400 text-[12px] mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <AppLayout
            title="New Project"
            breadcrumbs={[
                { label: 'Projects', href: route('projects.index') },
                { label: 'New Project' },
            ]}
        >
            <Head title="New Project" />

            <div className="max-w-2xl">
                <form onSubmit={submit} className="bg-[#171a28] border border-[#1d2236] rounded-xl p-7 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        {field('Project Name *', 'name', 'text', 'e.g. Brand Refresh 2026')}
                        {field('Client / Company *', 'client', 'text', 'Company name')}
                        {field('Contact Name', 'contact_name', 'text', 'Full name', true)}
                        {field('Contact Email', 'contact_email', 'email', 'email@company.com', true)}
                        {field('Contact Phone', 'contact_phone', 'text', '+1 (___) ___-____', true)}

                        <div>
                            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#58607a] font-medium mb-2">Status</label>
                            <select
                                value={data.status}
                                onChange={e => setData('status', e.target.value)}
                                className="w-full bg-[#11131d] border border-[#252b40] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e2dcd2] outline-none focus:border-[#c9a464] transition-colors"
                            >
                                <option value="active">Active</option>
                                <option value="on-hold">On Hold</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {field('Budget ($)', 'budget', 'number', '0', true)}
                        {field('Phase', 'phase', 'text', 'e.g. Discovery', true)}
                        {field('Start Date', 'start_date', 'date', '', true)}
                        {field('End Date', 'end_date', 'date', '', true)}

                        <div className="col-span-2">
                            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#58607a] font-medium mb-2">Description</label>
                            <textarea
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Brief project overview and goals..."
                                rows={4}
                                className="w-full bg-[#11131d] border border-[#252b40] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e2dcd2] outline-none focus:border-[#c9a464] transition-colors resize-y"
                            />
                        </div>

                        {field('Tags (comma-separated)', 'tags', 'text', 'e.g. Branding, Design, Marketing')}
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-[#1d2236]">
                        <Link href={route('projects.index')} className="px-4 py-2.5 rounded-lg text-[13px] text-[#9a9180] border border-[#252b40] hover:bg-white/[0.03] transition-colors">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 bg-[#c9a464] hover:bg-[#d4b472] text-[#0b0d14] font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60"
                        >
                            {processing ? 'Creating…' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
