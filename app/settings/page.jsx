'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserRound, Mail, ShieldCheck, KeyRound, LockKeyhole, CheckCircle2 } from 'lucide-react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';
import { useAuth } from '../components/AuthProvider';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) Promise.resolve().then(() => setName(user.name || ''));
  }, [user]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = await apiFetch('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (payload.user) setUser(payload.user);
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  }

  const initials = (user?.name || 'User').slice(0, 2).toUpperCase();

  return (
    <ModuleLayout title="Account settings" subtitle="Manage your profile and keep your workspace access secure.">
      <div className="max-w-5xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-slate-950">{initials}</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Your workspace profile</p>
                <h2 className="mt-1 text-2xl font-black">{user?.name || 'Workspace user'}</h2>
                <p className="mt-1 text-sm capitalize text-slate-400">{user?.role?.replace('_', ' ') || 'Team member'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><CheckCircle2 className="h-4 w-4" /> Account active</div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><UserRound className="h-5 w-5" /></span>
              <div><h2 className="text-lg font-bold text-slate-900">Profile information</h2><p className="mt-1 text-sm text-slate-500">Update the name shown across your ERP workspace.</p></div>
            </div>
            <div className="mt-7 space-y-5">
              <label className="block text-sm font-semibold text-slate-700">Display name<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100" /></label>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Email address</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-3 text-sm text-slate-500"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{user?.email || 'No email available'}</span><ShieldCheck className="ml-auto h-4 w-4 shrink-0 text-emerald-600" /></div>
                <p className="mt-2 text-xs text-slate-500">Email is managed by an administrator and cannot be changed.</p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <button disabled={saving} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save profile'}</button>
              {message && <span className="text-sm font-medium text-slate-600" role="status">{message}</span>}
            </div>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><LockKeyhole className="h-5 w-5" /></span>
            <h2 className="mt-5 text-lg font-bold text-slate-900">Password & security</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Reset your password through the secure email verification flow. Passwords are never displayed here.</p>
            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure reset link</p>
              <p className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-emerald-600" /> No current password shown</p>
            </div>
            <Link href="/forgot-password" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"><KeyRound className="h-4 w-4" /> Reset password</Link>
          </section>
        </div>
      </div>
    </ModuleLayout>
  );
}
