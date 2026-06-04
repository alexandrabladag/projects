import { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

// Promise-based replacement for window.confirm(). Wrap the app once in
// <ConfirmProvider>, then call `const confirm = useConfirm()` and
// `await confirm({ title, message, danger })` anywhere.
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [state, setState] = useState(null);

    const confirm = useCallback((opts = {}) => new Promise((resolve) => {
        setState({
            title:        opts.title ?? 'Are you sure?',
            message:      opts.message ?? '',
            confirmLabel: opts.confirmLabel ?? (opts.danger ? 'Delete' : 'Confirm'),
            cancelLabel:  opts.cancelLabel ?? 'Cancel',
            danger:       opts.danger ?? false,
            resolve,
        });
    }), []);

    const close = (result) => {
        if (state) state.resolve(result);
        setState(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center md:p-5"
                    onClick={(e) => { if (e.target === e.currentTarget) close(false); }}
                >
                    <div className="bg-white border border-[#d1d5db] rounded-t-2xl md:rounded-2xl w-full md:max-w-[420px] p-5 md:p-6">
                        <div className="flex items-start gap-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${state.danger ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-[#4f6df5]'}`}>
                                {state.danger ? <Trash2 size={18} /> : <AlertTriangle size={18} />}
                            </div>
                            <div className="min-w-0 pt-0.5">
                                <div className="text-[16px] font-bold text-black">{state.title}</div>
                                {state.message && <div className="text-[13px] text-[#4b5563] mt-1 leading-relaxed">{state.message}</div>}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2.5 mt-5">
                            <button
                                onClick={() => close(false)}
                                className="px-4 py-2 rounded-lg text-[13px] font-medium bg-transparent text-[#374151] border border-[#d1d5db] hover:bg-gray-100 hover:text-black transition-all"
                            >
                                {state.cancelLabel}
                            </button>
                            <button
                                autoFocus
                                onClick={() => close(true)}
                                className={`px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all ${state.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#4f6df5] hover:bg-[#6380f7]'}`}
                            >
                                {state.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
    return ctx;
}
