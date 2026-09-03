'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api.client';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationStep, setVerificationStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [verified, setVerified] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      setVerificationStep(true);
    } catch (err) {
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }

  }

  async function handleVerify(e) {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        await apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email: email.trim(), otp: otpDigits.join('') }) });
        setVerified(true);
        setTimeout(() => router.push('/login'), 1500);
      } catch (err) {
        setError(err?.message || 'Verification failed');
      } finally {
        setLoading(false);
      }

    }

  function updateOtpDigit(index, value) {
    const digits = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((current) => current.map((digit, i) => (i === index ? digits : digit)));
    if (digits && index < otpRefs.current.length - 1) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = Array.from({ length: 6 }, (_, index) => pasted[index] || '');
    setOtpDigits(digits);
    otpRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
  }

  async function handleResend() {
      setError('');
      try {
        await apiFetch('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      } catch (err) {
        setError(err?.message || 'Unable to resend code');
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-600/20">
            A
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Get started by creating your account
          </p>
        </div>

        {/* Signup Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          {verificationStep ? (
            <form onSubmit={handleVerify} className="space-y-5">
              <p className="text-sm text-slate-600">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
              <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { otpRefs.current[index] = element; }}
                    value={digit}
                    onChange={(event) => updateOtpDigit(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Verification digit ${index + 1}`}
                    disabled={loading || verified}
                    className="h-12 w-11 rounded-lg border border-slate-200 text-center text-lg font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
                  />
                ))}
              </div>
              {error && <div className="rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm text-rose-600">{error}</div>}
              {verified && <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">Email verified. Redirecting to login…</div>}
              <button type="submit" disabled={loading || verified || otpDigits.some((digit) => !digit)} className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Verifying...' : 'Verify email'}</button>
              <button type="button" onClick={handleResend} disabled={loading || verified} className="w-full text-sm font-medium text-emerald-600">Resend code</button>
            </form>
          ) : <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <span className="text-xs text-slate-400">
                  Minimum 8 characters
                </span>
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 transition hover:text-emerald-600 disabled:cursor-not-allowed"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}

              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>}

          {/* Login */}
          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          By creating an account, you agree to our terms and privacy policy.
        </p>
      </div>
    </main>
  );
}
