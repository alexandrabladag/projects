import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import currencies from '@/Utils/currencies';
import { Building2, MapPin, Hash, Save } from 'lucide-react';

export default function Company({ company }) {
    const { data, setData, post, processing, errors } = useForm({
        name: company.name ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        address_line_1: company.address_line_1 ?? '',
        address_line_2: company.address_line_2 ?? '',
        city: company.city ?? '',
        state: company.state ?? '',
        postal_code: company.postal_code ?? '',
        country: company.country ?? '',
        tax_id: company.tax_id ?? '',
        website: company.website ?? '',
        logo: null,
        base_currency: company.base_currency ?? 'USD',
        invoice_prefix: company.invoice_prefix ?? 'INV',
        invoice_format: company.invoice_format ?? '{PREFIX}-{YEAR}-{NUMBER}',
        proposal_prefix: company.proposal_prefix ?? 'PROP',
        proposal_format: company.proposal_format ?? '{PREFIX}-{YEAR}-{NUMBER}',
        next_invoice_number: company.next_invoice_number ?? 1,
        next_proposal_number: company.next_proposal_number ?? 1,
        number_padding: company.number_padding ?? 3,
    });

    // Live preview of number format
    const previewNumber = (prefix, format, next, padding) => {
        return format
            .replace('{PREFIX}', prefix)
            .replace('{YEAR}', new Date().getFullYear())
            .replace('{MONTH}', String(new Date().getMonth() + 1).padStart(2, '0'))
            .replace('{NUMBER}', String(next).padStart(padding, '0'));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('company.update'), { forceFormData: true });
    };

    const field = (label, key, type = 'text', placeholder = '', half = false) => (
        <div className={half ? '' : 'col-span-2'}>
            <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">{label}</label>
            <input
                type={type}
                value={data[key]}
                onChange={e => setData(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[13px] text-black outline-none focus:border-[#4f6df5] transition-colors"
            />
            {errors[key] && <p className="text-red-500 text-[12px] mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <AppLayout
            title="Company Settings"
            breadcrumbs={[{ label: 'Settings' }, { label: 'Company' }]}
        >
            <Head title="Company Settings" />

            <div className="max-w-2xl">
                <p className="text-[13px] text-[#6b7280] mb-6">
                    Your company information appears on invoices, proposals, and documents.
                </p>

                <form onSubmit={submit} className="bg-white border border-[#e5e7eb] rounded-xl p-7 space-y-5">
                    {/* Logo */}
                    <div>
                        <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Company Logo</label>
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[#d1d5db] flex items-center justify-center bg-[#f9fafb] overflow-hidden flex-shrink-0">
                                {(data.logo || company.logo_path) ? (
                                    <img
                                        src={data.logo ? URL.createObjectURL(data.logo) : `/storage/${company.logo_path}`}
                                        alt="Logo"
                                        className="w-full h-full object-contain p-1"
                                    />
                                ) : (
                                    <span className="text-[#9ca3af] text-[24px]">+</span>
                                )}
                            </div>
                            <div>
                                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-[#4f6df5] border border-[#4f6df5]/30 hover:bg-[#4f6df5]/5 cursor-pointer transition-colors">
                                    Choose file
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setData('logo', e.target.files[0])}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-[11px] text-[#9ca3af] mt-1.5">PNG, JPG, SVG. Max 2MB.</p>
                            </div>
                        </div>
                        {errors.logo && <p className="text-red-500 text-[12px] mt-1">{errors.logo}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {field('Company Name *', 'name', 'text', 'Your company name')}
                        {field('Email', 'email', 'email', 'company@example.com', true)}
                        {field('Phone', 'phone', 'text', '+1 (___) ___-____', true)}
                        {field('Website', 'website', 'text', 'https://example.com', true)}
                        {field('Tax ID / VAT', 'tax_id', 'text', 'e.g. US123456789', true)}
                    </div>

                    {/* Base Currency */}
                    <div>
                        <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Base Currency</label>
                        <select
                            value={data.base_currency}
                            onChange={e => setData('base_currency', e.target.value)}
                            className="w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[13px] text-black outline-none focus:border-[#4f6df5] transition-colors"
                        >
                            {currencies.map(c => (
                                <option key={c.code} value={c.code}>{c.country} — {c.name} ({c.symbol})</option>
                            ))}
                        </select>
                        <p className="text-[11px] text-[#9ca3af] mt-1.5">This is your main operating currency. All dashboard totals and reports will display in this currency.</p>
                    </div>

                    <div className="pt-2">
                        <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">
                            Address <span className="flex-1 h-px bg-[#e5e7eb]" />
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

                    {/* Document Numbering */}
                    <div className="pt-2">
                        <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">
                            Document Numbering <span className="flex-1 h-px bg-[#e5e7eb]" />
                        </div>

                        <div className="text-[12px] text-[#6b7280] mb-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2.5">
                            Use these variables in the format: <code className="text-[#4f6df5] font-mono">{'{PREFIX}'}</code> <code className="text-[#4f6df5] font-mono">{'{YEAR}'}</code> <code className="text-[#4f6df5] font-mono">{'{MONTH}'}</code> <code className="text-[#4f6df5] font-mono">{'{NUMBER}'}</code>
                        </div>

                        {/* Invoice */}
                        <div className="mb-5">
                            <div className="text-[12px] font-semibold text-black mb-2">Invoice Numbering</div>
                            <div className="grid grid-cols-3 gap-3">
                                {field('Prefix', 'invoice_prefix', 'text', 'INV', true)}
                                <div>
                                    <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Format</label>
                                    <input
                                        type="text"
                                        value={data.invoice_format}
                                        onChange={e => setData('invoice_format', e.target.value)}
                                        placeholder="{PREFIX}-{YEAR}-{NUMBER}"
                                        className="w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[13px] text-black outline-none focus:border-[#4f6df5] transition-colors font-mono"
                                    />
                                </div>
                                {field('Next Number', 'next_invoice_number', 'number', '1', true)}
                            </div>
                            <div className="mt-2 text-[12px] text-[#6b7280]">
                                Preview: <span className="font-semibold text-black font-mono">{previewNumber(data.invoice_prefix, data.invoice_format, data.next_invoice_number, data.number_padding)}</span>
                            </div>
                        </div>

                        {/* Proposal */}
                        <div className="mb-3">
                            <div className="text-[12px] font-semibold text-black mb-2">Proposal Numbering</div>
                            <div className="grid grid-cols-3 gap-3">
                                {field('Prefix', 'proposal_prefix', 'text', 'PROP', true)}
                                <div>
                                    <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Format</label>
                                    <input
                                        type="text"
                                        value={data.proposal_format}
                                        onChange={e => setData('proposal_format', e.target.value)}
                                        placeholder="{PREFIX}-{YEAR}-{NUMBER}"
                                        className="w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[13px] text-black outline-none focus:border-[#4f6df5] transition-colors font-mono"
                                    />
                                </div>
                                {field('Next Number', 'next_proposal_number', 'number', '1', true)}
                            </div>
                            <div className="mt-2 text-[12px] text-[#6b7280]">
                                Preview: <span className="font-semibold text-black font-mono">{previewNumber(data.proposal_prefix, data.proposal_format, data.next_proposal_number, data.number_padding)}</span>
                            </div>
                        </div>

                        {/* Padding */}
                        <div className="grid grid-cols-3 gap-3">
                            {field('Number Padding (digits)', 'number_padding', 'number', '3', true)}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-[#e5e7eb]">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60"
                        >
                            {processing ? 'Saving…' : <><Save size={14} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
