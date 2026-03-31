import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const inputCls = 'w-full bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-[13px] text-black outline-none focus:border-[#4f6df5] transition-colors';
const labelCls = 'block text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-2';

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

function PasswordInput({ value, onChange, placeholder, error }) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <div className="relative">
                <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-black transition-colors">
                    <EyeIcon open={show} />
                </button>
            </div>
            {error && <p className="text-red-500 text-[12px] mt-1">{error}</p>}
        </div>
    );
}

function ProfileSection({ user }) {
    const { data, setData, put, processing, errors } = useForm({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        company: user.company ?? '',
        job_title: user.job_title ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('profile.update'));
    };

    const field = (label, key, type = 'text', placeholder = '', half = false) => (
        <div className={half ? '' : 'col-span-2'}>
            <label className={labelCls}>{label}</label>
            <input type={type} value={data[key]} onChange={e => setData(key, e.target.value)} placeholder={placeholder} className={inputCls} />
            {errors[key] && <p className="text-red-500 text-[12px] mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <form onSubmit={submit} className="bg-white border border-[#e5e7eb] rounded-xl p-7 space-y-5">
            <div>
                <h3 className="text-[16px] font-bold text-black">Personal Information</h3>
                <p className="text-[13px] text-[#6b7280] mt-1">Update your name, email, and other details.</p>
            </div>

            {/* Avatar placeholder */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#4f6df5]/10 flex items-center justify-center text-[22px] font-bold text-[#4f6df5]">
                    {(data.first_name?.[0] ?? '').toUpperCase()}{(data.last_name?.[0] ?? '').toUpperCase()}
                </div>
                <div>
                    <div className="text-[14px] font-semibold text-black">{data.first_name} {data.last_name}</div>
                    <div className="text-[12px] text-[#6b7280]">@{data.username || '—'}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {field('First Name *', 'first_name', 'text', 'First name', true)}
                {field('Last Name *', 'last_name', 'text', 'Last name', true)}
                {field('Username *', 'username', 'text', 'Username')}
                {field('Email *', 'email', 'email', 'you@company.com')}
            </div>

            <div className="pt-2">
                <div className="text-[11px] tracking-[1px] uppercase text-[#6b7280] font-medium mb-3 flex items-center gap-3">
                    Work Info <span className="text-[#9ca3af] font-normal normal-case tracking-normal">(optional)</span>
                    <span className="flex-1 h-px bg-[#e5e7eb]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {field('Company', 'company', 'text', 'Company name', true)}
                    {field('Job Title', 'job_title', 'text', 'e.g. Project Manager', true)}
                    {field('Phone', 'phone', 'text', '+1 (___) ___-____')}
                </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#e5e7eb]">
                <button type="submit" disabled={processing} className="px-5 py-2.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60">
                    {processing ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}

function PasswordSection() {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('profile.password'), { onSuccess: () => reset() });
    };

    return (
        <form onSubmit={submit} className="bg-white border border-[#e5e7eb] rounded-xl p-7 space-y-5">
            <div>
                <h3 className="text-[16px] font-bold text-black">Change Password</h3>
                <p className="text-[13px] text-[#6b7280] mt-1">Ensure your account uses a strong, unique password.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className={labelCls}>Current Password</label>
                    <PasswordInput value={data.current_password} onChange={e => setData('current_password', e.target.value)} placeholder="Current password" error={errors.current_password} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>New Password</label>
                        <PasswordInput value={data.password} onChange={e => setData('password', e.target.value)} placeholder="New password" error={errors.password} />
                    </div>
                    <div>
                        <label className={labelCls}>Confirm New Password</label>
                        <PasswordInput value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} placeholder="Confirm password" error={errors.password_confirmation} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#e5e7eb]">
                <button type="submit" disabled={processing} className="px-5 py-2.5 bg-[#4f6df5] hover:bg-[#6380f7] text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60">
                    {processing ? 'Updating…' : 'Update Password'}
                </button>
            </div>
        </form>
    );
}

function DeleteSection() {
    const [confirming, setConfirming] = useState(false);
    const { data, setData, delete: destroy, processing, errors } = useForm({ password: '' });

    const submit = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'));
    };

    return (
        <div className="bg-white border border-red-200 rounded-xl p-7 space-y-5">
            <div>
                <h3 className="text-[16px] font-bold text-red-600">Delete Account</h3>
                <p className="text-[13px] text-[#6b7280] mt-1">
                    Once deleted, all your data will be permanently removed. This action cannot be undone.
                </p>
            </div>

            {!confirming ? (
                <button onClick={() => setConfirming(true)} className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
                    Delete my account
                </button>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-600">
                        Please enter your password to confirm account deletion.
                    </div>
                    <div>
                        <label className={labelCls}>Password</label>
                        <PasswordInput value={data.password} onChange={e => setData('password', e.target.value)} placeholder="Enter your password" error={errors.password} />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setConfirming(false)} className="px-4 py-2.5 rounded-lg text-[13px] text-[#6b7280] border border-[#d1d5db] hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-[13px] transition-all disabled:opacity-60">
                            {processing ? 'Deleting…' : 'Permanently Delete'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default function Profile({ user }) {
    return (
        <AppLayout
            title="Profile Settings"
            breadcrumbs={[{ label: 'Settings' }, { label: 'Profile' }]}
        >
            <Head title="Profile Settings" />

            <div className="max-w-2xl space-y-6">
                <ProfileSection user={user} />
                <PasswordSection />
                <DeleteSection />
            </div>
        </AppLayout>
    );
}
