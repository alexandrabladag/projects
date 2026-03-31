export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
            {/* Subtle background pattern */}
            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #4f6df5 1px, transparent 0)',
                    backgroundSize: '48px 48px',
                }}
            />
            <div className="relative w-full max-w-[420px]">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="font-serif text-3xl font-bold tracking-[6px] text-[#4f6df5] mb-1">FLOW</div>
                    <div className="text-[10px] tracking-[3px] text-[#6b7280] uppercase">Project Management</div>
                </div>

                {/* Card */}
                <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
