import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const inputCls = 'w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[13px] text-black outline-none focus:border-[#4f6df5] transition-colors';

export default function Create({ client: existing }) {
    const isEdit = !!existing;

    const { data, setData, post, put, processing, errors } = useForm({
        type: existing?.type ?? 'client',
        name: existing?.name ?? '',
        email: existing?.email ?? '',
        phone: existing?.phone ?? '',
        address_line_1: existing?.address_line_1 ?? '',
        address_line_2: existing?.address_line_2 ?? '',
        city: existing?.city ?? '',
        state: existing?.state ?? '',
        postal_code: existing?.postal_code ?? '',
        country: existing?.country ?? '',
        tax_id: existing?.tax_id ?? '',
        website: existing?.website ?? '',
        contact_name: existing?.contact_name ?? '',
        contact_email: existing?.contact_email ?? '',
        contact_phone: existing?.contact_phone ?? '',
        notes: existing?.notes ?? '',
    });

    const isContractor = data.type === 'contractor';
    const typeLabel = { client: 'Client', vendor: 'Vendor', contractor: 'Contractor' }[data.type] ?? 'Client';

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('clients.update', existing.id));
        } else {
            post(route('clients.store'));
        }
    };

    const field = (label, key, type = 'text', placeholder = '', half = false) => (
        <div className={half ? '' : 'col-span-2'}>
            <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">{label}</label>
            <input
                type={type}
                value={data[key]}
                onChange={e => setData(key, e.target.value)}
                placeholder={placeholder}
                className={inputCls}
            />
            {errors[key] && <p className="text-red-500 text-[12px] mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <AppLayout
            title={isEdit ? `Edit ${typeLabel}` : `New ${typeLabel}`}
            breadcrumbs={[
                { label: 'Clients & Vendors', href: route('clients.index') },
                { label: isEdit ? existing.name : `New ${typeLabel}` },
            ]}
        >
            <Head title={isEdit ? `Edit ${typeLabel}` : `New ${typeLabel}`} />

            <div className="max-w-2xl">
                <form onSubmit={submit} className="bg-white border border-[#e5e7eb] rounded-xl p-7 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Type */}
                        <div>
                            <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Type</label>
                            <select
                                value={data.type}
                                onChange={e => setData('type', e.target.value)}
                                className={inputCls}
                            >
                                <option value="client">Client (Business)</option>
                                <option value="vendor">Vendor (Business)</option>
                                <option value="contractor">Independent Contractor</option>
                            </select>
                        </div>

                        {/* Name field adapts to type */}
                        {field(isContractor ? 'Full Name *' : 'Company Name *', 'name', 'text', isContractor ? 'Full name' : 'Company name', true)}

                        {field(isContractor ? 'Personal Email' : 'Company Email', 'email', 'email', isContractor ? 'name@email.com' : 'info@company.com', true)}
                        {field(isContractor ? 'Phone' : 'Company Phone', 'phone', 'text', '+1 (___) ___-____', true)}

                        {/* Business-only fields */}
                        {!isContractor && field('Website', 'website', 'text', 'https://example.com', true)}
                        {!isContractor && field('Tax ID / VAT', 'tax_id', 'text', 'e.g. US123456789', true)}
                    </div>

                    {/* Contact Person — only for businesses */}
                    {!isContractor && (
                        <div className="pt-2">
                            <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">
                                Primary Contact <span className="flex-1 h-px bg-[#e5e7eb]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {field('Contact Name', 'contact_name', 'text', 'Full name', true)}
                                {field('Contact Email', 'contact_email', 'email', 'name@company.com', true)}
                                {field('Contact Phone', 'contact_phone', 'text', '+1 (___) ___-____')}
                            </div>
                        </div>
                    )}

                    {/* Address */}
                    <div className="pt-2">
                        <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">
                            Address <span className="text-[#9ca3af] font-normal normal-case tracking-normal">(optional)</span>
                            <span className="flex-1 h-px bg-[#e5e7eb]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {field('Address Line 1', 'address_line_1', 'text', 'Street address')}
                            {field('Address Line 2', 'address_line_2', 'text', 'Suite, unit, etc.')}
                            {field('City', 'city', 'text', 'City', true)}
                            {field('State / Province', 'state', 'text', 'State', true)}
                            {field('Postal Code', 'postal_code', 'text', '00000', true)}
                            {field('Country', 'country', 'text', 'Country', true)}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Notes</label>
                        <textarea
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            placeholder={`Additional notes about this ${typeLabel.toLowerCase()}...`}
                            rows={3}
                            className={`${inputCls} resize-y`}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-[#e5e7eb]">
                        <Link href={route('clients.index')} className="px-4 py-2.5 rounded-lg text-[13px] text-[#6b7280] border border-[#d1d5db] hover:bg-gray-50 transition-colors">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60"
                        >
                            {processing ? 'Saving…' : isEdit ? `Update ${typeLabel}` : `Create ${typeLabel}`}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
