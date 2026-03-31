import { useRef } from 'react';
import { Head } from '@inertiajs/react';
import { formatMoney, getCurrency } from '@/Utils/currencies';
import { Download, ArrowLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

function Section({ number, title, children }) {
    return (
        <div className="mb-10">
            <h2 className="text-[22px] font-bold text-[#2d5f8a] mb-4 border-b-2 border-[#2d5f8a] pb-2">
                {number}. {title}
            </h2>
            <div className="text-[13.5px] text-[#333] leading-relaxed">{children}</div>
        </div>
    );
}

export default function View({ proposal, company }) {
    const pagesRef = useRef();
    const project = proposal.project ?? {};
    const client = project.client_record ?? {};
    const cur = getCurrency(proposal.currency ?? project.currency ?? 'USD');
    const fmt = (n) => formatMoney(n, cur.code);
    const sections = proposal.sections ?? [];
    const deliverables = proposal.deliverables ?? [];
    const timeline = proposal.timeline ?? [];

    const downloadPdf = () => {
        html2pdf().set({
            margin: 0,
            filename: `${proposal.title || 'Proposal'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        }).from(pagesRef.current).save();
    };
    const paymentSchedule = proposal.payment_schedule ?? [];

    return (
        <>
            <Head title={proposal.title} />

            <style>{`
                @media print {
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .proposal-page { box-shadow: none !important; margin: 0 !important; }
                    .page-break { page-break-before: always; }
                }
                .proposal-content { font-size: 13.5px; line-height: 1.7; color: #333; }
                .proposal-content h1 { font-size: 1.5em; font-weight: 700; margin: 1.2em 0 0.5em; color: #2d5f8a; border-bottom: 2px solid #2d5f8a; padding-bottom: 0.3em; }
                .proposal-content h2 { font-size: 1.25em; font-weight: 700; margin: 1em 0 0.4em; color: #2d5f8a; }
                .proposal-content h3 { font-size: 1.1em; font-weight: 600; margin: 0.8em 0 0.3em; color: #374151; }
                .proposal-content p { margin: 0.5em 0; }
                .proposal-content ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
                .proposal-content ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
                .proposal-content li { margin: 0.25em 0; }
                .proposal-content blockquote { border-left: 3px solid #4f6df5; padding-left: 1em; margin: 1em 0; color: #6b7280; font-style: italic; }
                .proposal-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 2em 0; }
                .proposal-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                .proposal-content th { background: #f3f4f6; font-weight: 600; text-align: left; }
                .proposal-content th, .proposal-content td { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px; }
                .proposal-content strong { font-weight: 600; }
                .proposal-content em { font-style: italic; }
                .proposal-content u { text-decoration: underline; }
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
                <div ref={pagesRef} className="w-full max-w-[800px] space-y-8">

                    {/* Cover Page */}
                    <div className="proposal-page bg-white rounded-lg shadow-lg p-12 min-h-[900px] flex flex-col justify-between">
                        <div>
                            {/* Logo */}
                            <div className="flex justify-center mb-16">
                                {company?.logo_path ? (
                                    <img src={`/storage/${company.logo_path}`} alt="Logo" className="h-16" />
                                ) : (
                                    <div className="text-[24px] font-bold text-[#2d5f8a]">{company?.name ?? 'Your Company'}</div>
                                )}
                            </div>

                            {/* Title */}
                            <div className="text-center mb-20">
                                <h1 className="text-[32px] font-bold text-[#2d3748] leading-tight mb-3">{proposal.title}</h1>
                                <div className="text-[16px] text-[#2d5f8a]">{project.name}</div>
                                <div className="w-16 h-0.5 bg-[#2d5f8a] mx-auto mt-4" />
                            </div>
                        </div>

                        <div className="space-y-16">
                            {/* Prepared For */}
                            <div className="text-center">
                                <div className="text-[12px] text-[#9ca3af] mb-2">Prepared for</div>
                                <div className="text-[18px] font-bold text-black">{client.name ?? project.client}</div>
                                {(project.contact_name || client.contact_name) && (
                                    <div className="text-[14px] text-[#6b7280]">Attn: {project.contact_name ?? client.contact_name}</div>
                                )}
                            </div>

                            {/* Prepared By */}
                            <div className="text-center">
                                <div className="text-[12px] text-[#9ca3af] mb-2">Prepared by</div>
                                <div className="text-[18px] font-bold text-black">{company?.name ?? 'Your Company'}</div>
                                {proposal.prepared_by && (
                                    <div className="text-[14px] text-[#6b7280]">{proposal.prepared_by}</div>
                                )}
                            </div>

                            {/* Date */}
                            <div className="text-center">
                                <div className="text-[12px] text-[#9ca3af] mb-2">Date</div>
                                <div className="text-[16px] font-bold text-black">{fmtDate(proposal.date)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Content Pages */}
                    <div className="proposal-page bg-white rounded-lg shadow-lg p-12">
                        {/* Header line */}
                        <div className="text-[11px] text-[#9ca3af] italic mb-8 border-b border-[#e5e7eb] pb-2">
                            {proposal.title} - Proposal
                        </div>

                        {/* Rich content (new editor) */}
                        {proposal.content && (
                            <div className="proposal-content" dangerouslySetInnerHTML={{ __html: proposal.content }} />
                        )}

                        {/* Legacy fields (backward compat — only if no rich content) */}
                        {!proposal.content && proposal.summary && (
                            <Section number={1} title="Executive Summary">
                                <div className="whitespace-pre-line">{proposal.summary}</div>
                            </Section>
                        )}

                        {/* Dynamic Sections (legacy — only if no rich content) */}
                        {!proposal.content && sections.map((sec, i) => {
                            const num = (proposal.summary && !sections.some(s => s.type === 'text' && s.title === 'Executive Summary')) ? i + 2 : i + 1;

                            if (sec.type === 'text' || sec.type === 'terms') {
                                return (
                                    <Section key={i} number={num} title={sec.title}>
                                        <div className="whitespace-pre-line">{sec.content}</div>
                                    </Section>
                                );
                            }

                            if (sec.type === 'list') {
                                return (
                                    <Section key={i} number={num} title={sec.title}>
                                        {(sec.items ?? []).filter(Boolean).map((item, j) => (
                                            <div key={j} className="flex items-start gap-2 py-1.5">
                                                <span className="text-[#2d5f8a] mt-0.5">•</span>
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </Section>
                                );
                            }

                            if (sec.type === 'deliverables') {
                                return (
                                    <Section key={i} number={num} title={sec.title}>
                                        {(sec.items ?? []).filter(Boolean).map((item, j) => (
                                            <div key={j} className="flex items-start gap-2 py-1.5">
                                                <span className="text-green-600 mt-0.5">✓</span>
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </Section>
                                );
                            }

                            if (sec.type === 'timeline') {
                                return (
                                    <Section key={i} number={num} title={sec.title}>
                                        <table className="w-full mt-2">
                                            <thead>
                                                <tr className="border-b-2 border-[#2d5f8a]">
                                                    <th className="text-left py-2 text-[12px] font-bold text-black">Phase</th>
                                                    <th className="text-left py-2 text-[12px] font-bold text-black">Description</th>
                                                    <th className="text-left py-2 text-[12px] font-bold text-black w-28">Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(sec.rows ?? []).map((row, j) => (
                                                    <tr key={j} className="border-b border-[#e5e7eb]">
                                                        <td className="py-2.5 text-[13px] font-bold text-black">{row.phase}</td>
                                                        <td className="py-2.5 text-[13px] text-[#4b5563]">{row.description}</td>
                                                        <td className="py-2.5 text-[13px] text-[#4b5563]">{row.duration}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Section>
                                );
                            }

                            if (sec.type === 'payment') {
                                return (
                                    <Section key={i} number={num} title={sec.title}>
                                        <div className="mb-4">
                                            <div className="text-[13px] font-bold text-black mb-1">Total Project Investment</div>
                                            <div className="text-[22px] font-bold text-black">{cur.code} {fmt(proposal.amount)}</div>
                                        </div>
                                        <table className="w-full mt-4">
                                            <thead>
                                                <tr className="border-b-2 border-[#2d5f8a]">
                                                    <th className="text-left py-2 text-[12px] font-bold text-black">Phase</th>
                                                    <th className="text-left py-2 text-[12px] font-bold text-black">Milestone</th>
                                                    <th className="text-right py-2 text-[12px] font-bold text-black w-28">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(sec.rows ?? []).map((row, j) => (
                                                    <tr key={j} className="border-b border-[#e5e7eb]">
                                                        <td className="py-2.5 text-[13px] font-bold text-black">{row.phase}</td>
                                                        <td className="py-2.5 text-[13px] text-[#4b5563]">{row.milestone}</td>
                                                        <td className="py-2.5 text-[13px] text-right text-black font-medium">{row.amount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Section>
                                );
                            }

                            if (sec.type === 'signature') {
                                return (
                                    <div key={i} className="mt-16 pt-8 border-t-2 border-[#2d5f8a]">
                                        <h2 className="text-[22px] font-bold text-[#2d5f8a] mb-8">Approval & Agreement</h2>
                                        <p className="text-[13px] text-[#6b7280] mb-10">This proposal constitutes a formal service agreement upon signature.</p>
                                        <div className="grid grid-cols-2 gap-12">
                                            <div>
                                                <div className="text-[12px] font-bold text-black mb-12">Prepared By:</div>
                                                <div className="border-b border-black mb-2 pb-1" />
                                                <div className="text-[13px] font-bold text-black uppercase">{sec.prepared_by}</div>
                                                {sec.prepared_by_title && <div className="text-[12px] text-[#6b7280]">{sec.prepared_by_title}</div>}
                                                {company?.name && <div className="text-[12px] text-[#6b7280]">{company.name}</div>}
                                                <div className="text-[12px] text-[#6b7280] mt-2">Date Signed: {fmtDate(proposal.date)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[12px] font-bold text-black mb-12">Approved by:</div>
                                                <div className="border-b border-black mb-2 pb-1" />
                                                <div className="text-[13px] font-bold text-black uppercase">{sec.approved_by ?? '________________________'}</div>
                                                {sec.approved_by_title && <div className="text-[12px] text-[#6b7280]">{sec.approved_by_title}</div>}
                                                {client.name && <div className="text-[12px] text-[#6b7280]">{client.name}</div>}
                                                <div className="text-[12px] text-[#6b7280] mt-2">Date Signed: _________________________</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
