import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const field = (label, key, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-[10px] tracking-[1.2px] uppercase text-[#58607a] font-medium mb-2">
                {label}
            </label>
            <input
                type={type}
                value={data[key]}
                onChange={e => setData(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#11131d] border border-[#252b40] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e2dcd2] outline-none focus:border-[#c9a464] transition-colors"
            />
            {errors[key] && <p className="text-red-400 text-[12px] mt-1.5">{errors[key]}</p>}
        </div>
    );

    return (
        <GuestLayout>
            <Head title="Create Account" />

            <h2 className="font-serif text-2xl font-semibold text-[#e2dcd2] mb-1">Create account</h2>
            <p className="text-[13px] text-[#58607a] mb-7">Join your team on ProjectFlow</p>

            <form onSubmit={submit} className="space-y-4">
                {field('Full Name', 'name', 'text', 'Your name')}
                {field('Email Address', 'email', 'email', 'you@company.com')}
                {field('Password', 'password', 'password', '••••••••')}
                {field('Confirm Password', 'password_confirmation', 'password', '••••••••')}

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-[#c9a464] hover:bg-[#d4b472] text-[#0b0d14] font-semibold rounded-lg py-2.5 text-[13px] transition-all mt-2 disabled:opacity-60"
                >
                    {processing ? 'Creating account…' : 'Create Account'}
                </button>
            </form>

            <p className="text-center text-[12px] text-[#58607a] mt-5">
                Already have an account?{' '}
                <Link href={route('login')} className="text-[#c9a464] hover:text-[#d4b472] transition-colors">
                    Sign in
                </Link>
            </p>
        </GuestLayout>
    );
}
