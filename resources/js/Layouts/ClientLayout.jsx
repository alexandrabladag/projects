import { Link, usePage } from '@inertiajs/react';
import { FolderKanban, FileText, Receipt, LogOut } from 'lucide-react';

export default function ClientLayout({ children, title }) {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-[#f8f8f8]">
            {/* Top Nav */}
            <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">
                    <div className="flex items-center gap-6">
                        <Link href={route('portal.dashboard')} className="text-[16px] font-bold text-black tracking-tight">
                            Client Portal
                        </Link>
                        <nav className="flex items-center gap-1">
                            <NavLink href={route('portal.dashboard')} icon={<FolderKanban size={15} />}>Projects</NavLink>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] text-[#6b7280]">{auth.user.name}</span>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-[#9ca3af] hover:text-black transition-colors"
                        >
                            <LogOut size={16} />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
                {title && <h1 className="text-[18px] md:text-[22px] font-bold text-black mb-5 md:mb-6">{title}</h1>}
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, children }) {
    const { url } = usePage();
    const active = url === href || url.startsWith(href + '/');
    return (
        <Link
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                active ? 'bg-[#4f6df5]/10 text-[#4f6df5]' : 'text-[#6b7280] hover:text-black hover:bg-gray-50'
            }`}
        >
            {icon}{children}
        </Link>
    );
}
