'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);

    try {
      const data = await apiFetch('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing({});
    setFormOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setFormOpen(true);
  }

  async function remove(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiFetch(`/users/${id}`, {
        method: 'DELETE',
      });

      load();
    } catch (err) {
      alert(err?.message || 'Failed to delete user');
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return users;

    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
    );
  }, [users, search]);

  return (
    <ModuleLayout
      title="Users"
      subtitle="Manage users, roles and system access"
      allowedRoles={['owner', 'admin']}
      headerActions={
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
        >
          <span className="text-lg leading-none">+</span>
          New user
        </button>
      }
    >
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total users"
            value={users.length}
            icon="users"
          />

          <StatCard
            label="Active roles"
            value={new Set(users.map((user) => user.role)).size}
            icon="shield"
          />

          <StatCard
            label="Administrators"
            value={
              users.filter(
                (user) =>
                  user.role === 'owner' || user.role === 'admin'
              ).length
            }
            icon="admin"
          />
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                All users
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {filteredUsers.length} user
                {filteredUsers.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <LoadingRows />
                ) : filteredUsers.length === 0 ? (
                  <EmptyState search={search} onCreate={openNew} />
                ) : (
                  filteredUsers.map((user) => (
                    <UserRow
                      key={user._id}
                      user={user}
                      onEdit={() => openEdit(user)}
                      onDelete={() => remove(user._id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {formOpen && (
        <UserForm
          initial={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </ModuleLayout>
  );
}


/* -------------------------------------------------------------------------- */
/* User Row                                                                    */
/* -------------------------------------------------------------------------- */

function UserRow({ user, onEdit, onDelete }) {
  const initials = getInitials(user.name);

  return (
    <tr className="group border-b border-slate-100 last:border-0 transition hover:bg-slate-50/60">

      {/* User */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.name}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              User ID: {user._id?.slice(-8)}
            </p>
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-4">
        <span className="text-sm text-slate-600">
          {user.email}
        </span>
      </td>

      {/* Role */}
      <td className="px-4 py-4">
        <RoleBadge role={user.role} />
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">

          <button
            onClick={onEdit}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            Edit
          </button>

          <button
            onClick={onDelete}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-500 transition hover:border-rose-200 hover:bg-rose-50"
          >
            Delete
          </button>

        </div>
      </td>
    </tr>
  );
}


/* -------------------------------------------------------------------------- */
/* Role Badge                                                                  */
/* -------------------------------------------------------------------------- */

function RoleBadge({ role }) {
  const roles = {
    owner: {
      label: 'Owner',
      className: 'bg-purple-50 text-purple-700 ring-purple-600/10',
    },

    admin: {
      label: 'Admin',
      className: 'bg-blue-50 text-blue-700 ring-blue-600/10',
    },

    manager: {
      label: 'Manager',
      className: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    },

    cashier: {
      label: 'Cashier',
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    },

    warehouse_staff: {
      label: 'Warehouse Staff',
      className: 'bg-slate-100 text-slate-700 ring-slate-600/10',
    },

    accountant: {
      label: 'Accountant',
      className: 'bg-cyan-50 text-cyan-700 ring-cyan-600/10',
    },
  };

  const current = roles[role] || {
    label: role || 'Unknown',
    className: 'bg-slate-100 text-slate-600 ring-slate-600/10',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${current.className}`}
    >
      {current.label}
    </span>
  );
}


/* -------------------------------------------------------------------------- */
/* Stats Card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
          {icon === 'users' && '♟'}
          {icon === 'shield' && '◆'}
          {icon === 'admin' && '●'}
        </div>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* Loading Rows                                                                */
/* -------------------------------------------------------------------------- */

function LoadingRows() {
  return (
    <>
      {[1, 2, 3, 4].map((item) => (
        <tr key={item} className="border-b border-slate-100">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />

              <div className="space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                <div className="h-2 w-20 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </td>

          <td className="px-4 py-4">
            <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
          </td>

          <td className="px-4 py-4">
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
          </td>

          <td className="px-6 py-4">
            <div className="ml-auto h-7 w-24 animate-pulse rounded bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}


/* -------------------------------------------------------------------------- */
/* Empty State                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState({ search, onCreate }) {
  return (
    <tr>
      <td colSpan="4">
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
            ♟
          </div>

          <h3 className="text-sm font-semibold text-slate-900">
            {search ? 'No users found' : 'No users yet'}
          </h3>

          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {search
              ? 'Try searching with a different name, email or role.'
              : 'Create your first system user to get started.'}
          </p>

          {!search && (
            <button
              onClick={onCreate}
              className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Create user
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}


/* -------------------------------------------------------------------------- */
/* User Form                                                                   */
/* -------------------------------------------------------------------------- */

function UserForm({ initial = {}, onClose = () => {} }) {
  const isEditing = Boolean(initial?._id);

  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    password: '',
    role: initial.role || 'cashier',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');

    if (!form.name.trim()) {
      setError('Please enter the user name.');
      return;
    }

    if (!form.email.trim()) {
      setError('Please enter the email address.');
      return;
    }

    if (!isEditing && form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);

    try {
      if (isEditing) {
        await apiFetch(`/users/${initial._id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
          }),
        });
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
          }),
        });
      }

      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit user' : 'Create user'}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? 'Update the user account and permissions.'
                : 'Add a new user to your ERP system.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 px-6 py-6">

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="user-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>

            <input
              id="user-name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="user-email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="user-email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
            />
          </div>

          {/* Password */}
          {!isEditing && (
            <div>
              <label
                htmlFor="user-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) =>
                    updateField('password', e.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-emerald-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {/* Role */}
          <div>
            <label
              htmlFor="user-role"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              System role
            </label>

            <select
              id="user-role"
              value={form.role}
              onChange={(e) => updateField('role', e.target.value)}
              disabled={saving}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="warehouse_staff">
                Warehouse Staff
              </option>
              <option value="accountant">Accountant</option>
            </select>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}

            {saving
              ? 'Saving...'
              : isEditing
                ? 'Save changes'
                : 'Create user'}
          </button>
        </div>
      </form>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* Helpers                                                                      */
/* -------------------------------------------------------------------------- */

function getInitials(name = '') {
  const words = name.trim().split(/\s+/);

  if (!words.length || !words[0]) return 'U';

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

