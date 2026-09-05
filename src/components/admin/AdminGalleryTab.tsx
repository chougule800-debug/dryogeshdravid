import React, { useState } from 'react';
import { GalleryItem } from '../../types';
import { 
  Images, 
  Plus, 
  Trash2, 
  Upload, 
  Edit3, 
  Check, 
  X, 
  CheckCircle, 
  Filter,
  Loader2,
  Cloud
} from 'lucide-react';
import { uploadFileToStorage } from '../../services/supabaseService';

interface AdminGalleryTabProps {
  galleryItems: GalleryItem[];
  onAddGalleryItem: (item: GalleryItem) => void;
  onUpdateGalleryItem: (item: GalleryItem) => void;
  onDeleteGalleryItem: (id: string) => void;
}

export const AdminGalleryTab: React.FC<AdminGalleryTabProps> = ({
  galleryItems,
  onAddGalleryItem,
  onUpdateGalleryItem,
  onDeleteGalleryItem,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<GalleryItem['category']>('Clinic');
  const [formImg, setFormImg] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formDate, setFormDate] = useState('Belgaum Clinic');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image exceeds 5MB limit.');
        return;
      }
      setIsUploading(true);
      try {
        const url = await uploadFileToStorage(file, 'gallery');
        if (url) {
          setFormImg(url);
          showSuccess('Image uploaded to Supabase Storage!');
        }
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Image upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleStartEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setIsAddingNew(false);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormImg(item.imageUrl);
    setFormCaption(item.caption);
    setFormDate(item.date || 'Belgaum Clinic');
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setIsAddingNew(true);
    setFormTitle('');
    setFormCategory('Clinic');
    setFormImg('https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=900');
    setFormCaption('');
    setFormDate('Belgaum Clinic');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formImg) {
      alert('Please provide photo title and image.');
      return;
    }

    if (editingId) {
      const updated: GalleryItem = {
        id: editingId,
        title: formTitle.trim(),
        category: formCategory,
        imageUrl: formImg,
        caption: formCaption.trim(),
        date: formDate.trim(),
      };
      const ok = await onUpdateGalleryItem(updated);
      if (!ok) {
        alert('Failed to save item. Please try again.');
        return;
      }
      showSuccess(`Photo "${formTitle}" updated!`);
    } else {
      const newItem: GalleryItem = {
        id: `gal-${Date.now().toString().slice(-4)}`,
        title: formTitle.trim(),
        category: formCategory,
        imageUrl: formImg,
        caption: formCaption.trim(),
        date: formDate.trim(),
      };
      const ok = await onAddGalleryItem(newItem);
      if (!ok) {
        alert('Failed to add item. Please try again.');
        return;
      }
      showSuccess(`New photo "${formTitle}" added to gallery!`);
    }

    setEditingId(null);
    setIsAddingNew(false);
  };

  const filteredItems = galleryItems.filter((item) =>
    categoryFilter === 'all' || item.category === categoryFilter
  );

  return (
    <div className="p-6 overflow-y-auto space-y-6 flex-1">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Images className="w-5 h-5 text-[#2D5A50]" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif-display">
              Clinic Photo Gallery & Facilities
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Upload pictures of clinical chambers, pharmacy laboratory, academic faculty seminars, and Goa visiting clinics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleStartAdd}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Photo</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add / Edit Form */}
      {(isAddingNew || editingId) && (
        <div className="p-6 rounded-3xl bg-slate-50 border-2 border-emerald-300/80 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#2D5A50]" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
                {isAddingNew ? 'Upload & Add New Gallery Photo' : 'Edit Gallery Photo'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => { setEditingId(null); setIsAddingNew(false); }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Photo Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Belgaum Consultation Chamber & Classical Repertory"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Clinic">Clinic</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Academic">Academic</option>
                  <option value="Events">Events</option>
                </select>
              </div>
            </div>

            {/* Photo Upload & Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={formImg} alt="Preview" className="w-full h-full object-cover" />
              </div>

              <div className="sm:col-span-2 space-y-3 flex flex-col justify-center">
                <label className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[#2D5A50] font-bold text-xs border border-emerald-200 cursor-pointer ${
                  isUploading ? 'bg-emerald-100 opacity-80 cursor-wait' : 'bg-emerald-50 hover:bg-emerald-100'
                }`}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#2D5A50]" />
                      <span>Uploading to Supabase Storage...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 text-[#2D5A50]" />
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" disabled={isUploading} onChange={handleFileUpload} className="hidden" />
                </label>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Or Image URL:</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formImg}
                    onChange={(e) => setFormImg(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Photo Description / Caption</label>
                <input
                  type="text"
                  placeholder="Detailed description of facility, pharmacy equipment, or consultation..."
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location / Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Belgaum Clinic or Goa Branch"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Save Photo Changes' : 'Publish to Gallery'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setEditingId(null); setIsAddingNew(false); }}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
            Listed Gallery Photos ({filteredItems.length})
          </h4>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">All Categories</option>
              <option value="Clinic">Clinic</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Consultation">Consultation</option>
              <option value="Academic">Academic</option>
              <option value="Events">Events</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredItems.length === 0 && (
            <div className="sm:col-span-2 md:col-span-3 p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">No gallery photos yet.</p>
              <p className="text-xs text-slate-400 mt-1">Add a photo to display it on the website gallery.</p>
            </div>
          )}
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs overflow-hidden flex flex-col justify-between"
            >
              <div className="relative h-36 bg-slate-100">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-[#0f2420]/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                  {item.category}
                </span>
              </div>

              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{item.title}</h5>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{item.caption}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400 font-medium">{item.date || 'Belgaum'}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="p-1 rounded text-slate-500 hover:text-[#2D5A50] hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(`Delete photo "${item.title}"?`)) {
                          const ok = await onDeleteGalleryItem(item.id);
                          if (!ok) alert('Failed to delete item. Please try again.');
                          else showSuccess('Photo removed.');
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
