import { useRef } from 'react';
import { Head } from '@inertiajs/react';
import { formatMoney, getCurrency } from '@/Utils/currencies';
import { Download, ArrowLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export default function View({ invoice, company, contactEmail }) {
    const pageRef = useRef();
    const project = invoice.project ?? {};
    const client = project.client_record ?? {};
    const cur = getCurrency(invoice.currency ?? project.currency ?? 'USD');
    const fmt = (n) => formatMoney(n, cur.code);
    const items = invoice.items ?? [];

    const noteLines = (invoice.notes ?? '').split('\n').map(s => s.trim()).filter(Boolean);
    const hasBank = invoice.bank_name || invoice.bank_account_name || invoice.bank_account_number;
    const hasPaymentSection = invoice.payment_notes || hasBank || invoice.cheque_payable_to;

    const downloadPdf = () => {
        html2pdf().set({
            margin: 0,
            filename: `${invoice.number}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        }).from(pageRef.current).save();
    };

    const companyAddress = [
        company?.address_line_1,
        [company?.city, company?.state, company?.postal_code].filter(Boolean).join(', '),
        company?.country,
    ].filter(Boolean);

    const clientAddress = [
        client.address_line_1,
        client.address_line_2,
        [client.city, client.state, client.postal_code].filter(Boolean).join(', '),
        client.country,
    ].filter(Boolean);

    return (
        <>
            <Head title={`Invoice ${invoice.number}`} />

            <style>{`
                @media print {
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .invoice-page { box-shadow: none !important; margin: 0 !important; }
                }
                @page { size: A4; margin: 0; }
            `}</style>

            {/* Toolbar */}
            <div className="no-print bg-white border-b border-[#e5e7eb] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-[13px] text-[#4b5563] hover:text-black transition-colors">
                    <ArrowLeft size={15} /> Back to Project
                </button>
                <button onClick={downloadPdf} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all">
                    <Download size={15} /> Download PDF
                </button>
            </div>

            <div className="min-h-screen bg-[#f3f4f6] flex justify-center py-10 px-4">
                <div ref={pageRef} className="invoice-page bg-white rounded-xl shadow-sm flex flex-col" style={{ width: '210mm', minHeight: '297mm', padding: '16mm' }}>

                    {/* Header — logo + INVOICE */}
                    <div className="flex justify-between items-start">
                        <div>
                            {company?.logo_path && (
                                <img src={`/storage/${company.logo_path}`} alt="Logo" className="h-12 mb-4" />
                            )}
                        </div>
                        <div className="text-[22px] font-bold text-[#6b7280] tracking-[2px]">INVOICE</div>
                    </div>

                    {/* Company identity */}
                    <div className="mt-2">
                        <div className="text-[13px] font-bold text-[#374151]">{company?.name ?? 'Your Company'}</div>
                        {company?.tax_id && <div className="text-[11px] text-[#6b7280] mt-0.5">{company.tax_id}</div>}
                        <div className="text-[11px] text-[#6b7280] leading-relaxed mt-1.5">
                            {companyAddress.map((line, i) => <div key={i}>{line}</div>)}
                        </div>
                        {(contactEmail || company?.phone) && (
                            <div className="text-[11px] text-[#6b7280] mt-0.5">
                                {[contactEmail ?? company?.email, company?.phone].filter(Boolean).join(' · ')}
                            </div>
                        )}
                    </div>

                    {/* Bill To + Invoice details */}
                    <div className="flex justify-between items-start gap-8 mt-8">
                        <div className="max-w-[60%]">
                            <div className="flex gap-3">
                                <div className="text-[12px] text-[#6b7280] pt-0.5 whitespace-nowrap">Bill To</div>
                                <div>
                                    {client.name && <div className="text-[12.5px] font-bold text-black leading-snug">{client.name}</div>}
                                    {(project.contact_name || client.contact_name) && (
                                        <div className="text-[12.5px] font-bold text-black leading-snug">{project.contact_name ?? client.contact_name}</div>
                                    )}
                                    <div className="text-[11px] text-[#4b5563] leading-relaxed mt-0.5">
                                        {clientAddress.map((line, i) => <div key={i}>{line}</div>)}
                                        {client.phone && <div>{client.phone}</div>}
                                        {(client.contact_email || client.email) && <div>{client.contact_email ?? client.email}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <table className="text-[11.5px]">
                            <tbody>
                                <tr>
                                    <td className="text-[#6b7280] pr-6 py-0.5 align-top font-medium">Invoice #</td>
                                    <td className="font-bold text-black py-0.5">{invoice.number}</td>
                                </tr>
                                <tr>
                                    <td className="text-[#6b7280] pr-6 py-0.5 align-top">Date Issued</td>
                                    <td className="text-[#374151] py-0.5">{fmtDate(invoice.date)}</td>
                                </tr>
                                {invoice.due_date && (
                                    <tr>
                                        <td className="text-[#6b7280] pr-6 py-0.5 align-top">Due Date</td>
                                        <td className="text-[#374151] py-0.5">{fmtDate(invoice.due_date)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="h-px bg-[#e5e7eb] my-7" />

                    {/* Project */}
                    <div>
                        <div className="text-[10px] tracking-[1.5px] uppercase text-black font-bold mb-1.5">Project</div>
                        <div className="text-[13px] text-[#374151]">{project.name}</div>
                        {invoice.payment_stage && (
                            <div className="text-[12px] text-[#4b5563] italic mt-1">Payment Stage: {invoice.payment_stage}</div>
                        )}
                    </div>

                    {/* Invoice Breakdown */}
                    <div className="mt-7">
                        <div className="text-[10px] tracking-[1.5px] uppercase text-black font-bold mb-2.5">Invoice Breakdown</div>
                        <table className="w-full border border-[#e5e7eb] border-collapse">
                            <thead>
                                <tr className="bg-[#f3f4f6]">
                                    <th className="text-left text-[11.5px] font-bold text-[#374151] px-4 py-2.5 border border-[#e5e7eb]">Description</th>
                                    <th className="text-right text-[11.5px] font-bold text-[#374151] px-4 py-2.5 border border-[#e5e7eb] w-44">Amount ({cur.code})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="text-[12px] text-[#374151] px-4 py-2.5 border border-[#e5e7eb]">{item.description}</td>
                                        <td className="text-[12px] text-[#374151] text-right px-4 py-2.5 border border-[#e5e7eb]">{fmt(item.quantity * item.rate)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-[#f3f4f6]">
                                    <td className="text-[12px] font-bold text-black px-4 py-2.5 border border-[#e5e7eb]">Total Amount Due</td>
                                    <td className="text-[12.5px] font-bold text-black text-right px-4 py-2.5 border border-[#e5e7eb]">{fmt(invoice.total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Instructions */}
                    {hasPaymentSection && (
                        <div className="mt-7">
                            <div className="text-[10px] tracking-[1.5px] uppercase text-black font-bold mb-2.5">Payment Instructions</div>
                            {invoice.payment_notes && (
                                <div className="text-[12px] text-[#374151] mb-3">{invoice.payment_notes}</div>
                            )}
                            {hasBank && (
                                <table className="w-full border border-[#e5e7eb] border-collapse mb-3">
                                    <tbody>
                                        <tr className="bg-[#f3f4f6]">
                                            <td className="text-[11.5px] font-bold text-[#374151] px-4 py-2 border border-[#e5e7eb] w-52">For Bank Deposits</td>
                                            <td className="border border-[#e5e7eb]" />
                                        </tr>
                                        {invoice.bank_name && <tr><td className="text-[12px] text-[#4b5563] px-4 py-2 border border-[#e5e7eb]">Bank</td><td className="text-[12px] text-[#374151] px-4 py-2 border border-[#e5e7eb]">{invoice.bank_name}</td></tr>}
                                        {invoice.bank_account_name && <tr><td className="text-[12px] text-[#4b5563] px-4 py-2 border border-[#e5e7eb]">Account Name</td><td className="text-[12px] text-[#374151] px-4 py-2 border border-[#e5e7eb]">{invoice.bank_account_name}</td></tr>}
                                        {invoice.bank_account_number && <tr><td className="text-[12px] text-[#4b5563] px-4 py-2 border border-[#e5e7eb]">Account Number</td><td className="text-[12px] text-[#374151] px-4 py-2 border border-[#e5e7eb]">{invoice.bank_account_number}</td></tr>}
                                    </tbody>
                                </table>
                            )}
                            {invoice.cheque_payable_to && (
                                <table className="w-full border border-[#e5e7eb] border-collapse">
                                    <tbody>
                                        <tr className="bg-[#f3f4f6]">
                                            <td className="text-[11.5px] font-bold text-[#374151] px-4 py-2 border border-[#e5e7eb] w-52">For Cheque Payments</td>
                                            <td className="border border-[#e5e7eb]" />
                                        </tr>
                                        <tr><td className="text-[12px] text-[#4b5563] px-4 py-2 border border-[#e5e7eb]">Payable to</td><td className="text-[12px] text-[#374151] px-4 py-2 border border-[#e5e7eb]">{invoice.cheque_payable_to}</td></tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    {noteLines.length > 0 && (
                        <div className="mt-7">
                            <div className="text-[10px] tracking-[1.5px] uppercase text-black font-bold mb-2.5">Notes</div>
                            <ol className="list-decimal pl-5 space-y-1.5">
                                {noteLines.map((line, i) => (
                                    <li key={i} className="text-[11.5px] text-[#374151] leading-relaxed pl-1">{line}</li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-10 text-right text-[11px] text-[#6b7280]">
                        {company?.website}
                    </div>
                </div>
            </div>
        </>
    );
}
