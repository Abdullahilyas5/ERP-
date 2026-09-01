'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';
import { useToast } from '../components/ToastProvider';
import {
  Newspaper,
  Plus,
  Search,
  Pin,
  Eye,
  Calendar,
  Tag,
  Edit,
  Trash2,
  Sparkles,
  Megaphone,
  Percent,
  BellRing,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  Layers,
} from 'lucide-react';

const COVER_PRESETS = [
  { label: 'Supermarket Interior', url: '/images/supermarket_hero.jpg' },
  { label: 'Fresh Organic Produce', url: '/images/fresh_produce.jpg' },
  { label: 'POS Retail Checkout', url: '/images/pos_checkout.jpg' },
];

export default function CMSPage() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activePreviewPost, setActivePreviewPost] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadPosts(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiFetch('/posts');
      const items = Array.isArray(res) ? res : (res?.posts || []);
      setPosts(items);
    } catch (err) {
      console.error('Failed to load posts:', err);
      toast.error('Load Error', err.message || 'Failed to fetch CMS posts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.content && p.content.toLowerCase().includes(q)) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)));

      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchStatus = selectedStatus === 'All' || p.status === selectedStatus;

      return matchSearch && matchCat && matchStatus;
    });
  }, [posts, search, selectedCategory, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.status === 'Published').length;
    const promotions = posts.filter((p) => p.category === 'Promotion' || p.category === 'Weekly Deals').length;
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    return { total, published, promotions, totalViews };
  }, [posts]);

  function handleOpenCreate() {
    setEditingPost(null);
    setFormOpen(true);
  }

  function handleOpenEdit(post) {
    setEditingPost(post);
    setFormOpen(true);
  }

  function handleOpenPreview(post) {
    setActivePreviewPost(post);
    setPreviewOpen(true);
  }

  function handleOpenDelete(post) {
    setPostToDelete(post);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/posts/${postToDelete._id || postToDelete.id}`, {
        method: 'DELETE',
      });
      toast.success('Post Deleted', `"${postToDelete.title}" was removed.`);
      setDeleteConfirmOpen(false);
      setPostToDelete(null);
      loadPosts(true);
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Could not delete post.');
    } finally {
      setDeleting(false);
    }
  }

  function handleSaveSuccess(savedPost, isEdit) {
    setFormOpen(false);
    setEditingPost(null);
    toast.success(
      isEdit ? 'Article Updated' : 'Article Published',
      `"${savedPost.title}" has been saved.`
    );
    loadPosts(true);
  }

  return (
    <ModuleLayout
      title="Store CMS & Marketing Portal"
      subtitle="Publish customer announcements, weekly specials, store news flyers, and promotional campaigns."
      allowedRoles={['owner', 'admin', 'manager']}
      headerActions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadPosts(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <span className={`inline-block text-base ${refreshing ? 'animate-spin' : ''}`}>↻</span>
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Create Article / Deal</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <CMSStatCard
            label="Total Posts Created"
            value={stats.total}
            subtitle="Articles & announcements"
            icon={FileText}
            accent="emerald"
          />
          <CMSStatCard
            label="Published & Live"
            value={stats.published}
            subtitle="Visible on store displays"
            icon={CheckCircle2}
            accent="sky"
          />
          <CMSStatCard
            label="Active Deals & Promos"
            value={stats.promotions}
            subtitle="Weekly store discounts"
            icon={Percent}
            accent="amber"
          />
          <CMSStatCard
            label="Total Read Views"
            value={stats.totalViews.toLocaleString()}
            subtitle="Customer engagement"
            icon={Eye}
            accent="purple"
          />
        </div>

        {/* Featured Store Banner Widget */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-lg text-white">
          <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: "url('/images/supermarket_hero.jpg')" }}></div>
          <div className="relative z-10 flex flex-col justify-between p-6 md:flex-row md:items-center md:p-8">
            <div className="max-w-xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-300 border border-emerald-400/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  Store Content Hub
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Supermarket Announcements & Flyer Manager
              </h2>
              <p className="text-sm text-slate-300">
                Keep customers and supermarket staff aligned with real-time promotions, holiday schedules, supply notices, and seasonal discount campaigns.
              </p>
            </div>
            <div className="mt-4 flex shrink-0 items-center gap-3 md:mt-0">
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                <Megaphone className="h-4 w-4" />
                <span>Publish New Notice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search posts by headline, tags, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Announcement">Announcements</option>
                <option value="Promotion">Promotions</option>
                <option value="Weekly Deals">Weekly Deals</option>
                <option value="Store News">Store News</option>
                <option value="Notice">Operational Notices</option>
                <option value="Event">Special Events</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin text-lg">↻</span>
              <span>Loading store publications...</span>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <Newspaper className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-800">No publications found</h3>
            <p className="mt-1 text-xs text-slate-400">
              {search || selectedCategory !== 'All' ? 'Try adjusting your search criteria.' : 'Create your first store post or flyer announcement.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Post</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const isPinned = Boolean(post.pinned);
              const isPublished = post.status === 'Published';
              const cover = post.coverImage || '/images/supermarket_hero.jpg';

              let catBadgeStyle = 'bg-slate-100 text-slate-700';
              if (post.category === 'Promotion' || post.category === 'Weekly Deals') catBadgeStyle = 'bg-amber-100 text-amber-900 border-amber-200';
              else if (post.category === 'Announcement') catBadgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-200';
              else if (post.category === 'Notice') catBadgeStyle = 'bg-rose-100 text-rose-900 border-rose-200';

              return (
                <div
                  key={post._id || post.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition hover:shadow-md hover:border-slate-300"
                >
                  {/* Cover Image Header */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={cover}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = '/images/supermarket_hero.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

                    {/* Category & Pin Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${catBadgeStyle}`}>
                        {post.category || 'General'}
                      </span>
                      {isPinned && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-950 shadow">
                          <Pin className="h-3 w-3" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                          isPublished
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-slate-700/90 text-slate-200'
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="line-clamp-2 text-base font-black text-white drop-shadow">
                        {post.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <p className="line-clamp-3 text-xs text-slate-600 leading-relaxed">
                        {post.excerpt || post.content}
                      </p>

                      {/* Tags */}
                      {Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {post.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              <Tag className="h-2.5 w-2.5 text-slate-400" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Metadata Footer */}
                    <div className="mt-5 border-t border-slate-100 pt-3.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views || 0} views
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenPreview(post)}
                          className="flex-1 rounded-xl border border-slate-200 bg-white py-1.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleOpenEdit(post)}
                          className="rounded-xl border border-slate-200 bg-white p-1.5 text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                          title="Edit Post"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(post)}
                          className="rounded-xl border border-slate-200 bg-white p-1.5 text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
                          title="Delete Post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Editor Modal */}
      {formOpen && (
        <PostEditorModal
          initialData={editingPost}
          onClose={() => {
            setFormOpen(false);
            setEditingPost(null);
          }}
          onSuccess={handleSaveSuccess}
        />
      )}

      {/* Post Preview Modal */}
      {previewOpen && activePreviewPost && (
        <PostPreviewModal
          post={activePreviewPost}
          onClose={() => {
            setPreviewOpen(false);
            setActivePreviewPost(null);
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmOpen && postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Delete Publication?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{postToDelete.title}</strong>? This announcement will be removed from all store displays.
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
                {deleting ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
}

function CMSStatCard({ label, value, subtitle, icon: Icon, accent }) {
  const accentStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
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

function PostEditorModal({ initialData, onClose, onSuccess }) {
  const isEdit = Boolean(initialData?._id || initialData?.id);
  const postId = initialData?._id || initialData?.id;

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'Announcement',
    status: initialData?.status || 'Published',
    coverImage: initialData?.coverImage || '/images/supermarket_hero.jpg',
    excerpt: initialData?.excerpt || '',
    content: initialData?.content || '',
    tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : (initialData?.tags || ''),
    pinned: Boolean(initialData?.pinned),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) return setError('Title is required.');
    if (!formData.content.trim()) return setError('Content is required.');

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      let res;
      if (isEdit) {
        res = await apiFetch(`/posts/${postId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch('/posts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      onSuccess(res || formData, isEdit);
    } catch (err) {
      setError(err.message || 'Failed to save post.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEdit ? 'Edit Publication' : 'Draft New Store Announcement / Deal'}
            </h3>
            <p className="text-xs text-slate-500">Configure content headline, category, cover artwork and tags</p>
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

          {/* Headline */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Headline Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Weekend Mega Sale: 30% Off All Fresh Gourmet Cheeses"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category & Status & Pinned */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Announcement">Store Announcement</option>
                <option value="Promotion">Promotional Discount</option>
                <option value="Weekly Deals">Weekly Deals Flyer</option>
                <option value="Store News">Supermarket News</option>
                <option value="Notice">Operational Notice</option>
                <option value="Event">Special Event</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Published">Published (Live)</option>
                <option value="Draft">Draft (Hidden)</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={formData.pinned}
                  onChange={(e) => handleChange('pinned', e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Pin className="h-3.5 w-3.5 text-amber-600" />
                <span>Pin to Store Banner</span>
              </label>
            </div>
          </div>

          {/* Cover Image Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cover Image Artwork
            </label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => handleChange('coverImage', preset.url)}
                  className={`overflow-hidden rounded-xl border text-left transition ${
                    formData.coverImage === preset.url
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="h-16 w-full object-cover" />
                  <p className="p-1.5 text-[10px] font-semibold text-slate-700 truncate">{preset.label}</p>
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or enter custom image URL"
              value={formData.coverImage}
              onChange={(e) => handleChange('coverImage', e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Brief Excerpt / Summary (Optional)
            </label>
            <input
              type="text"
              placeholder="A short punchy teaser that appears on the card..."
              value={formData.excerpt}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Main Content */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Full Content Article / Notice <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="6"
              required
              placeholder="Write the full post announcement, product discount details, coupon terms, or store schedule..."
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 leading-relaxed focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tags / Keywords (Comma separated)
            </label>
            <input
              type="text"
              placeholder="Sale, Bakery, Organic, Holiday, Discount"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
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
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PostPreviewModal({ post, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Cover Hero */}
        <div className="relative h-60 w-full overflow-hidden bg-slate-900">
          <img
            src={post.coverImage || '/images/supermarket_hero.jpg'}
            alt={post.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80"
          >
            ✕
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950">
              {post.category}
            </span>
            <h2 className="mt-2 text-2xl font-black text-white drop-shadow">
              {post.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{post.authorName || 'Store Management'}</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-slate-600">
              <Eye className="h-3.5 w-3.5" />
              <span>{post.views || 0} views</span>
            </div>
          </div>

          <div className="prose text-sm leading-relaxed text-slate-700 whitespace-pre-line">
            {post.content}
          </div>

          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-400">Related Tags:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {post.tags.map((t, idx) => (
                  <span key={idx} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
