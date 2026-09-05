import React, { useState } from 'react';
import { PrePostCase } from '../types';
import { Sparkles, Calendar } from 'lucide-react';

interface PrePostGalleryProps {
  cases: PrePostCase[];
  onOpenBooking: () => void;
  loading: boolean;
  error?: string | null;
}

export const PrePostGallery: React.FC<PrePostGalleryProps> = ({ cases, onOpenBooking, loading, error }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sliderPositions, setSliderPositions] = useState<{ [key: string]: number }>({});

  const categories = ['All', 'Skin', 'Hair', 'Pediatric'];

  const filteredCases = selectedCategory === 'All'
    ? cases
    : cases.filter((c) => c.category === selectedCategory);

  const getSliderPos = (id: string) => {
    return sliderPositions[id] !== undefined ? sliderPositions[id] : 50;
  };

  const setSliderPos = (id: string, val: number) => {
    setSliderPositions((prev) => ({ ...prev, [id]: val }));
  };

  return (
    <section id="pre-post" className="py-10 sm:py-14 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#1C3F3A] text-xs font-bold uppercase tracking-wider border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-[#1C3F3A]" />
            <span className="text-[#1C3F3A]">Clinical Results</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-serif-display">
            Pre &amp; Post Treatment Results
          </h2>
          <p className="text-xs sm:text-sm text-slate-800 font-medium">
            Slide the divider to compare Before &amp; After clinical recovery.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#2D5A50] text-white shadow-xs'
                  : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              {cat === 'All' ? 'All Results' : `${cat}`}
            </button>
          ))}
        </div>

        {/* Pure Image Grid (Only Images & Title Tag, No heavy clinical text/details) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
              <div
                key={caseItem.id}
                id={`case-card-${caseItem.id}`}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Interactive Pure Image Slider */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900 select-none group">
                  {/* After Image */}
                  <img
                    src={caseItem.afterImage}
                    alt={`${caseItem.title} After`}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-200 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs z-10 border border-emerald-500/30">
                    After
                  </div>

                  {/* Before Image (Clipped overlay) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${pos}%` }}
                  >
                    <img
                      src={caseItem.beforeImage}
                      alt={`${caseItem.title} Before`}
                      className="absolute inset-0 w-full h-full object-cover max-w-none"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-950/80 text-slate-200 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs z-10 border border-slate-700/50">
                      Before
                    </div>
                  </div>

                  {/* Slider Divider Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 shadow-md flex items-center justify-center"
                    style={{ left: `${pos}%` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-white text-[#2D5A50] shadow-md flex items-center justify-center text-[11px] font-bold border border-slate-300">
                      &#8596;
                    </div>
                  </div>

                  {/* Range Input for dragging */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={pos}
                    onChange={(e) => setSliderPos(caseItem.id, Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    aria-label={`Slide to compare before and after for ${caseItem.title}`}
                  />
                </div>

                {/* Minimal Caption Only */}
                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-2 bg-white">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {caseItem.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 truncate max-w-[200px] sm:max-w-[240px]">
                      {caseItem.title}
                    </h3>
                  </div>

                  <button
                    onClick={onOpenBooking}
                    className="px-3 py-1.5 rounded-full bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-colors"
                  >
                    Consult
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
