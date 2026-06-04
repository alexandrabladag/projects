// Shared button — the app's single source of truth for button styling.
// Variants: primary (default indigo), ghost (outlined), danger (red).
export default function Button({ children, variant = 'primary', sm, className = '', type = 'button', ...props }) {
    const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all disabled:opacity-60 disabled:pointer-events-none whitespace-nowrap';
    const size = sm ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2.5 text-[13px]';
    const variants = {
        primary: 'bg-[#4f6df5] hover:bg-[#6380f7] text-white',
        ghost:   'bg-transparent text-[#374151] border border-[#d1d5db] hover:bg-gray-100 hover:text-black',
        danger:  'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/15',
    };
    return (
        <button type={type} className={`${base} ${size} ${variants[variant] ?? variants.primary} ${className}`} {...props}>
            {children}
        </button>
    );
}
