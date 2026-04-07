import { useRef } from 'react';
import { Head } from '@inertiajs/react';
import { formatMoney, getCurrency } from '@/Utils/currencies';
import { Download, ArrowLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function Remittance({ bill, company }) {
    const pageRef = useRef();
    const project = bill.project ?? {};
    const vendor = bill.vendor ?? {};
    const cur = getCurrency(bill.currency ?? project.currency ?? 'USD');
    const fmt = (n) => formatMoney(n, cur.code);

    const refNumber = `RA-${(bill.number ?? bill.id).toString().replace(/^#/, '')}`;

    const downloadPdf = () => {
        html2pdf().set({
            margin: 0,
            filename: `${refNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        }).from(pageRef.current).save();
    };

    return (
        <>
            <Head title={`Remittance Advice ${refNumber}`} />

            <style>{`
                @media print {
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .ra-page { box-shadow: none !important; margin: 0 !important; padding: 48px !important; }
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
                <div ref={pageRef} className="ra-page bg-white rounded-xl shadow-sm w-full max-w-[800px] p-12">

                    {/* Header */}
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
                            <div className="text-[22px] font-extrabold text-[#4f6df5] tracking-tight leading-tight">REMITTANCE<br/>ADVICE</div>
                            <div className="text-[13px] font-mono font-semibold text-black mt-1">{refNumber}</div>
                        </div>
                    </div>

                    <div className="h-px bg-[#e5e7eb]" />

                    {/* Payee & Payment Info */}
                    <div className="flex justify-between items-start py-6">
                        <div>
                            <div className="text-[9px] tracking-[1.5px] uppercase text-[#9ca3af] font-semibold mb-1.5">Paid To</div>
                            {vendor.name && <div className="text-[14px] font-bold text-black">{vendor.name}</div>}
                            {vendor.contact_name && <div className="text-[12px] text-[#4b5563]">Attn: {vendor.contact_name}</div>}
                            <div className="text-[11px] text-[#6b7280] leading-snug mt-1">
                                {[
                                    vendor.address_line_1,
                                    vendor.address_line_2,
                                    [vendor.city, vendor.state, vendor.postal_code].filter(Boolean).join(', '),
                                    vendor.country,
                                ].filter(Boolean).map((line, i) => <div key={i}>{line}</div>)}
                                {(vendor.phone || vendor.email || vendor.contact_email) && (
                                    <div className="mt-0.5">{[vendor.phone, vendor.contact_email ?? vendor.email].filter(Boolean).join(' | ')}</div>
                                )}
                            </div>
                        </div>

                        <div className="text-right">
                            <table className="ml-auto text-[12px]">
                                <tbody>
                                    <tr><td className="text-[#6b7280] pr-4 py-0.5">Payment Date</td><td className="font-medium text-black">{fmtDate(bill.paid_date ?? bill.date)}</td></tr>
                                    <tr><td className="text-[#6b7280] pr-4 py-0.5">Invoice Ref</td><td className="font-medium text-black">{bill.number ? `#${bill.number}` : '—'}</td></tr>
                                    <tr><td className="text-[#6b7280] pr-4 py-0.5">Invoice Date</td><td className="font-medium text-black">{fmtDate(bill.date)}</td></tr>
                                    <tr><td className="text-[#6b7280] pr-4 py-0.5">Status</td><td className="font-medium text-black capitalize">{bill.status}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Project Reference */}
                    <div className="bg-[#f8f9fb] rounded-lg px-5 py-3.5 mb-6">
                        <div className="text-[9px] tracking-[1.5px] uppercase text-[#9ca3af] font-semibold mb-1">Project</div>
                        <div className="text-[14px] font-semibold text-black">{project.name}</div>
                        {bill.category && <div className="text-[12px] text-[#6b7280] mt-0.5">Category: {bill.category}</div>}
                    </div>

                    {/* Payment Details Table */}
                    <table className="w-full mb-6">
                        <thead>
                            <tr className="border-b-2 border-[#4f6df5]">
                                <th className="text-left text-[11px] font-semibold text-[#4b5563] uppercase tracking-wide py-2.5">Description</th>
                                <th className="text-right text-[11px] font-semibold text-[#4b5563] uppercase tracking-wide py-2.5 w-40">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-[#f0f0f0]">
                                <td className="py-3 text-[13px] text-black">
                                    <div>{bill.description || `Payment for Invoice ${bill.number ? '#' + bill.number : ''}`}</div>
                                    {bill.number && <div className="text-[11px] text-[#6b7280] mt-0.5">Ref: Invoice #{bill.number}</div>}
                                </td>
                                <td className="py-3 text-[13px] text-right text-black font-medium">{fmt(bill.amount)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Total */}
                    <div className="flex justify-end mb-8">
                        <div className="w-72">
                            <div className="flex justify-between items-center py-2 text-[12px] text-[#6b7280]">
                                <span>Subtotal</span>
                                <span className="text-black">{fmt(bill.amount)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-t-2 border-[#4f6df5]">
                                <span className="text-[12px] font-semibold text-[#4b5563] uppercase tracking-wide">Total Paid ({cur.code})</span>
                                <span className="text-[20px] font-extrabold text-[#4f6df5]">{fmt(bill.paid_amount ?? bill.amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Confirmation */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-5 py-4 mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="text-[13px] font-semibold text-emerald-800">Payment Confirmation</span>
                        </div>
                        <div className="text-[12px] text-emerald-700 ml-7">
                            This confirms that payment of <strong>{fmt(bill.paid_amount ?? bill.amount)}</strong> has been
                            {bill.paid_date ? ` processed on ${fmtDate(bill.paid_date)}` : ' processed'} for
                            the services rendered under {project.name}.
                        </div>
                    </div>

                    {/* Notes */}
                    {bill.notes && (
                        <div className="border-t border-[#e5e7eb] pt-5 mb-6">
                            <div className="text-[9px] tracking-[1.5px] uppercase text-[#9ca3af] font-semibold mb-1.5">Notes</div>
                            <div className="text-[12px] text-[#6b7280] leading-relaxed whitespace-pre-line">{bill.notes}</div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-10 pt-4 border-t border-[#e5e7eb] text-center text-[11px] text-[#9ca3af]">
                        {company?.name} {company?.website ? `· ${company.website}` : ''}
                        <div className="mt-1">This remittance advice is for informational purposes and confirms payment as described above.</div>
                    </div>
                </div>
            </div>
        </>
    );
}
