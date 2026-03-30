import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout>
            <Head title="Sign In" />

            {status && (
                <div className="mb-5 text-[13px] text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
                    {status}
                </div>
            )}

            <h2 className="font-serif text-2xl font-semibold text-[#e2dcd2] mb-1">Welcome back</h2>
            <p className="text-[13px] text-[#58607a] mb-7">Sign in to your ProjectFlow account</p>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-[10px] tracking-[1.2px] uppercase text-[#58607a] font-medium mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        autoComplete="username"
                        className="w-full bg-[#11131d] border border-[#252b40] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e2dcd2] outline-none focus:border-[#c9a464] transition-colors"
                        placeholder="you@company.com"
                    />
                    {errors.email && <p className="text-red-400 text-[12px] mt-1.5">{errors.email}</p>}
                </div>

                <div>
                    <label className="block text-[10px] tracking-[1.2px] uppercase text-[#58607a] font-medium mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        autoComplete="current-password"
                        className="w-full bg-[#11131d] border border-[#252b40] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e2dcd2] outline-none focus:border-[#c9a464] transition-colors"
                        placeholder="••••••••"
                    />
                    {errors.password && <p className="text-red-400 text-[12px] mt-1.5">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={e => setData('remember', e.target.checked)}
                            className="rounded border-[#252b40] bg-[#11131d] text-[#c9a464]"
                        />
                        <span className="text-[12px] text-[#58607a]">Remember me</span>
                    </label>
                    {canResetPassword && (
                        <Link href={route('password.request')} className="text-[12px] text-[#c9a464] hover:text-[#d4b472] transition-colors">
                            Forgot password?
                        </Link>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-[#c9a464] hover:bg-[#d4b472] text-[#0b0d14] font-semibold rounded-lg py-2.5 text-[13px] transition-all mt-2 disabled:opacity-60"
                >
                    {processing ? 'Signing in…' : 'Sign In'}
                </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-[#1d2236]">
                <p className="text-[10px] tracking-[1px] uppercase text-[#58607a] mb-3">Demo Accounts</p>
                {[
                    { label: 'Admin', email: 'admin@projectflow.com' },
                    { label: 'Manager', email: 'manager@projectflow.com' },
                    { label: 'Client', email: 'sarah.chen@meridiancg.com' },
                ].map(({ label, email }) => (
                    <button
                        key={label}
                        type="button"
                        onClick={() => { setData({ email, password: 'password', remember: false }); }}
                        className="flex justify-between items-center w-full px-3 py-2 rounded-lg text-[12px] text-[#9a9180] hover:bg-white/[0.03] hover:text-[#e2dcd2] transition-all mb-1"
                    >
                        <span className="font-medium">{label}</span>
                        <span className="text-[#58607a]">{email}</span>
                    </button>
                ))}
            </div>
        </GuestLayout>
    );
}
