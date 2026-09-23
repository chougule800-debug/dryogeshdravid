import React, { useState } from 'react';
import { BlogPost, MediaType } from '../../types';
import {
  BookOpen,
  Plus,
  Trash2,
  Upload,
  Edit3,
  Check,
  X,
  CheckCircle,
  Loader2,
  Cloud,
  AlertCircle,
} from 'lucide-react';
import { uploadFileToStorage, validateMediaFile } from '../../services/supabaseService';
import { MediaRenderer, MediaTypeToggle } from '../MediaRenderer';

interface AdminBlogTabProps {
  blogPosts: BlogPost[];
  onAddBlogPost: (post: BlogPost) => Promise<boolean>;
  onUpdateBlogPost: (post: BlogPost) => Promise<boolean>;
  onDeleteBlogPost: (id: string) => Promise<boolean>;
}

export const AdminBlogTab: React.FC<AdminBlogTabProps> = ({
  blogPosts,
  onAddBlogPost,
  onUpdateBlogPost,
  onDeleteBlogPost,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('Prof. Dr. Yogesh Dravid');
  const [formRole, setFormRole] = useState('HOD Physiology, Bharatesh Homoeopathic Medical College');
  const [formCategory, setFormCategory] = useState('Clinical Physiology & Homeopathy');
  const [formMediaType, setFormMediaType] = useState<MediaType>('image');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('Physiology, Constitutional Care, Health');
  const [formReadTime, setFormReadTime] = useState('5 min read');

  const showSuccess = (m: string) => {
    setSuccessMsg(m);
    setTimeout(() => setSuccessMsg(''), 3500);
  };
  const showError = (m: string) => {
    setErrorMsg(m);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const check = validateMediaFile(file, formMediaType);
    if (!check.valid) {
      showError(check.error || 'Invalid file.');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFileToStorage(
        file,
        'blog',
        formMediaType === 'video' ? 'videos' : 'images'
      );
      setFormMediaUrl(url);
      showSuccess(
        `${formMediaType === 'video' ? 'Video' : 'Photo'} uploaded to Supabase Storage.`
      );
    } catch (err: any) {
      console.error('Upload failed:', err);
      showError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setIsAddingNew(false);
    setFormTitle(post.title);
    setFormAuthor(post.author);
    setFormRole(post.authorRole);
    setFormCategory(post.category);
    setFormMediaType(post.mediaType || 'image');
    setFormMediaUrl(post.mediaUrl || '');
    setFormExcerpt(post.excerpt);
    setFormContent(post.content);
    setFormTags(post.tags.join(', '));
    setFormReadTime(post.readTime);
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setIsAddingNew(true);
    setFormTitle('');
    setFormAuthor('Prof. Dr. Yogesh Dravid');
    setFormRole('HOD Physiology, Bharatesh Homoeopathic Medical College');
    setFormCategory('Clinical Physiology & Homeopathy');
    setFormMediaType('image');
    setFormMediaUrl('');
    setFormExcerpt('');
    setFormContent('');
    setFormTags('Physiology, Constitutional Care, Health');
    setFormReadTime('5 min read');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      showError('Please provide a title and article body content.');
      return;
    }
    if (!formMediaUrl) {
      showError('Please upload a cover image or video.');
      return;
    }

    const tagsArray = formTags.split(',').map((t) => t.trim()).filter(Boolean);
    const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const publishedDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (editingId) {
      const updated: BlogPost = {
        id: editingId,
        title: formTitle.trim(),
        slug,
        author: formAuthor.trim(),
        authorRole: formRole.trim(),
        category: formCategory.trim(),
        publishedDate,
        readTime: formReadTime.trim() || '5 min read',
        excerpt: formExcerpt.trim() || formContent.slice(0, 140) + '...',
        content: formContent.trim(),
        mediaType: formMediaType,
        mediaUrl: formMediaUrl,
        tags: tagsArray.length > 0 ? tagsArray : ['Homeopathy'],
      };
      const ok = await onUpdateBlogPost(updated);
      if (!ok) {
        showError('Failed to save article.');
        return;
      }
      showSuccess(`Article "${formTitle}" updated.`);
    } else {
      const created: BlogPost = {
        id: `post-${Date.now().toString().slice(-6)}`,
        title: formTitle.trim(),
        slug,
        author: formAuthor.trim(),
        authorRole: formRole.trim(),
        category: formCategory.trim(),
        publishedDate,
        readTime: formReadTime.trim() || '5 min read',
        excerpt: formExcerpt.trim() || formContent.slice(0, 140) + '...',
        content: formContent.trim(),
        mediaType: formMediaType,
        mediaUrl: formMediaUrl,
        tags: tagsArray.length > 0 ? tagsArray : ['Homeopathy'],
      };
      const ok = await onAddBlogPost(created);
      if (!ok) {
        showError('Failed to publish article.');
        return;
      }
      showSuccess(`New article "${formTitle}" published.`);
    }

    setEditingId(null);
    setIsAddingNew(false);
  };

  return (
    <div className="p-6 overflow-y-auto space-y-6 flex-1">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#2D5A50]" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif-display">
              Clinical Articles &amp; Educational Blog
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Publish clinical articles with either a cover photo or an educational video.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {(isAddingNew || editingId) && (
        <div className="p-6 rounded-3xl bg-slate-50 border-2 border-emerald-300/80 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#2D5A50]" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
                {isAddingNew ? 'Write New Clinical Article' : 'Edit Clinical Article'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setIsAddingNew(false);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Article Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Why Human Physiology is the Foundation of True Constitutional Prescribing"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Clinical Physiology & Homeopathy"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Author Name *</label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Author Academic Role</label>
                <input
                  type="text"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Read Time</label>
                <input
                  type="text"
                  placeholder="e.g. 5 min read"
                  value={formReadTime}
                  onChange={(e) => setFormReadTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Cover Media */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="font-bold text-slate-700 block">Cover Media Type</label>
                <MediaTypeToggle value={formMediaType} onChange={setFormMediaType} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                  {formMediaUrl ? (
                    <MediaRenderer
                      type={formMediaType}
                      url={formMediaUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No media yet
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {formMediaType === 'video' ? 'VIDEO' : 'PHOTO'}
                  </span>
                </div>

                <div className="sm:col-span-2 space-y-3 flex flex-col justify-center">
                  <label
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[#2D5A50] font-bold text-xs border border-emerald-200 cursor-pointer ${
                      isUploading
                        ? 'bg-emerald-100 opacity-80 cursor-wait'
                        : 'bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#2D5A50]" />
                        <span>Uploading {formMediaType === 'video' ? 'video' : 'photo'}...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4 text-[#2D5A50]" />
                        <Upload className="w-4 h-4" />
                        <span>Upload Cover {formMediaType === 'video' ? 'Video' : 'Photo'}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept={formMediaType === 'video' ? 'video/*' : 'image/*'}
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder={`Or Cover ${formMediaType === 'video' ? 'Video' : 'Photo'} URL`}
                    value={formMediaUrl}
                    onChange={(e) => setFormMediaUrl(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Article Excerpt / Summary
              </label>
              <textarea
                rows={2}
                placeholder="Short 2-sentence preview shown on homepage cards..."
                value={formExcerpt}
                onChange={(e) => setFormExcerpt(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Full Article Body Content *
              </label>
              <textarea
                rows={8}
                placeholder="Write full text, insights, headings (### Heading), lists..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white leading-relaxed font-mono text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="Physiology, Constitutional Care, Science, Immunity"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Save Article Changes' : 'Publish Article'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setIsAddingNew(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
          Published Articles ({blogPosts.length})
        </h4>
        <div className="space-y-3">
          {blogPosts.length === 0 && (
            <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">No articles yet.</p>
            </div>
          )}
          {blogPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <MediaRenderer
                    type={post.mediaType}
                    url={post.mediaUrl}
                    className="w-full h-full object-cover"
                    alt={post.title}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                    {post.category} {post.mediaType === 'video' ? '• VIDEO' : ''}
                  </span>
                  <h5 className="font-bold text-sm text-slate-900 line-clamp-1">
                    {post.title}
                  </h5>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{post.author}</span> &bull; <span>{post.publishedDate}</span> &bull;{' '}
                    <span>{post.readTime}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleStartEdit(post)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#2D5A50] font-bold text-xs border border-emerald-200 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`Delete article "${post.title}"?`)) {
                      const ok = await onDeleteBlogPost(post.id);
                      if (!ok) showError('Failed to delete article.');
                      else showSuccess('Article deleted.');
                    }
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};