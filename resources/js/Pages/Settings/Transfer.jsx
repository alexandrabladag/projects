import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Download, Upload, FileJson, AlertTriangle, Check } from 'lucide-react';

export default function Transfer() {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [confirm, setConfirm] = useState(false);

    const handleExport = () => {
        window.location.href = route('workspace.export');
    };

    const handleImport = () => {
        if (!file) return;
        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        router.post(route('workspace.import'), formData, {
            forceFormData: true,
            onFinish: () => { setImporting(false); setFile(null); setConfirm(false); },
        });
    };

    return (
        <AppLayout
            title="Export & Import"
            breadcrumbs={[{ label: 'Settings' }, { label: 'Export & Import' }]}
        >
            <Head title="Export & Import" />

            <div className="max-w-2xl space-y-6">
                {/* Export */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-7">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <Download size={20} className="text-indigo-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[16px] font-bold text-black">Export Workspace Data</h3>
                            <p className="text-[13px] text-[#6b7280] mt-1 mb-4">
                                Download all your workspace data as a JSON file. Includes company settings, clients, contacts, projects, proposals, invoices, meetings, tasks, and team members.
                            </p>
                            <div className="bg-[#f8f9fb] border border-[#e5e7eb] rounded-lg px-4 py-3 text-[12px] text-[#6b7280] mb-4">
                                <strong className="text-black">What's included:</strong> Company info, clients & contacts, all projects with proposals, invoices, meetings, tasks, and team members. Document files are not included (metadata only).
                            </div>
                            <button
                                onClick={handleExport}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all"
                            >
                                <Download size={15} /> Export as JSON
                            </button>
                        </div>
                    </div>
                </div>

                {/* Import */}
                <div className="bg-white border border-[#e5e7eb] rounded-xl p-7">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <Upload size={20} className="text-emerald-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[16px] font-bold text-black">Import Workspace Data</h3>
                            <p className="text-[13px] text-[#6b7280] mt-1 mb-4">
                                Import data from a previously exported JSON file. This will create new records in your workspace — existing data won't be overwritten.
                            </p>

                            {/* File picker */}
                            <div className="mb-4">
                                <label className="flex items-center gap-3 p-4 border-2 border-dashed border-[#d1d5db] rounded-xl cursor-pointer hover:border-[#4f6df5] transition-colors bg-[#fafbfc]">
                                    <FileJson size={24} className="text-[#9ca3af]" />
                                    <div className="flex-1">
                                        {file ? (
                                            <div>
                                                <div className="text-[13px] font-medium text-black">{file.name}</div>
                                                <div className="text-[11px] text-[#9ca3af]">{(file.size / 1024).toFixed(1)} KB</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-[13px] text-[#6b7280]">Choose a .json export file</div>
                                                <div className="text-[11px] text-[#9ca3af]">Max 10MB</div>
                                            </div>
                                        )}
                                    </div>
                                    {file && <Check size={16} className="text-emerald-500" />}
                                    <input
                                        type="file"
                                        accept=".json,application/json"
                                        onChange={e => { setFile(e.target.files[0]); setConfirm(false); }}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Confirm */}
                            {file && !confirm && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                                    <div className="flex items-start gap-2 text-[13px] text-amber-700">
                                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                        <div>
                                            <strong>This will add new records</strong> to your workspace. Existing data will not be deleted or modified. Are you sure?
                                            <div className="mt-2">
                                                <button
                                                    onClick={() => setConfirm(true)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[12px] font-medium hover:bg-amber-700 transition-colors"
                                                >
                                                    Yes, proceed with import
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {file && confirm && (
                                <button
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60"
                                >
                                    <Upload size={15} /> {importing ? 'Importing…' : 'Import Data'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
