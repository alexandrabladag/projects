import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Lock, ArrowRight } from 'lucide-react';

export default function PasswordGate({ code, title, error }) {
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(`/page/${code}`, { password }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <>
            <Head title={`${title} — Enter Password`} />

            <div className="min-h-screen bg-gradient-to-b from-[#f8f9fc] to-[#f0f2f8] flex items-center justify-center p-4">
                <div className="w-full max-w-[380px]">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                            <Lock size={24} className="text-[#4f6df5]" />
                        </div>
                        <h1 className="text-[20px] font-bold text-black">{title}</h1>
                        <p className="text-[13px] text-[#6b7280] mt-1">This page is password protected</p>
                    </div>

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
                        <label className="block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter access password"
                            autoFocus
                            className="w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[14px] text-black outline-none focus:border-[#4f6df5] transition-colors mb-3"
                        />
                        {error && <p className="text-red-500 text-[12px] mb-3">{error}</p>}
                        <button
                            type="submit"
                            disabled={submitting || !password}
                            className="w-full inline-flex items-center justify-center gap-1.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg py-2.5 text-[13px] transition-all disabled:opacity-60"
                        >
                            {submitting ? 'Checking…' : <><ArrowRight size={15} /> Access Page</>}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
