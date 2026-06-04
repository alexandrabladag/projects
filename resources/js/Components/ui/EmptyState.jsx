// Shared empty state — tinted icon tile, title, optional subtitle and action.
export default function EmptyState({ icon, title, subtitle, action, accent = '#4f6df5', className = '' }) {
    return (
        <div className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className}`}>
            {icon && (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${accent}14`, color: accent }}>
                    {icon}
                </div>
            )}
            <div className="text-[14px] font-semibold text-black">{title}</div>
            {subtitle && <div className="text-[13px] text-[#4b5563] mt-1 max-w-[340px]">{subtitle}</div>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
