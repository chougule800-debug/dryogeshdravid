import React, { useState } from 'react';
import { PrePostCase } from '../types';
import { Sparkles } from 'lucide-react';

interface PrePostGalleryProps {
  cases: PrePostCase[];
  onContactClinic: () => void;
  loading: boolean;
  error?: string | null;
}

export const PrePostGallery: React.FC<PrePostGalleryProps> = ({ cases, onContactClinic, loading, error }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sliderPositions, setSliderPositions] = useState<{ [key: string]: number }>({});

  const categories = ['All', 'Skin', 'Hair', 'Pediatric'];

  const filteredCases = selectedCategory === 'All'
    ? cases
    : cases.filter((c) => c.category === selectedCategory);

  const getSliderPos = (id: string) => sliderPositions[id] !== undefined ? sliderPositions[id] : 50;
  const setSliderPos = (id: string, val: number) => setSliderPositions((prev) => ({ ...prev, [id]: val }));

  return (
    <section id="pre-post" className="py-10 sm:py-14 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#1C3F3A] text-xs font-bold uppercase tracking-wider border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-[#1C3F3A]" />
            <span className="text-[#1C3F3A]">Clinical Results</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-serif-display">
            Pre &amp; Post Treatment Results
          </h2>
          <p className="text-xs sm:text-sm text-slate-800 font-medium">Slide the divider to compare Before &amp; After clinical recovery.</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 flex-wrap mb-6 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#2D5A50] text-white shadow-xs'
                  : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              {cat === 'All' ? 'All Results' : `${cat}`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {error && (
            <div className="col-span-full p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">Unable to load clinical results from the server. Please try again.</p>
            </div>
          )}
          {!error && loading && cases.length === 0 && (
            <div className="col-span-full p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold animate-pulse">Loading clinical results...</p>
            </div>
          )}
          {!error && !loading && filteredCases.length === 0 && (
            <div className="col-span-full p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">No clinical results available.</p>
            </div>
          )}
          {filteredCases.map((caseItem) => {
            const pos = getSliderPos(caseItem.id);
            return (
              <div key={caseItem.id} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
                <div className="relative h-56 sm:h-64 lg:h-72 w-full overflow-hidden bg-slate-900 select-none group">
                  <img src={caseItem.afterImage} alt={`${caseItem.title} After`} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-200 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs z-10 border border-emerald-500/30">After</div>
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
                    <img src={caseItem.beforeImage} alt={`${caseItem.title} Before`} className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-200 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs z-10 border border-slate-700/50">Before</div>
                  </div>
                  <div className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 shadow-md flex items-center justify-center" style={{ left: `${pos}%` }}>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-[#2D5A50] shadow-md flex items-center justify-center text-[10px] sm:text-[11px] font-bold border border-slate-300">&#8596;</div>
                  </div>
                  <input type="range" min="0" max="100" value={pos} onChange={(e) => setSliderPos(caseItem.id, Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" aria-label={`Slide to compare before and after for ${caseItem.title}`} />
                </div>
                <div className="p-3 sm:p-4 flex items-center justify-between gap-2 bg-white">
                  <div>
                    <span className="text-[8px] sm:text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">{caseItem.category}</span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate max-w-[140px] sm:max-w-[200px]">{caseItem.title}</h3>
                  </div>
                  <button onClick={onContactClinic} className="px-2.5 sm:px-3 py-1.5 rounded-full bg-[#2D5A50] hover:bg-[#20423a] text-white text-[10px] sm:text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-colors">Contact Clinic</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};