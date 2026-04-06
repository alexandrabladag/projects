import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { Badge } from '@/Layouts/AppLayout';
import { formatMoney, getCurrency } from '@/Utils/currencies';
import { FileText, Receipt, CalendarDays, Eye, Clock, ChevronDown, ChevronUp, Download, X, FolderOpen, Maximize2, Minimize2 } from 'lucide-react';

const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function Project({ project }) {
    const [tab, setTab] = useState('overview');
    const cur = getCurrency(project.currency ?? 'USD');
    const fmt = (n) => formatMoney(n, cur.code);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [fullscreen, setFullscreen] = useState(false);
    const proposals = project.proposals ?? [];
    const invoices = project.invoices ?? [];
    const meetings = project.meetings ?? [];
    const documents = project.documents ?? [];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Eye size={15} /> },
        { id: 'documents', label: `Documents (${documents.length})`, icon: <FolderOpen size={15} /> },
        { id: 'proposals', label: `Proposals (${proposals.length})`, icon: <FileText size={15} /> },
        { id: 'invoices', label: `Invoices (${invoices.length})`, icon: <Receipt size={15} /> },
        { id: 'meetings', label: `Meetings (${meetings.length})`, icon: <CalendarDays size={15} /> },
    ];

    const progressColor = project.progress >= 90 ? 'from-emerald-500 to-emerald-400'
        : project.progress >= 50 ? 'from-[#4f6df5] to-[#6380f7]' : 'from-amber-400 to-amber-300';

    return (
        <ClientLayout>
            <Head title={project.name} />

            {/* Back link */}
            <Link href={route('portal.dashboard')} className="text-[13px] text-[#6b7280] hover:text-black transition-colors mb-4 inline-block">← Back to Projects</Link>

            {/* Header */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-[22px] font-bold text-black">{project.name}</h1>
                        <div className="text-[13px] text-[#6b7280] mt-1">{project.phase} · {fmtDate(project.start_date)} – {fmtDate(project.end_date)}</div>
                    </div>
                    <Badge status={project.status} />
                </div>

                {/* Progress */}
                <div className="mb-4">
                    <div className="flex justify-between text-[12px] mb-1.5">
                        <span className="text-[#6b7280]">Overall Progress</span>
                        <span className="font-bold text-black">{project.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${progressColor} progress-fill`} style={{ width: `${project.progress}%` }} />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#f0f0f0]">
                    <div>
                        <div className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-medium">Budget</div>
                        <div className="text-[18px] font-bold text-black">{fmt(project.budget)}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-medium">Billed</div>
                        <div className="text-[18px] font-bold text-indigo-600">{fmt(project.total_billed)}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-medium">Paid</div>
                        <div className="text-[18px] font-bold text-emerald-600">{fmt(project.total_paid)}</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#e5e7eb] mb-6 flex gap-0">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-all ${
                            tab === t.id ? 'border-[#4f6df5] text-[#4f6df5]' : 'border-transparent text-[#6b7280] hover:text-black'
                        }`}
                    >
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* Overview */}
            {tab === 'overview' && (
                <div className="space-y-5">
                    {project.description && (
                        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
                            <div className="text-[14px] font-bold text-black mb-2">About This Project</div>
                            <p className="text-[13px] text-[#4b5563] leading-relaxed">{project.description}</p>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
                        <div className="text-[14px] font-bold text-black mb-3">Timeline</div>
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-[10px] uppercase tracking-wide text-[#9ca3af] mb-1">Start</div>
                                <div className="text-[13px] font-medium text-black">{fmtDate(project.start_date)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wide text-[#9ca3af] mb-1">End</div>
                                <div className="text-[13px] font-medium text-black">{fmtDate(project.end_date)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wide text-[#9ca3af] mb-1">Phase</div>
                                <div className="text-[13px] font-medium text-black">{project.phase}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wide text-[#9ca3af] mb-1">Progress</div>
                                <div className="text-[13px] font-bold text-[#4f6df5]">{project.progress}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Proposals */}
            {tab === 'proposals' && (
                <div className="space-y-3">
                    {proposals.length === 0 && <div className="text-center py-10 text-[13px] text-[#6b7280]">No proposals yet</div>}
                    {proposals.map(pr => (
                        <div key={pr.id} className="bg-white border border-[#e5e7eb] rounded-xl p-5">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-[15px] font-bold text-black">{pr.title}</div>
                                    <div className="text-[12px] text-[#6b7280]">Issued {fmtDate(pr.date)} {pr.valid_until ? `· Valid until ${fmtDate(pr.valid_until)}` : ''}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge status={pr.status} />
                                    <div className="text-[18px] font-bold text-black">{fmt(pr.amount)}</div>
                                </div>
                            </div>
                            {pr.content && (
                                <div className="mt-3 pt-3 border-t border-[#f0f0f0] text-[12px] text-[#6b7280] line-clamp-3" dangerouslySetInnerHTML={{ __html: pr.content.replace(/<[^>]*>/g, ' ').slice(0, 300) }} />
                            )}
                            {pr.summary && !pr.content && (
                                <div className="mt-3 pt-3 border-t border-[#f0f0f0] text-[12px] text-[#6b7280] line-clamp-3">{pr.summary}</div>
                            )}
                            <div className="mt-3">
                                <Link href={route('proposals.view', pr.id)} className="text-[12px] text-[#4f6df5] hover:text-[#6380f7] font-medium transition-colors">
                                    View Full Proposal →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Invoices */}
            {tab === 'invoices' && (
                <InvoiceList invoices={invoices} fmt={fmt} />
            )}

            {/* Documents */}
            {tab === 'documents' && (
                <div className="space-y-3">
                    {documents.length === 0 && <div className="text-center py-10 text-[13px] text-[#6b7280]">No documents available</div>}
                    {documents.map(doc => (
                        <div key={doc.id} className="bg-white border border-[#e5e7eb] rounded-xl p-4 flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 ${
                                { contract:'bg-red-500/10', brief:'bg-orange-500/10', report:'bg-blue-500/10', asset:'bg-purple-500/10' }[doc.type] ?? 'bg-gray-100'
                            }`}>
                                {{ contract:'📋', brief:'📝', report:'📊', asset:'🖼️' }[doc.type] ?? '📁'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-black truncate">{doc.name}</div>
                                <div className="text-[11.5px] text-[#6b7280]">
                                    {doc.uploader?.name ?? 'Team'} · {fmtDate(doc.created_at)} {doc.file_size ? `· ${doc.file_size}` : ''}
                                </div>
                            </div>
                            <Badge status={doc.type} label={doc.type} />
                            {doc.file_path && (
                                <button onClick={() => setPreviewDoc(doc)} className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7280] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100">
                                    <Eye size={13} /> View
                                </button>
                            )}
                            {doc.file_path && (
                                <a href={`/documents/${doc.id}/download`} className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7280] hover:text-black transition-colors px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100">
                                    <Download size={13} /> Download
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Document Preview Modal */}
            {previewDoc && (() => {
                const ext = (previewDoc.file_path ?? '').split('.').pop().toLowerCase();
                const imgExts = ['jpg','jpeg','png','gif','webp','svg'];
                const previewUrl = `/documents/${previewDoc.id}/preview`;
                const canPreview = previewDoc.file_path && ([...imgExts, 'pdf'].includes(ext));
                const isImg = imgExts.includes(ext);

                if (fullscreen && canPreview) {
                    return (
                        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-black/90">
                                <div className="text-white text-[13px] font-medium truncate mr-4">{previewDoc.name}</div>
                                <div className="flex items-center gap-2">
                                    <a href={`/documents/${previewDoc.id}/download`} className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"><Download size={13} /> Download</a>
                                    <button onClick={() => setFullscreen(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Exit fullscreen"><Minimize2 size={16} /></button>
                                    <button onClick={() => { setPreviewDoc(null); setFullscreen(false); }} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center overflow-auto">
                                {isImg ? <img src={previewUrl} alt={previewDoc.name} className="max-w-full max-h-full object-contain" /> : <iframe src={previewUrl} className="w-full h-full" title={previewDoc.name} />}
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
                        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
                                <div>
                                    <div className="text-[15px] font-bold text-black">{previewDoc.name}</div>
                                    <div className="text-[12px] text-[#6b7280]">{previewDoc.type} {previewDoc.file_size ? `· ${previewDoc.file_size}` : ''}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {canPreview && <button onClick={() => setFullscreen(true)} className="p-1.5 rounded-lg text-[#6b7280] hover:text-black hover:bg-gray-100" title="Fullscreen"><Maximize2 size={16} /></button>}
                                    <a href={`/documents/${previewDoc.id}/download`} className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7280] hover:text-black px-3 py-1.5 rounded-lg border border-[#d1d5db] hover:bg-gray-100">
                                        <Download size={13} /> Download
                                    </a>
                                    <button onClick={() => setPreviewDoc(null)} className="p-1.5 rounded-lg text-[#6b7280] hover:text-black hover:bg-gray-100"><X size={16} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-6">
                                {canPreview ? (
                                    isImg ? <img src={previewUrl} alt={previewDoc.name} className="max-w-full mx-auto rounded-lg" /> : <iframe src={previewUrl} className="w-full rounded-lg" style={{ height: '70vh' }} title={previewDoc.name} />
                                ) : (
                                    <div className="text-center py-16 text-[#6b7280]">
                                        <div className="text-3xl mb-3">📄</div>
                                        <div className="text-[14px] font-medium text-black mb-1">Preview not available</div>
                                        <div className="text-[13px]">This file type cannot be previewed. Download it to view.</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Meetings */}
            {tab === 'meetings' && (
                <div className="space-y-3">
                    {meetings.length === 0 && <div className="text-center py-10 text-[13px] text-[#6b7280]">No meetings scheduled</div>}
                    {meetings.map(m => (
                        <div key={m.id} className="bg-white border border-[#e5e7eb] rounded-xl p-5 flex gap-4">
                            <div className="w-12 h-12 bg-[#4f6df5]/10 border border-[#4f6df5]/20 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                                <div className="text-[16px] font-bold text-[#4f6df5] leading-none">{new Date(m.date).getDate()}</div>
                                <div className="text-[9px] text-[#4f6df5] tracking-wide uppercase">{new Date(m.date).toLocaleString('en-US', { month: 'short' })}</div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[14px] font-semibold text-black">{m.title}</span>
                                    <Badge status={m.status} />
                                </div>
                                <div className="text-[12px] text-[#6b7280]">{m.time} · {m.duration} · {m.location}</div>
                                {m.notes && <div className="text-[12px] text-[#6b7280] mt-2 bg-[#fafbfc] rounded-lg p-3 border-l-2 border-[#e5e7eb]">{m.notes}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ClientLayout>
    );
}

function InvoiceList({ invoices, fmt }) {
    const [expanded, setExpanded] = useState(null);
    const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    const statusColors = { draft: 'border-l-gray-300', sent: 'border-l-indigo-400', paid: 'border-l-emerald-400', overdue: 'border-l-red-400' };

    return (
        <div className="space-y-3">
            {invoices.length === 0 && <div className="text-center py-10 text-[13px] text-[#6b7280]">No invoices yet</div>}
            {invoices.map(inv => (
                <div key={inv.id} className={`bg-white border border-[#e5e7eb] ${statusColors[inv.status] ?? ''} border-l-[3px] rounded-xl overflow-hidden`}>
                    <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#fafbfc] transition-colors" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-0.5">
                                <span className="text-[13px] font-mono font-bold text-black">{inv.number}</span>
                                <Badge status={inv.status} />
                            </div>
                            <div className="text-[12px] text-[#6b7280]">{inv.description || fmtDate(inv.date)}</div>
                        </div>
                        <div className="text-right mr-2">
                            <div className="text-[17px] font-bold text-black">{fmt(inv.total)}</div>
                            <div className="text-[11px] text-[#9ca3af]">{inv.status === 'paid' ? 'Paid' : inv.due_date ? `Due ${fmtDate(inv.due_date)}` : ''}</div>
                        </div>
                        <Link href={route('invoices.view', inv.id)} onClick={e => e.stopPropagation()} className="text-[#4f6df5] hover:text-[#6380f7] transition-colors">
                            <Eye size={16} />
                        </Link>
                        <span className="text-[#9ca3af]">{expanded === inv.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                    </div>
                    {expanded === inv.id && (
                        <div className="px-5 py-4 bg-[#fafbfc] border-t border-[#f0f0f0]">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#e5e7eb]">
                                        <th className="text-left text-[10px] tracking-wide uppercase text-[#9ca3af] font-medium pb-2">Description</th>
                                        <th className="text-center text-[10px] tracking-wide uppercase text-[#9ca3af] font-medium pb-2 w-16">Qty</th>
                                        <th className="text-right text-[10px] tracking-wide uppercase text-[#9ca3af] font-medium pb-2 w-24">Rate</th>
                                        <th className="text-right text-[10px] tracking-wide uppercase text-[#9ca3af] font-medium pb-2 w-24">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(inv.items ?? []).map((item, i) => (
                                        <tr key={i} className="border-b border-[#f0f0f0] last:border-b-0">
                                            <td className="py-2.5 text-[13px] text-black">{item.description}</td>
                                            <td className="py-2.5 text-[13px] text-center text-[#6b7280]">{item.quantity}</td>
                                            <td className="py-2.5 text-[13px] text-right text-[#6b7280]">{fmt(item.rate)}</td>
                                            <td className="py-2.5 text-[13px] text-right font-medium text-black">{fmt(item.quantity * item.rate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
