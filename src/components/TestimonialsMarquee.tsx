import React, { useState } from 'react';
import { Testimonial } from '../types';
import { 
  Sparkles, 
  Star, 
  Quote, 
  Heart, 
  CheckCircle2, 
  Pause, 
  Play, 
  ArrowLeftRight,
  ShieldCheck
} from 'lucide-react';

interface TestimonialsMarqueeProps {
  testimonials: Testimonial[];
  onOpenBooking?: () => void;
  loading: boolean;
  error?: string | null;
}

export const TestimonialsMarquee: React.FC<TestimonialsMarqueeProps> = ({
  testimonials,
  onOpenBooking,
  loading,
  error,
}) => {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate list to create a seamless infinite loop in both directions
  const marqueeItems = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="py-10 sm:py-14 bg-white border-b border-stone-200 overflow-hidden relative">
      {/* Background Subtle Accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-50/50 via-white to-stone-50/30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#1C3F3A] text-xs font-bold uppercase tracking-wider border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-[#1C3F3A]" />
              <span className="text-[#1C3F3A]">Patient Experiences &amp; Testimonials</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight font-serif-display">
              Real Words of Healing &amp; Recovery
            </h2>
            <p className="text-xs sm:text-sm text-stone-800 font-medium">
              Verified clinical outcomes and patient recovery journeys from Belgaum, Goa, and Maharashtra.
            </p>
          </div>

          {/* Quick Interaction Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-900 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-800 fill-emerald-800" /> : <Pause className="w-3.5 h-3.5 text-stone-800" />}
              <span>{isPaused ? 'Resume Flow' : 'Pause on Hover'}</span>
            </button>

            {onOpenBooking && (
              <button
                onClick={onOpenBooking}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Book Consultation</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Marquee Row 1: Flowing Left to Right */}
      <div className="relative w-full overflow-hidden py-2">
        {error && (
          <div className="mx-auto max-w-xl p-8 rounded-3xl bg-stone-50 border border-stone-200 text-center">
            <p className="text-sm text-slate-500 font-semibold">Unable to load testimonials from the server. Please try again.</p>
          </div>
        )}
        {!error && loading && testimonials.length === 0 && (
          <div className="mx-auto max-w-xl p-8 rounded-3xl bg-stone-50 border border-stone-200 text-center">
            <p className="text-sm text-slate-500 font-semibold animate-pulse">Loading testimonials...</p>
          </div>
        )}
        {!error && !loading && testimonials.length === 0 && (
          <div className="mx-auto max-w-xl p-8 rounded-3xl bg-stone-50 border border-stone-200 text-center">
            <p className="text-sm text-slate-500 font-semibold">No testimonials available yet.</p>
          </div>
        )}
        {!error && !loading && testimonials.length > 0 && <>
        {/* Soft edge gradients */}
        <div className="absolute top-0 left-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div 
          className={`animate-marquee-ltr flex gap-5 items-stretch ${isPaused ? '[animation-play-state:paused]' : ''}`}
        >
          {marqueeItems.map((t, idx) => (
            <div
              key={`${t.id}-ltr-${idx}`}
              className="w-[320px] sm:w-[380px] shrink-0 p-5 rounded-2xl bg-[#FAF8F5] border border-stone-300 shadow-2xs flex flex-col justify-between space-y-3 hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-800" />
                    <span>Verified Patient</span>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-emerald-950 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-md w-max max-w-full truncate">
                  {t.condition}
                </div>

                <p className="text-xs text-stone-900 leading-relaxed italic line-clamp-4 font-normal">
                  "{t.comment}"
                </p>
              </div>

              <div className="pt-2.5 border-t border-stone-300 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-stone-950 flex items-center gap-1">
                    <span>{t.patientName}</span>
                  </div>
                  <div className="text-stone-800 text-[11px] font-medium">{t.location}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-950 bg-stone-100 px-2 py-0.5 rounded border border-stone-300">
                    {t.treatmentDuration || 'Constitutional Care'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>}
      </div>

      {/* Marquee Row 2: Subtle Alternate Flowing Row for Visual Richness */}
      <div className="relative w-full overflow-hidden pt-3">
        {/* Soft edge gradients */}
        <div className="absolute top-0 left-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div 
          className={`animate-marquee-rtl flex gap-5 items-stretch ${isPaused ? '[animation-play-state:paused]' : ''}`}
        >
          {marqueeItems.slice().reverse().map((t, idx) => (
            <div
              key={`${t.id}-rtl-${idx}`}
              className="w-[300px] sm:w-[360px] shrink-0 p-4.5 rounded-2xl bg-white border border-stone-300 shadow-2xs flex flex-col justify-between space-y-2.5 hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-4 h-4 text-[#1C3F3A]/50" />
                </div>

                <div className="text-[11px] font-bold text-teal-950 bg-teal-50 border border-teal-300 px-2 py-0.5 rounded-md w-max max-w-full truncate">
                  {t.condition}
                </div>

                <p className="text-[11.5px] text-stone-900 leading-relaxed italic line-clamp-3 font-normal">
                  "{t.comment}"
                </p>
              </div>

              <div className="pt-2 border-t border-stone-300 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-stone-950 text-xs">{t.patientName}</div>
                  <div className="text-stone-800 text-[10.5px] font-medium">{t.location}</div>
                </div>
                <span className="text-[10px] text-stone-800 font-bold">
                  {t.treatedBy || 'Dr. Yogesh Dravid'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
