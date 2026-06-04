import { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import currencies from '@/Utils/currencies';
import Select from '@/Components/ui/Select';
import { Save, X, Plus, Info } from 'lucide-react';

const inputCls = 'w-full bg-white border border-[#e5e7eb] rounded-lg px-3.5 py-2.5 text-[13px] text-black placeholder:text-[#9ca3af] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-150 hover:border-[#d1d5db] focus:border-[#4f6df5] focus:ring-[3px] focus:ring-[#4f6df5]/12';

export default function Create({ clients = [] }) {
    const page = usePage();
    const resolvedClients = clients.length > 0 ? clients : (page.props.clients ?? []);
    const baseCurrency = page.props.baseCurrency ?? 'USD';
    const teamMembers = page.props.teamMembers ?? [];
    const [isNewClient, setIsNewClient] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '', client_id: '', new_client_name: '', client: '',
        contact_name: '', contact_email: '', contact_phone: '',
        status: 'active', lead_id: '', start_date: '', end_date: '', launch_date: '',
        tax_type: '', tax_rate: 0,
        budget: '', currency: baseCurrency, description: '', tags: '', phase: 'Discovery',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('projects.store'));
    };

    const handleClientSelect = (value) => {
        if (value === '__new__') {
            setIsNewClient(true);
            setData(prev => ({ ...prev, client_id: '', new_client_name: '', client: '', contact_name: '', contact_email: '', contact_phone: '' }));
        } else {
            setIsNewClient(false);
            const selected = resolvedClients.find(c => String(c.id) === value);
            setData(prev => ({
                ...prev,
                client_id: value,
                new_client_name: '',
                client: selected?.name ?? '',
                contact_name: selected?.contact_name ?? '',
                contact_email: selected?.contact_email ?? '',
                contact_phone: selected?.contact_phone ?? '',
            }));
        }
    };

    const field = (label, key, type = 'text', placeholder = '', half = false) => (
        <div className={half ? '' : 'col-span-2'}>
            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">{label}</label>
            <input
                type={type}
                value={data[key]}
                onChange={e => setData(key, e.target.value)}
                placeholder={placeholder}
                className={inputCls}
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
                <form onSubmit={submit} className="bg-white border border-[#e5e7eb] rounded-xl p-7 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        {field('Project Name *', 'name', 'text', 'e.g. Brand Refresh 2026')}

                        {/* Client Selection */}
                        <div className="col-span-2">
                            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Client / Company *</label>
                            <Select
                                value={isNewClient ? '__new__' : data.client_id}
                                onChange={v => handleClientSelect(v)}
                                placeholder="Select a client..."
                                clearable
                                options={[
                                    ...resolvedClients.map(c => ({ value: c.id, label: `${c.name}${c.type === 'vendor' ? ' (Vendor)' : ''}` })),
                                    { value: '__new__', label: '＋ Create new client' },
                                ]}
                            />
                            {errors.client_id && <p className="text-red-400 text-[12px] mt-1">{errors.client_id}</p>}
                            {errors.new_client_name && !isNewClient && <p className="text-red-400 text-[12px] mt-1">Please select or create a client</p>}
                        </div>

                        {/* Inline New Client */}
                        {isNewClient && (
                            <div className="col-span-2 bg-[#f0f4ff] border border-[#4f6df5]/20 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Plus size={14} className="text-[#4f6df5]" />
                                        <span className="text-[12px] font-semibold text-black">New Client</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setIsNewClient(false); setData(prev => ({ ...prev, client_id: '', new_client_name: '' })); }}
                                        className="text-[11px] text-[#4b5563] hover:text-black transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Company Name *</label>
                                    <input
                                        type="text"
                                        value={data.new_client_name}
                                        onChange={e => setData('new_client_name', e.target.value)}
                                        placeholder="Company name"
                                        className={inputCls}
                                    />
                                    {errors.new_client_name && <p className="text-red-400 text-[12px] mt-1">{errors.new_client_name}</p>}
                                </div>
                                <div className="flex items-start gap-2 text-[12px] text-[#4f6df5] bg-[#4f6df5]/10 rounded-lg px-3 py-2">
                                    <Info size={14} className="mt-0.5 flex-shrink-0" />
                                    <span>A client record will be created with basic info. You can complete their full details (address, tax ID, etc.) in <strong>Clients & Vendors</strong> after saving.</span>
                                </div>
                            </div>
                        )}

                        {/* Contact fields */}
                        <div className="col-span-2">
                            <div className="text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-3 flex items-center gap-3">
                                Contact Person <span className="flex-1 h-px bg-[#e5e7eb]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Contact Name</label>
                                    <input type="text" value={data.contact_name} onChange={e => setData('contact_name', e.target.value)} placeholder="Full name" className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Contact Email</label>
                                    <input type="email" value={data.contact_email} onChange={e => setData('contact_email', e.target.value)} placeholder="email@company.com" className={inputCls} />
                                    {errors.contact_email && <p className="text-red-400 text-[12px] mt-1">{errors.contact_email}</p>}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Contact Phone</label>
                                    <input type="text" value={data.contact_phone} onChange={e => setData('contact_phone', e.target.value)} placeholder="+1 (___) ___-____" className={inputCls} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Status</label>
                            <Select
                                value={data.status}
                                onChange={v => setData('status', v)}
                                options={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'on-hold', label: 'On Hold' },
                                    { value: 'completed', label: 'Completed' },
                                ]}
                            />
                        </div>

                        {/* Project Lead */}
                        <div>
                            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Project Lead</label>
                            <Select
                                value={data.lead_id}
                                onChange={v => setData('lead_id', v)}
                                placeholder="No lead assigned"
                                clearable
                                options={teamMembers.map(m => ({ value: m.id, label: `${m.name}${m.role ? ` — ${m.role}` : ''}` }))}
                            />
                            {errors.lead_id && <p className="text-red-400 text-[12px] mt-1">{errors.lead_id}</p>}
                        </div>

                        {/* Budget + Currency */}
                        <div>
                            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Budget</label>
                            <div className="flex gap-2">
                                <Select
                                    value={data.currency}
                                    onChange={v => setData('currency', v)}
                                    className="w-[140px] flex-shrink-0"
                                    options={currencies.map(c => ({ value: c.code, label: `${c.country} (${c.symbol})` }))}
                                />
                                <input
                                    type="number"
                                    value={data.budget}
                                    onChange={e => setData('budget', e.target.value)}
                                    placeholder="0"
                                    className={inputCls}
                                />
                            </div>
                            {errors.budget && <p className="text-red-400 text-[12px] mt-1">{errors.budget}</p>}
                        </div>
                        {/* Phase */}
                        <div>
                            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Phase</label>
                            <Select
                                value={data.phase}
                                onChange={v => setData('phase', v)}
                                options={[
                                    { value: 'Discovery', label: 'Discovery' },
                                    { value: 'Planning', label: 'Planning' },
                                    { value: 'Design', label: 'Design' },
                                    { value: 'Development', label: 'Development' },
                                    { value: 'Testing / QA', label: 'Testing / QA' },
                                    { value: 'Staging', label: 'Staging' },
                                    { value: 'Deployment', label: 'Deployment' },
                                    { value: 'Launch', label: 'Launch' },
                                    { value: 'Maintenance', label: 'Maintenance' },
                                    { value: 'Support', label: 'Support' },
                                ]}
                            />
                        </div>
                        {field('Start Date', 'start_date', 'date', '', true)}
                        {field('End Date', 'end_date', 'date', '', true)}
                        {field('Launch Date', 'launch_date', 'date', '', true)}

                        {/* Tax */}
                        <div>
                            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Tax Type</label>
                            <Select
                                value={data.tax_type}
                                onChange={v => setData('tax_type', v)}
                                placeholder="No Tax"
                                clearable
                                options={[
                                    { value: 'vat', label: 'VAT' },
                                    { value: 'gst', label: 'GST' },
                                    { value: 'sales_tax', label: 'Sales Tax' },
                                    { value: 'withholding', label: 'Withholding Tax' },
                                    { value: 'consumption', label: 'Consumption Tax (Japan)' },
                                    { value: 'custom', label: 'Custom' },
                                ]}
                            />
                        </div>
                        {field('Tax Rate (%)', 'tax_rate', 'number', '0', true)}

                        <div className="col-span-2">
                            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#4b5563] font-medium mb-2">Description</label>
                            <textarea
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Brief project overview and goals..."
                                rows={4}
                                className={`${inputCls} resize-y`}
                            />
                        </div>

                        {field('Tags (comma-separated)', 'tags', 'text', 'e.g. Branding, Design, Marketing')}
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-[#e5e7eb]">
                        <Link href={route('projects.index')} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] text-[#374151] border border-[#d1d5db] hover:bg-gray-100 transition-colors">
                            <X size={14} /> Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60"
                        >
                            <Plus size={14} /> {processing ? 'Creating…' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
