import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout, { Badge } from '@/Layouts/AppLayout';
import { Plus, Building2, ArrowRight } from 'lucide-react';

export default function Index({ clients }) {
    const [filter, setFilter] = useState('all');
    const filtered = filter === 'all' ? clients : clients.filter(c => c.type === filter);

    return (
        <AppLayout
            title="Clients & Vendors"
            breadcrumbs={[{ label: 'Clients' }]}
        >
            <Head title="Clients & Vendors" />

            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'client', label: 'Clients' },
                        { key: 'vendor', label: 'Vendors' },
                        { key: 'contractor', label: 'Contractors' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all
                                ${filter === key
                                    ? 'bg-[#4f6df5]/10 border-[#4f6df5]/30 text-[#4f6df5]'
                                    : 'bg-transparent border-[#d1d5db] text-[#6b7280] hover:text-black hover:bg-gray-50'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <Link
                    href={route('clients.create')}
                    className="inline-flex items-center gap-2 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-medium rounded-lg px-4 py-2 text-[13px] transition-all"
                >
                    <Plus size={15} /> Add {{ client: 'Client', vendor: 'Vendor', contractor: 'Contractor' }[filter] ?? 'New'}
                </Link>
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 text-[#6b7280]">
                    <div className="mb-3 opacity-30 flex justify-center"><Building2 size={40} /></div>
                    <div className="text-[14px] mb-5">
                        No {{ client: 'clients', vendor: 'vendors', contractor: 'contractors' }[filter] ?? 'entries'} found
                    </div>
                    <Link href={route('clients.create')} className="inline-flex items-center gap-2 bg-[#4f6df5] text-white font-medium rounded-lg px-4 py-2 text-[13px]">
                        Add your first {{ client: 'client', vendor: 'vendor', contractor: 'contractor' }[filter] ?? 'entry'}
                    </Link>
                </div>
            )}

            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#e5e7eb]">
                            {['Name', 'Type', 'Contact', 'Email', 'Phone', 'Projects', ''].map(h => (
                                <th key={h} className="text-left text-[11px] tracking-[1.5px] uppercase text-[#6b7280] font-medium px-4 py-3">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(client => (
                            <tr key={client.id} className="border-b border-[#e5e7eb] last:border-b-0 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3.5">
                                    <Link href={route('clients.show', client.id)} className="text-[13px] font-semibold text-black hover:text-[#4f6df5] transition-colors">
                                        {client.name}
                                    </Link>
                                    {client.city && <div className="text-[11.5px] text-[#6b7280]">{client.city}{client.country ? `, ${client.country}` : ''}</div>}
                                </td>
                                <td className="px-4 py-3.5">
                                    <Badge status={client.type === 'vendor' ? 'review' : client.type === 'contractor' ? 'in-progress' : 'active'} label={client.type} />
                                </td>
                                <td className="px-4 py-3.5 text-[13px] text-[#4b5563]">{client.contact_name ?? '—'}</td>
                                <td className="px-4 py-3.5 text-[13px] text-[#4f6df5]">{client.contact_email ?? client.email ?? '—'}</td>
                                <td className="px-4 py-3.5 text-[13px] text-[#6b7280]">{client.contact_phone ?? client.phone ?? '—'}</td>
                                <td className="px-4 py-3.5 text-[13px] text-[#4b5563]">{client.projects_count}</td>
                                <td className="px-4 py-3.5">
                                    <Link href={route('clients.show', client.id)} className="inline-flex items-center gap-1 text-[12px] text-[#6b7280] hover:text-black transition-colors">
                                        View <ArrowRight size={12} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
