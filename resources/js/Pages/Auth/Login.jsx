import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

const inputCls = 'w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[13px] text-black outline-none focus:border-[#4f6df5] transition-colors';

const EyeIcon = ({ open }) => open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
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

            <h2 className="font-serif text-2xl font-semibold text-black mb-1">Welcome back</h2>
            <p className="text-[13px] text-[#6b7280] mb-7">Sign in to your ProjectFlow account</p>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-[10px] tracking-[1.2px] uppercase text-[#6b7280] font-medium mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        autoComplete="username"
                        className={inputCls}
                        placeholder="you@company.com"
                    />
                    {errors.email && <p className="text-red-400 text-[12px] mt-1.5">{errors.email}</p>}
                </div>

                <div>
                    <label className="block text-[10px] tracking-[1.2px] uppercase text-[#6b7280] font-medium mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            autoComplete="current-password"
                            className={`${inputCls} pr-10`}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-black transition-colors"
                        >
                            <EyeIcon open={showPassword} />
                        </button>
                    </div>
                    {errors.password && <p className="text-red-400 text-[12px] mt-1.5">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={e => setData('remember', e.target.checked)}
                            className="rounded border-[#d1d5db] bg-[#f3f4f6] text-[#4f6df5]"
                        />
                        <span className="text-[12px] text-[#6b7280]">Remember me</span>
                    </label>
                    {canResetPassword && (
                        <Link href={route('password.request')} className="text-[12px] text-[#4f6df5] hover:text-[#6380f7] transition-colors">
                            Forgot password?
                        </Link>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg py-2.5 text-[13px] transition-all mt-2 disabled:opacity-60"
                >
                    {processing ? 'Signing in…' : 'Sign In'}
                </button>
            </form>

            <p className="text-center text-[12px] text-[#6b7280] mt-5">
                Don't have an account?{' '}
                <Link href={route('register')} className="text-[#4f6df5] hover:text-[#6380f7] transition-colors font-medium">
                    Create account
                </Link>
            </p>

        </GuestLayout>
    );
}
