'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../components/AuthProvider';
import {
  Users,
  Shield,
  ShieldCheck,
  KeyRound,
  UserPlus,
  Search,
  Check,
  CheckSquare,
  Square,
  Edit,
  Trash2,
  Lock,
  Sparkles,
  LayoutDashboard,
  LineChart,
  BarChart3,
  Package,
  Boxes,
  ArrowLeftRight,
  Building2,
  ShoppingCart,
  Receipt,
  Users2,
  CreditCard,
  Newspaper,
  Wallet,
} from 'lucide-react';

const ALL_SYSTEM_MODULES = [
  { key: 'dashboard', label: 'Overview & Insights', category: 'Analytics', icon: LayoutDashboard, desc: 'View store KPI dashboard & metrics' },
  { key: 'financialReports', label: 'Financial Reports', category: 'Analytics', icon: LineChart, desc: 'Access P&L, balance and financial sheets' },
  { key: 'reports', label: 'Reports & Analytics', category: 'Analytics', icon: BarChart3, desc: 'Sales, operational & inventory reports' },
  { key: 'products', label: 'Products Catalogue', category: 'Operations', icon: Package, desc: 'Manage master items, prices & categories' },
  { key: 'inventory', label: 'Inventory Management', category: 'Operations', icon: Boxes, desc: 'Track stock, reorder levels & adjustments' },
  { key: 'stockTransfers', label: 'Stock Transfers', category: 'Operations', icon: ArrowLeftRight, desc: 'Transfer goods between store locations' },
  { key: 'suppliers', label: 'Suppliers & Vendors', category: 'Operations', icon: Building2, desc: 'Manage supplier contacts & procurement' },
  { key: 'pos', label: 'POS Cashier Terminal', category: 'Sales', icon: ShoppingCart, desc: 'Process customer checkouts & barcode scans' },
  { key: 'sales', label: 'Sales Orders', category: 'Sales', icon: Receipt, desc: 'View completed sales receipts & history' },
  { key: 'customers', label: 'Customer Management', category: 'Sales', icon: Users2, desc: 'Customer accounts, profiles & loyalty' },
  { key: 'payments', label: 'Payments', category: 'Sales', icon: CreditCard, desc: 'Record and verify customer payments' },
  { key: 'cms', label: 'CMS & Announcements', category: 'Marketing', icon: Newspaper, desc: 'Publish store news, flyers & promotional deals' },
  { key: 'expenses', label: 'Expenses & Overhead', category: 'Admin', icon: Wallet, desc: 'Log operational expenses & invoices' },
  { key: 'users', label: 'User & Permissions', category: 'Admin', icon: ShieldCheck, desc: 'Manage staff accounts and sidebar access' },
];

const ROLE_DEFAULT_PRESETS = {
  owner: ['dashboard', 'financialReports', 'reports', 'products', 'inventory', 'warehouses', 'stockTransfers', 'suppliers', 'pos', 'sales', 'customers', 'payments', 'cms', 'expenses', 'users'],
  admin: ['dashboard', 'reports', 'products', 'inventory', 'warehouses', 'suppliers', 'pos', 'sales', 'customers', 'cms', 'users'],
  manager: ['dashboard', 'reports', 'inventory', 'warehouses', 'suppliers', 'pos', 'sales', 'customers', 'cms'],
  cashier: ['pos', 'sales', 'customers'],
  warehouse_staff: ['inventory', 'warehouses', 'stockTransfers', 'suppliers'],
  accountant: ['dashboard', 'financialReports', 'payments', 'expenses', 'suppliers'],
};

export default function UsersPage() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [userForPermissions, setUserForPermissions] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await apiFetch(`/users?page=${page}&limit=10`);
      setUsers(Array.isArray(data) ? data : (data?.items || []));
      setTotalPages(Math.max(1, Number(data?.totalPages || 1)));
    } catch (err) {
      console.error(err);
      toast.error('Error', err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Loading the protected directory is an intentional state synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    loadUsers();
  }, [page]);

  function handleOpenNew() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function handleOpenEdit(user) {
    setEditingUser(user);
    setFormOpen(true);
  }

  function handleOpenPermissions(user) {
    setUserForPermissions(user);
    setPermissionsModalOpen(true);
  }

  function handleOpenDelete(user) {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/users/${userToDelete.id || userToDelete._id}`, {
        method: 'DELETE',
      });
      toast.success('User Deleted', `Account for "${userToDelete.name}" removed.`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Could not delete user.');
    } finally {
      setDeleting(false);
    }

  }

  async function updateActivation(user, active) {
    try {
      await apiFetch(`/users/${user.id || user._id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: active }),
      });
      toast.success(active ? 'User Approved' : 'User Deactivated', `${user.name} is now ${active ? 'active' : 'inactive'}.`);
      loadUsers();
    } catch (err) {
      toast.error('Access update failed', err.message || 'Could not update account access.');
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const managers = users.filter((u) => u.role === 'manager').length;
    const cashiers = users.filter((u) => u.role === 'cashier' || u.role === 'warehouse_staff').length;
    const customPermsCount = users.filter((u) => u.permissions && u.permissions.length > 0).length;
    return { total, managers, cashiers, customPermsCount };
  }, [users]);

  return (
    <ModuleLayout
      title="User & Access Control"
      subtitle="Configure staff credentials, assign roles, and customize individual sidebar module permissions."
      allowedRoles={['owner', 'admin']}
      headerActions={
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Staff Accounts"
            value={stats.total}
            subtitle="Registered ERP users"
            icon={Users}
            accent="emerald"
          />
          <StatCard
            label="Store Managers"
            value={stats.managers}
            subtitle="Department supervisors"
            icon={Shield}
            accent="amber"
          />
          <StatCard
            label="Frontline Staff"
            value={stats.cashiers}
            subtitle="Cashiers & warehouse"
            icon={KeyRound}
            accent="sky"
          />
          <StatCard
            label="Custom Permission Grants"
            value={stats.customPermsCount}
            subtitle="Individual access profiles"
            icon={ShieldCheck}
            accent="purple"
          />
        </div>

        {/* User Directory Container */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filter Role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="warehouse_staff">Warehouse Staff</option>
                <option value="accountant">Accountant</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Staff Member</th>
                  <th className="px-5 py-3.5">Email Address</th>
                  <th className="px-5 py-3.5">Base Role</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5">Sidebar Permissions</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <span className="animate-spin text-lg">↻</span>
                        <span>Loading staff directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No staff users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const initials = u.name ? u.name.substring(0, 2).toUpperCase() : 'US';
                    const activePerms = u.permissions?.length
                      ? u.permissions
                      : ROLE_DEFAULT_PRESETS[u.role] || [];
                    const isCustom = u.permissions && u.permissions.length > 0;

                    return (
                      <tr key={u.id || u._id} className="transition hover:bg-slate-50/60">
                        {/* Member Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-xs font-bold text-white shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{u.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">ID: {(u.id || u._id)?.slice(-6)}</p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4 text-slate-700 font-medium">{u.email}</td>

                        {/* Role */}
                        <td className="px-5 py-4">
                          <RoleBadge role={u.role} />
                        </td>

                        <td className="px-5 py-4">
                         <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${u.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                           {u.isActive ? 'Active' : (u.approvalStatus === 'rejected' ? 'Inactive' : 'Pending owner approval')}
                         </span>
                        </td>

                        {/* Permissions Summary */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                              {activePerms.length} modules granted
                            </span>
                            {isCustom && (
                              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200" title="Custom per-user override">
                                Custom Override
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {currentUser?.role === 'owner' && String(currentUser.id) !== String(u.id || u._id) && (
                              <button
                                onClick={() => updateActivation(u, !u.isActive)}
                                className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${u.isActive ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
                              >
                                {u.isActive ? 'Deactivate' : 'Approve & activate'}
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenPermissions(u)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100 active:scale-95"
                              title="Customize Sidebar Permissions"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              <span>Manage Permissions</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                              title="Edit User Info"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleOpenDelete(u)}
                              className="rounded-xl border border-slate-200 bg-white p-1.5 text-rose-500 transition hover:border-rose-200 hover:bg-rose-50"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500">
            <span>Showing {filteredUsers.length} staff members</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
            </div>
            <span>Role-based access control active</span>
          </div>
        </div>
      </div>

      {/* Permissions Modal */}
      {permissionsModalOpen && userForPermissions && (
        <PermissionsModal
          user={userForPermissions}
          onClose={() => {
            setPermissionsModalOpen(false);
            setUserForPermissions(null);
          }}
          onSuccess={() => {
            setPermissionsModalOpen(false);
            setUserForPermissions(null);
            toast.success('Permissions Saved', `Updated module access for ${userForPermissions.name}.`);
            loadUsers();
          }}
        />
      )}

      {/* User Create / Edit Form Modal */}
      {formOpen && (
        <UserFormModal
          initialData={editingUser}
          onClose={() => {
            setFormOpen(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            setFormOpen(false);
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Remove Staff Account?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{userToDelete.name}</strong>? They will no longer be able to log in or access the ERP system.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-rose-500 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
}

function StatCard({ label, value, subtitle, icon: Icon, accent }) {
  const accentStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${accentStyles[accent]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const badges = {
    owner: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    manager: 'bg-amber-50 text-amber-700 border-amber-200',
    cashier: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warehouse_staff: 'bg-slate-100 text-slate-700 border-slate-200',
    accountant: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };

  const labels = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Store Manager',
    cashier: 'Cashier',
    warehouse_staff: 'Warehouse Staff',
    accountant: 'Accountant',
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badges[role] || 'bg-slate-100 text-slate-700'}`}>
      {labels[role] || role}
    </span>
  );
}

function PermissionsModal({ user, onClose, onSuccess }) {
  const [selectedPermissions, setSelectedPermissions] = useState(() => {
    if (user.permissions && user.permissions.length > 0) {
      return [...user.permissions];
    }
    return ROLE_DEFAULT_PRESETS[user.role] || [];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function togglePermission(key) {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  function handleResetToRoleDefaults() {
    const defaults = ROLE_DEFAULT_PRESETS[user.role] || [];
    setSelectedPermissions(defaults);
  }

  function handleSelectAll() {
    setSelectedPermissions(ALL_SYSTEM_MODULES.map((m) => m.key));
  }

  function handleClearAll() {
    setSelectedPermissions([]);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiFetch(`/users/${user.id || user._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          permissions: selectedPermissions,
        }),
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update permissions.');
    } finally {
      setSaving(false);
    }
  }

  // Group modules by category
  const categories = ['Analytics', 'Operations', 'Sales', 'Marketing', 'Admin'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <KeyRound className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">Custom Sidebar Permissions</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Customize accessible sidebar modules for <strong className="text-slate-800">{user.name}</strong> ({user.email} — {user.role})
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Preset Shortcuts */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>
                <strong>{selectedPermissions.length}</strong> of {ALL_SYSTEM_MODULES.length} modules granted
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetToRoleDefaults}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Reset to {user.role} Defaults
              </button>
              <button
                type="button"
                onClick={handleSelectAll}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
              >
                Grant All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Module Matrix Categories */}
          <div className="space-y-4">
            {categories.map((cat) => {
              const catModules = ALL_SYSTEM_MODULES.filter((m) => m.category === cat);

              return (
                <div key={cat} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{cat} Modules</h4>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {catModules.map((mod) => {
                      const Icon = mod.icon;
                      const isChecked = selectedPermissions.includes(mod.key);

                      return (
                        <div
                          key={mod.key}
                          onClick={() => togglePermission(mod.key)}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition select-none ${
                            isChecked
                              ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                            isChecked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${isChecked ? 'text-emerald-700' : 'text-slate-400'}`} />
                              <p className={`text-xs font-bold ${isChecked ? 'text-emerald-950' : 'text-slate-800'}`}>
                                {mod.label}
                              </p>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                              {mod.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? 'Saving Permissions...' : 'Save Permissions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserFormModal({ initialData, onClose, onSuccess }) {
  const isEditing = Boolean(initialData?.id || initialData?._id);
  const userId = initialData?.id || initialData?._id;

  const [form, setForm] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || 'cashier',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.email.trim()) return setError('Email is required.');
    if (!isEditing && form.password.length < 6) return setError('Password must be at least 6 characters.');

    setSaving(true);
    setError(null);

    try {
      if (isEditing) {
        await apiFetch(`/users/${userId}`, {
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
            permissions: ROLE_DEFAULT_PRESETS[form.role] || [],
          }),
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save staff member.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Staff Account' : 'Register New Staff Member'}
            </h3>
            <p className="text-xs text-slate-500">Provide staff name, login credentials and system role</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Marcus Vance"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
            <input
              type="email"
              required
              placeholder="marcus@supermarket.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Temporary Password</label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">System Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="owner">Owner (Full Enterprise Control)</option>
              <option value="admin">System Admin</option>
              <option value="manager">Store Manager</option>
              <option value="cashier">POS Cashier</option>
              <option value="warehouse_staff">Warehouse Staff</option>
              <option value="accountant">Accountant / Auditor</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
