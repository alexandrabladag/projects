import { useRef } from 'react';
import { Head } from '@inertiajs/react';
import { formatMoney, getCurrency } from '@/Utils/currencies';
import { Download, ArrowLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function View({ invoice, company }) {
    const pageRef = useRef();
    const project = invoice.project ?? {};
    const client = project.client_record ?? {};
    const cur = getCurrency(invoice.currency ?? project.currency ?? 'USD');
    const fmt = (n) => formatMoney(n, cur.code);
    const items = invoice.items ?? [];
    const hasQty = items.some(i => i.quantity > 1);

    const downloadPdf = () => {
        html2pdf().set({
            margin: 0,
            filename: `${invoice.number}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        }).from(pageRef.current).save();
    };

    return (
        <>
            <Head title={`Invoice ${invoice.number}`} />

            <style>{`
                @media print {
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .invoice-page { box-shadow: none !important; margin: 0 !important; padding: 48px !important; }
                }
            `}</style>

            {/* Toolbar */}
            <div className="no-print bg-white border-b border-[#e5e7eb] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-black transition-colors">
                    <ArrowLeft size={15} /> Back to Project
                </button>
                <button onClick={downloadPdf} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all">
                    <Download size={15} /> Download PDF
                </button>
            </div>

            <div className="min-h-screen bg-[#f3f4f6] flex justify-center py-10 px-4">
                <div ref={pageRef} className="invoice-page bg-white rounded-xl shadow-sm w-full max-w-[800px] p-12">

                    {/* Header — compact row */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-start gap-4">
                            {company?.logo_path && (
                                <img src={`/storage/${company.logo_path}`} alt="Logo" className="h-10 flex-shrink-0" />
                            )}
                            <div>
                                <div className="text-[14px] font-bold text-black leading-tight">{company?.name ?? 'Your Company'}</div>
                                <div className="text-[11px] text-[#6b7280] leading-snug mt-0.5">
                                    {[
                                        company?.address_line_1,
                                        [company?.city, company?.state, company?.postal_code].filter(Boolean).join(', '),
                                        company?.country,
                                    ].filter(Boolean).join(' · ')}
                                </div>
                                <div className="text-[11px] text-[#6b7280] leading-snug">
                                    {[company?.email, company?.phone, company?.website].filter(Boolean).join(' · ')}
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-[24px] font-extrabold text-[#4f6df5] tracking-tight">INVOICE</div>
                            <div className="text-[13px] font-mono font-semibold text-black mt-0.5">{invoice.number}</div>
                        </div>
                    </div>

                    <div className="h-px bg-[#e5e7eb]" />

                    {/* Info row */}
                    <div className="flex justify-between items-start py-6">
                        {/* Bill To */}
                        <div>
                            <div className="text-[9px] tracking-[1.5px] uppercase text-[#9ca3af] font-semibold mb-1.5">Bill To</div>
                            {client.name && <div className="text-[13px] font-bold text-black">{client.name}</div>}
                            {(project.contact_name || client.contact_name) && (
                                <div className="text-[12px] text-[#4b5563]">Attn: {project.contact_name ?? client.contact_name}</div>
                            )}
                            <div className="text-[11px] text-[#6b7280] leading-snug mt-1">
                                {[
                                    client.address_line_1,
                                    client.address_line_2,
                                    [client.city, client.state, client.postal_code].filter(Boolean).join(', '),
                                    client.country,
                                ].filter(Boolean).map((line, i) => <div key={i}>{line}</div>)}
                                {(client.phone || client.contact_email || client.email) && (
                                    <div className="mt-0.5">{[client.phone, client.contact_email ?? client.email].filter(Boolean).join(' | ')}</div>
                                )}
                            </div>
                        </div>

                        {/* Invoice details */}
                        <div className="text-right">
                            <table className="ml-auto text-[12px]">
                                <tbody>
                                    <tr><td className="text-[#6b7280] pr-4 py-0.5">Date</td><td className="font-medium text-black">{fmtDate(invoice.date)}</td></tr>
                                    {invoice.due_date && <tr><td className="text-[#6b7280] pr-4 py-0.5">Due Date</td><td className="font-medium text-black">{fmtDate(invoice.due_date)}</td></tr>}
                                    <tr><td className="text-[#6b7280] pr-4 py-0.5">Status</td><td className="font-medium text-black capitalize">{invoice.status}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Project + Payment Stage */}
                    <div className="bg-[#f8f9fb] rounded-lg px-5 py-3.5 mb-6">
                        <div className="text-[9px] tracking-[1.5px] uppercase text-[#9ca3af] font-semibold mb-1">Project</div>
                        <div className="text-[14px] font-semibold text-black">{project.name}</div>
                        {invoice.payment_stage && <div className="text-[12px] text-[#6b7280] italic mt-0.5">{invoice.payment_stage}</div>}
                    </div>

                    {/* Table */}
                    <table className="w-full mb-6">
                        <thead>
                            <tr className="border-b-2 border-[#4f6df5]">
                                <th className="text-left text-[11px] font-semibold text-[#4b5563] uppercase tracking-wide py-2.5">Description</th>
                                {hasQty && <th className="text-center text-[11px] font-semibold text-[#4b5563] uppercase tracking-wide py-2.5 w-16">Qty</th>}
                                {hasQty && <th className="text-right text-[11px] font-semibold text-[#4b5563] uppercase tracking-wide py-2.5 w-24">Rate</th>}
                                <th className="text-right text-[11px] font-semibold text-[#4b5563] uppercase tracking-wide py-2.5 w-32">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i} className="border-b border-[#f0f0f0]">
                                    <td className="py-3 text-[13px] text-black">{item.description}</td>
                                    {hasQty && <td className="py-3 text-[13px] text-center text-[#6b7280]">{item.quantity}</td>}
                                    {hasQty && <td className="py-3 text-[13px] text-right text-[#6b7280]">{fmt(item.rate)}</td>}
                                    <td className="py-3 text-[13px] text-right text-black font-medium">{fmt(item.quantity * item.rate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Total */}
                    <div className="flex justify-end mb-8">
                        <div className="w-64">
                            <div className="flex justify-between items-center py-3 border-t-2 border-[#4f6df5]">
                                <span className="text-[12px] font-semibold text-[#4b5563] uppercase tracking-wide">Total Due ({cur.code})</span>
                                <span className="text-[18px] font-extrabold text-black">{fmt(invoice.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Notes */}
                    {invoice.payment_notes && (
                        <div className="bg-[#f8f9fb] rounded-lg px-5 py-4 mb-6">
                            <div className="text-[9px] tracking-[1.5px] uppercase text-[#9ca3af] font-semibold mb-2">Payment Instructions</div>
                            <div className="text-[12px] text-[#4b5563] whitespace-pre-line leading-relaxed">{invoice.payment_notes}</div>
                        </div>
                    )}

                    {/* Note */}
                    {invoice.description && (
                        <div className="border-t border-[#e5e7eb] pt-5">
                            <div className="text-[9px] tracking-[1.5px] uppercase text-[#9ca3af] font-semibold mb-1.5">Note</div>
                            <div className="text-[12px] text-[#6b7280] leading-relaxed">{invoice.description}</div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-10 pt-4 border-t border-[#e5e7eb] text-center text-[11px] text-[#9ca3af]">
                        {company?.name} {company?.website ? `· ${company.website}` : ''}
                    </div>
                </div>
            </div>
        </>
    );
}
