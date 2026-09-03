'use client';

import { useEffect, useState, useMemo } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';
import { useToast } from '../components/ToastProvider';
import { Building2, CheckCircle2, Mail, Phone, Search, PauseCircle } from 'lucide-react';

export default function SuppliersPage() {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierPage, setSupplierPage] = useState(1);
  const supplierPageSize = 6;

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [activeSupplierDetails, setActiveSupplierDetails] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadSuppliers(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiFetch('/suppliers');
      const items = Array.isArray(res) ? res : (res?.suppliers || []);
      setSuppliers(items);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      toast.error('Error', err.message || 'Failed to fetch suppliers list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // Load the initial directory once when the module mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSuppliers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.contactName && s.contactName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.taxId && s.taxId.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || (s.status || 'Active') === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [suppliers, searchQuery, statusFilter]);
  const supplierTotalPages = Math.max(1, Math.ceil(filteredSuppliers.length / supplierPageSize));
  const currentSupplierPage = Math.min(supplierPage, supplierTotalPages);
  const visibleSuppliers = filteredSuppliers.slice((currentSupplierPage - 1) * supplierPageSize, currentSupplierPage * supplierPageSize);

  // Metrics
  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => (s.status || 'Active') === 'Active').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [suppliers]);

  function handleOpenCreate() {
    setEditingSupplier(null);
    setFormModalOpen(true);
  }

  function handleOpenEdit(supplier) {
    setEditingSupplier(supplier);
    setFormModalOpen(true);
  }

  async function handleOpenDetails(supplier) {
    setActiveSupplierDetails(supplier);
    setDetailsModalOpen(true);

    // Fetch full details with purchase orders if available
    try {
      const full = await apiFetch(`/suppliers/${supplier._id || supplier.id}`);
      if (full) setActiveSupplierDetails(full);
    } catch (e) {
      console.warn('Could not load complete supplier details', e);
    }
  }

  function handleOpenDelete(supplier) {
    setSupplierToDelete(supplier);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!supplierToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/suppliers/${supplierToDelete._id || supplierToDelete.id}`, {
        method: 'DELETE',
      });
      toast.success('Supplier Deleted', `Supplier "${supplierToDelete.name}" has been removed.`);
      setDeleteConfirmOpen(false);
      setSupplierToDelete(null);
      loadSuppliers(true);
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Could not delete supplier.');
    } finally {
      setDeleting(false);
    }
  }

  function handleSaveSuccess(savedSupplier, isEdit) {
    setFormModalOpen(false);
    setEditingSupplier(null);
    toast.success(
      isEdit ? 'Supplier Updated' : 'Supplier Created',
      `"${savedSupplier.name}" was successfully saved.`
    );
    loadSuppliers(true);
  }

  return (
    <ModuleLayout
      title="Suppliers & Vendor Management"
      subtitle="Manage supplier profiles, procurement contracts, contact directories, and supply history."
      allowedRoles={['owner', 'admin', 'manager', 'warehouse_staff', 'accountant']}
      headerActions={
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => loadSuppliers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
          >
            <span className={`inline-block text-base ${refreshing ? 'animate-spin' : ''}`}>↻</span>
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]"
          >
            <span>+</span>
            <span>Add Supplier</span>
          </button>
        </div>
      }
    >
      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SupplierStatCard
          label="Total Registered Suppliers"
          value={stats.total}
          subtitle="Active procurement accounts"
          accent="emerald"
          icon={Building2}
        />
        <SupplierStatCard
          label="Active Partners"
          value={stats.active}
          subtitle="Ready for purchase orders"
          accent="sky"
          icon={CheckCircle2}
        />
        <SupplierStatCard
          label="Inactive / On Hold"
          value={stats.inactive}
          subtitle="Suspended or archived"
          accent="slate"
          icon={PauseCircle}
        />
      </div>

      {/* Main Content Area */}
      <section className="mt-8 space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by company name, contact person, email, phone, city..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSupplierPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSupplierPage(1); }}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setSupplierPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Supplier vendor cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">Loading suppliers directory...</div> : filteredSuppliers.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              {searchQuery || statusFilter !== 'all' ? 'No suppliers matched your search criteria.' : 'No suppliers registered yet.'}
            </div>
          ) : visibleSuppliers.map((s) => {
            const isActive = (s.status || 'Active') === 'Active';
            const initials = s.name ? s.name.substring(0, 2).toUpperCase() : 'SP';
            return (
              <article key={s._id || s.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-800">{initials}</div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900">{s.name}</h3>
                      <p className="truncate text-xs text-slate-500">{s.contactName || 'No contact person'}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{s.status || 'Active'}</span>
                </div>
                <div className="mt-5 grid gap-2 text-xs text-slate-600">
                  <p><Mail className="mr-2 inline h-3.5 w-3.5 text-slate-400" />{s.email || 'No email provided'}</p>
                  <p><Phone className="mr-2 inline h-3.5 w-3.5 text-slate-400" />{s.phone || 'No phone provided'}</p>
                  <p><Building2 className="mr-2 inline h-3.5 w-3.5 text-slate-400" />{[s.city, s.country].filter(Boolean).join(', ') || 'Location not specified'}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-700">{s.paymentTerms || 'Net 30'}</span>
                  {s.taxId && <span className="text-slate-400">Tax ID: {s.taxId}</span>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleOpenDetails(s)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">View details</button>
                  <button onClick={() => handleOpenEdit(s)} className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Edit</button>
                  <button onClick={() => handleOpenDelete(s)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50" aria-label={`Delete ${s.name}`}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <span>{filteredSuppliers.length === 0 ? 'Showing 0 suppliers' : `Showing ${(currentSupplierPage - 1) * supplierPageSize + 1}-${Math.min(currentSupplierPage * supplierPageSize, filteredSuppliers.length)} of ${filteredSuppliers.length} suppliers`}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSupplierPage((current) => Math.max(1, current - 1))} disabled={currentSupplierPage === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            <span className="min-w-16 text-center font-semibold text-slate-700">Page {currentSupplierPage} of {supplierTotalPages}</span>
            <button type="button" onClick={() => setSupplierPage((current) => Math.min(supplierTotalPages, current + 1))} disabled={currentSupplierPage === supplierTotalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
          </div>
        </div>
        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Supplier / Company</th>
                  <th className="px-5 py-3.5">Contact Person</th>
                  <th className="px-5 py-3.5">Email & Phone</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Payment Terms</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <span className="animate-spin text-lg">↻</span>
                        <span>Loading suppliers directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      {searchQuery || statusFilter !== 'all' ? (
                        <div>
                          <p className="font-semibold text-slate-700">No suppliers matched your search criteria.</p>
                          <p className="mt-1 text-xs text-slate-400">Try clearing filters or search with a different keyword.</p>
                        </div>
                      ) : (
                        <div className="py-4">
                          <p className="font-semibold text-slate-700">No suppliers registered yet.</p>
                          <button
                            onClick={handleOpenCreate}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow"
                          >
                            + Add Your First Supplier
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => {
                    const isActive = (s.status || 'Active') === 'Active';
                    const initials = s.name ? s.name.substring(0, 2).toUpperCase() : 'SP';

                    return (
                      <tr key={s._id || s.id} className="transition hover:bg-slate-50/70">
                        {/* Company Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-xs font-bold text-white shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{s.name}</p>
                              {s.taxId && <p className="text-xs font-mono text-slate-400">Tax ID: {s.taxId}</p>}
                            </div>
                          </div>
                        </td>

                        {/* Contact Person */}
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {s.contactName || <span className="text-xs text-slate-400 italic">Not specified</span>}
                        </td>

                        {/* Contact info */}
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            {s.email && (
                              <p className="text-xs text-slate-600">
                                <Mail className="mr-1 inline h-3.5 w-3.5 text-slate-400" /><a href={`mailto:${s.email}`} className="text-emerald-700 hover:underline">{s.email}</a>
                              </p>
                            )}
                            {s.phone && (
                              <p className="text-xs text-slate-600">
                                <Phone className="mr-1 inline h-3.5 w-3.5 text-slate-400" /><a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a>
                              </p>
                            )}
                            {!s.email && !s.phone && (
                              <span className="text-xs text-slate-400 italic">No contact info</span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4 text-xs text-slate-600">
                          {s.city || s.country ? (
                            <span>{[s.city, s.country].filter(Boolean).join(', ')}</span>
                          ) : s.address ? (
                            <span className="truncate max-w-[150px] inline-block">{s.address}</span>
                          ) : (
                            <span className="italic text-slate-400">—</span>
                          )}
                        </td>

                        {/* Payment Terms */}
                        <td className="px-5 py-4 text-xs font-medium text-slate-700">
                          <span className="rounded-lg bg-slate-100 px-2 py-1">
                            {s.paymentTerms || 'Net 30'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {s.status || 'Active'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDetails(s)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                              title="View Details"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                              title="Edit Supplier"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenDelete(s)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
                              title="Delete Supplier"
                            >
                              Delete
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

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
            <span>Showing {filteredSuppliers.length} of {suppliers.length} suppliers</span>
            <span>Vendor profiles managed securely</span>
          </div>
        </div>
      </section>

      {/* Supplier Form Modal (Create & Edit) */}
      {formModalOpen && (
        <SupplierFormModal
          initialData={editingSupplier}
          onClose={() => {
            setFormModalOpen(false);
            setEditingSupplier(null);
          }}
          onSuccess={handleSaveSuccess}
        />
      )}

      {/* Supplier Profile Details Drawer / Modal */}
      {detailsModalOpen && activeSupplierDetails && (
        <SupplierDetailsModal
          supplier={activeSupplierDetails}
          onClose={() => {
            setDetailsModalOpen(false);
            setActiveSupplierDetails(null);
          }}
          onEdit={() => {
            setDetailsModalOpen(false);
            handleOpenEdit(activeSupplierDetails);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && supplierToDelete && (
        <DeleteConfirmModal
          supplier={supplierToDelete}
          deleting={deleting}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setSupplierToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </ModuleLayout>
  );
}

function SupplierStatCard({ label, value, subtitle, accent, icon }) {
  const Icon = icon;
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl border text-sm ${styles[accent]}`}>
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

function SupplierFormModal({ initialData, onClose, onSuccess }) {
  const isEdit = Boolean(initialData?._id || initialData?.id);
  const supplierId = initialData?._id || initialData?.id;

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    contactName: initialData?.contactName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    country: initialData?.country || '',
    paymentTerms: initialData?.paymentTerms || 'Net 30',
    taxId: initialData?.taxId || '',
    status: initialData?.status || 'Active',
    notes: initialData?.notes || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      return setError('Supplier name is required.');
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      return setError('Please enter a valid email address.');
    }

    setSubmitting(true);
    setError(null);

    try {
      let result;
      if (isEdit) {
        result = await apiFetch(`/suppliers/${supplierId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        result = await apiFetch('/suppliers', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }

      onSuccess(result || formData, isEdit);
    } catch (err) {
      setError(err.message || 'Failed to save supplier details.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEdit ? 'Edit Supplier Profile' : 'Add New Supplier'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEdit ? 'Update vendor credentials and terms' : 'Register a new supplier for purchasing & inventory'}
            </p>
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

          {/* Company Name & Contact Person */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Wholesale Foods"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Primary Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={formData.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <input
                type="email"
                placeholder="orders@supplier.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 234-5678"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Street Address
            </label>
            <input
              type="text"
              placeholder="123 Industrial Parkway, Suite 400"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* City & Country */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                City / State
              </label>
              <input
                type="text"
                placeholder="Chicago, IL"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Country
              </label>
              <input
                type="text"
                placeholder="United States"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Terms, Tax ID, Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Advance">100% Advance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tax / VAT ID
              </label>
              <input
                type="text"
                placeholder="TAX-892301"
                value={formData.taxId}
                onChange={(e) => handleChange('taxId', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Account Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Internal Notes / Special Instructions
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Free shipping on orders over $500. Direct contact for meat & poultry deliveries."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
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
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SupplierDetailsModal({ supplier, onClose, onEdit }) {
  const purchaseOrders = supplier?.purchaseOrders || [];
  const products = supplier?.products || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-md shadow-emerald-200">
              {supplier.name?.substring(0, 2).toUpperCase() || 'SP'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{supplier.name}</h3>
              <p className="text-xs text-slate-500">Registered Vendor Profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Key Info Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</span>
              <p className="mt-1 font-bold text-slate-800">{supplier.status || 'Active'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Payment Terms</span>
              <p className="mt-1 font-bold text-slate-800">{supplier.paymentTerms || 'Net 30'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tax ID</span>
              <p className="mt-1 font-bold text-slate-800">{supplier.taxId || '—'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">PO Orders</span>
              <p className="mt-1 font-bold text-emerald-700">{purchaseOrders.length} placed</p>
            </div>
          </div>

          {/* Contact & Location Details */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact & Address</h4>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-slate-700">
              <div>
                <span className="text-xs text-slate-400">Contact Person:</span>
                <p className="font-semibold text-slate-900">{supplier.contactName || 'Not specified'}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked products</h4>
                  <span className="text-xs font-semibold text-emerald-700">{products.length} products</span>
                </div>
                {products.length > 0 ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {products.map((product) => (
                      <div key={product._id} className="rounded-xl bg-slate-50 p-3">
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{product.sku} · Stock {product.stock ?? 0}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-3 text-sm text-slate-500">No products are linked to this supplier yet.</p>}
              </div>
              <div>
                <span className="text-xs text-slate-400">Email Address:</span>
                <p className="font-semibold">
                  {supplier.email ? (
                    <a href={`mailto:${supplier.email}`} className="text-emerald-600 hover:underline">{supplier.email}</a>
                  ) : '—'}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Phone Number:</span>
                <p className="font-semibold">
                  {supplier.phone ? (
                    <a href={`tel:${supplier.phone}`} className="text-slate-800 hover:underline">{supplier.phone}</a>
                  ) : '—'}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Address / Location:</span>
                <p className="font-semibold text-slate-900">
                  {[supplier.address, supplier.city, supplier.country].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {supplier.notes && (
            <div className="rounded-2xl bg-amber-50/60 border border-amber-100 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">Special Notes / Terms</h4>
              <p className="mt-1 text-sm text-amber-950">{supplier.notes}</p>
            </div>
          )}

          {/* Recent Purchase Orders */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Purchase Orders</h4>
            {purchaseOrders.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400 italic">No purchase orders recorded for this supplier yet.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {purchaseOrders.map((po) => (
                  <div key={po._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{po.poNumber || 'PO'}</span>
                      <span className="ml-2 text-slate-400">{new Date(po.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800">${Number(po.total || 0).toFixed(2)}</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                        {po.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-500"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ supplier, deleting, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-2xl text-rose-600">
          🗑️
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">Delete Supplier?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Are you sure you want to remove <strong className="text-slate-900">{supplier.name}</strong> from your supplier directory? This action cannot be undone.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:bg-rose-500 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Supplier'}
          </button>
        </div>
      </div>
    </div>
  );
}
