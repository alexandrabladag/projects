import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, KeyRound } from 'lucide-react';

// Sub-navigation shared across the admin panel pages.
export default function AdminNav() {
    const { url } = usePage();

    const tabs = [
        { href: route('admin.dashboard'),      label: 'Overview', icon: LayoutGrid, active: url === '/admin' },
        { href: route('admin.accounts.index'), label: 'Accounts', icon: KeyRound,   active: url.startsWith('/admin/accounts') },
    ];

    return (
        <div className="flex items-center gap-1 mb-6 border-b border-[#e5e7eb]">
            {tabs.map(t => {
                const Icon = t.icon;
                return (
                    <Link
                        key={t.href}
                        href={t.href}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium -mb-px border-b-2 transition-colors
                            ${t.active
                                ? 'border-[#4f6df5] text-[#4f6df5]'
                                : 'border-transparent text-[#6b7280] hover:text-black'
                            }`}
                    >
                        <Icon size={15} /> {t.label}
                    </Link>
                );
            })}
        </div>
    );
}
