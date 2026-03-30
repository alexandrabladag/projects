export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#0b0d14] flex items-center justify-center p-4">
            {/* Subtle background pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #c9a464 1px, transparent 0)',
                    backgroundSize: '48px 48px',
                }}
            />
            <div className="relative w-full max-w-[420px]">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="font-serif text-3xl font-bold tracking-[6px] text-[#c9a464] mb-1">FLOW</div>
                    <div className="text-[10px] tracking-[3px] text-[#58607a] uppercase">Project Management</div>
                </div>

                {/* Card */}
                <div className="bg-[#171a28] border border-[#1d2236] rounded-2xl p-8 shadow-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
