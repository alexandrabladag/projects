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

function PasswordField({ label, value, onChange, placeholder, error }) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#6b7280] font-medium mb-2">{label}</label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`${inputCls} pr-10`}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-black transition-colors"
                >
                    <EyeIcon open={show} />
                </button>
            </div>
            {error && <p className="text-red-400 text-[12px] mt-1.5">{error}</p>}
        </div>
    );
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        company: '',
        job_title: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const field = (label, key, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#6b7280] font-medium mb-2">{label}</label>
            <input
                type={type}
                value={data[key]}
                onChange={e => setData(key, e.target.value)}
                placeholder={placeholder}
                className={inputCls}
            />
            {errors[key] && <p className="text-red-400 text-[12px] mt-1.5">{errors[key]}</p>}
        </div>
    );

    return (
        <GuestLayout>
            <Head title="Create Account" />

            <h2 className="font-serif text-2xl font-semibold text-black mb-1">Create account</h2>
            <p className="text-[13px] text-[#6b7280] mb-6">Join your team on ProjectFlow</p>

            <form onSubmit={submit} className="space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                    {field('First Name *', 'first_name', 'text', 'First name')}
                    {field('Last Name *', 'last_name', 'text', 'Last name')}
                </div>

                {field('Username *', 'username', 'text', 'Choose a username')}
                {field('Email Address *', 'email', 'email', 'you@company.com')}

                {/* Password row */}
                <div className="grid grid-cols-2 gap-3">
                    <PasswordField
                        label="Password *"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        placeholder="••••••••"
                        error={errors.password}
                    />
                    <PasswordField
                        label="Confirm Password *"
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        placeholder="••••••••"
                        error={errors.password_confirmation}
                    />
                </div>

                {/* Company info section */}
                <div className="pt-2">
                    <div className="text-[10px] tracking-[1.2px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">
                        Company Info <span className="text-[#9ca3af] font-normal normal-case tracking-normal">(optional)</span>
                        <span className="flex-1 h-px bg-[#e5e7eb]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {field('Company', 'company', 'text', 'Company name')}
                        {field('Job Title', 'job_title', 'text', 'e.g. Project Manager')}
                    </div>
                    <div className="mt-3">
                        {field('Phone', 'phone', 'text', '+1 (___) ___-____')}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg py-2.5 text-[13px] transition-all mt-2 disabled:opacity-60"
                >
                    {processing ? 'Creating account…' : 'Create Account'}
                </button>
            </form>

            <p className="text-center text-[12px] text-[#6b7280] mt-5">
                Already have an account?{' '}
                <Link href={route('login')} className="text-[#4f6df5] hover:text-[#6380f7] transition-colors">
                    Sign in
                </Link>
            </p>
        </GuestLayout>
    );
}

export { PasswordField, EyeIcon };
