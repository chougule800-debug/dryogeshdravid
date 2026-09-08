import React, { useState } from 'react';
import { GalleryItem } from '../types';
import { Images, Eye, X, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface GallerySectionProps {
  items: GalleryItem[];
  loading: boolean;
  error?: string | null;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ items, loading, error }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['All', 'Clinic', 'Pharmacy', 'Consultation', 'Academic', 'Events'];

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((i) => i.category === selectedCategory);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextLightbox = () => {
    if (lightboxIndex !== null) setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
  };
  const prevLightbox = () => {
    if (lightboxIndex !== null) setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
  };

  return (
    <section id="gallery" className="py-10 sm:py-14 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#1C3F3A] text-xs font-bold uppercase tracking-wider border border-emerald-300">
            <Images className="w-3.5 h-3.5 text-[#1C3F3A]" />
            <span className="text-[#1C3F3A]">Clinic & Dispensary Tour</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-serif-display">Photo Gallery</h2>
          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
            A glimpse into Dr. Dravid's Homoeopathic Clinic in Vadagaon Belgaum, our dispensary pharmacy, academic lectures, and South Goa consultation centre.
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 flex-wrap mb-6 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#2D5A50] text-white shadow-xs'
                  : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              {cat === 'All' ? 'All Photos' : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {error && (
            <div className="col-span-full p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">Unable to load gallery photos from the server. Please try again.</p>
            </div>
          )}
          {!error && loading && items.length === 0 && (
            <div className="col-span-full p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold animate-pulse">Loading gallery...</p>
            </div>
          )}
          {!error && !loading && filteredItems.length === 0 && (
            <div className="col-span-full p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">No gallery photos available.</p>
            </div>
          )}
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => openLightbox(index)}
              className="group relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="h-48 sm:h-64 lg:h-72 w-full overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 sm:p-5 text-white">
                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-800/90 text-emerald-100 w-max mb-1 backdrop-blur-xs border border-emerald-500/30">{item.category}</span>
                <h4 className="text-sm sm:text-base font-bold font-serif-display leading-tight">{item.title}</h4>
                <p className="text-[10px] sm:text-xs text-slate-200 mt-1 line-clamp-2">{item.caption}</p>
                {item.date && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-300 mt-2">
                    <MapPin className="w-3 h-3" />
                    <span>{item.date}</span>
                  </div>
                )}
              </div>
              <div className="absolute top-3 right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
          ))}
        </div>

        {lightboxIndex !== null && filteredItems[lightboxIndex] && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <button onClick={closeLightbox} className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={prevLightbox} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={nextLightbox} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center">
              <div className="rounded-2xl overflow-hidden shadow-2xl max-h-[60vh] border border-white/20">
                <img src={filteredItems[lightboxIndex].imageUrl} alt={filteredItems[lightboxIndex].title} className="max-h-[60vh] w-auto object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="text-center text-white mt-3 sm:mt-4 space-y-1 max-w-xl px-2">
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 uppercase">{filteredItems[lightboxIndex].category}</span>
                <h3 className="text-lg sm:text-xl font-bold font-serif-display">{filteredItems[lightboxIndex].title}</h3>
                <p className="text-[10px] sm:text-sm text-slate-300">{filteredItems[lightboxIndex].caption}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};