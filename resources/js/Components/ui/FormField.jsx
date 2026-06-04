// Shared form input styling + labelled field wrapper.
// Inputs turn red when an error is present, so validation feedback is consistent app-wide.
import { AlertCircle } from 'lucide-react';

export const inputCls = 'w-full bg-white border border-[#e5e7eb] rounded-lg px-3.5 py-2.5 text-[13px] text-black placeholder:text-[#9ca3af] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-150 hover:border-[#d1d5db] focus:border-[#4f6df5] focus:ring-[3px] focus:ring-[#4f6df5]/12';
export const inputErrorCls = 'border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-red-400/12';

// Compose input classes with an optional error state.
export const fieldCls = (error) => `${inputCls} ${error ? inputErrorCls : ''}`;

export default function FormField({ label, error, hint, children, className = '' }) {
    return (
        <div className={className}>
            {label && <label className="block text-[10px] tracking-[1.2px] uppercase text-[#374151] font-semibold mb-1.5">{label}</label>}
            {children}
            {hint && !error && <p className="text-[#4b5563] text-[11px] mt-1.5">{hint}</p>}
            {error && <p className="text-red-500 text-[11px] font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} className="flex-shrink-0" /> {error}</p>}
        </div>
    );
}
