import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  Leaf,
  Calendar,
  Phone
} from 'lucide-react';
import heroBannerImg from '../assets/images/homeopathy_hero_complete_banner_1787275899662.jpg';

interface HeroSectionProps {
  onBookAppointment: () => void;
  onExploreCases: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onBookAppointment,
}) => {
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-[#f3f7f4] via-[#f7faf8] to-[#fcfbf8] pt-1.5 pb-6 sm:pt-3 sm:pb-8">
      {/* Soft natural botanical ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-teal-50/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-2 sm:space-y-2.5">
        {/* Main Hero Graphic Banner (Placed directly below menu bar) */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-emerald-900/10 bg-white group min-h-[180px] sm:min-h-[280px] lg:min-h-[380px]">
          <img
            src={heroBannerImg || '/hero-banner.jpg'}
            alt="Natural Healing Homeopathy - Gentle, safe and effective treatment with Natural & Safe, Holistic Approach, Individualized Care"
            className="w-full h-auto max-h-[85vh] object-cover block transform group-hover:scale-[1.008] transition-transform duration-700"
            referrerPolicy="no-referrer"
            loading="eager"
            onError={(e) => {
              // Fallback to public path if module resolution fails in preview
              const target = e.currentTarget;
              if (target.src !== window.location.origin + '/hero-banner.jpg') {
                target.src = '/hero-banner.jpg';
              }
            }}
          />
        </div>

        {/* Action Buttons Strip - Reduced spacing */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-0.5">
          <button
            id="hero-book-appointment-btn"
            onClick={onBookAppointment}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 sm:py-3 rounded-full bg-[#335e35] hover:bg-[#284c2a] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all active:scale-98 cursor-pointer group"
          >
            <Calendar className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Book an Appointment</span>
          </button>

          <a
            href="tel:8762465349"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-full bg-white hover:bg-emerald-50 text-[#284c2a] font-semibold text-xs sm:text-sm border border-emerald-700/25 shadow-2xs transition-all"
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#335e35]" />
            <span>Clinic Helpline: +91 8762465349</span>
          </a>
        </div>

        {/* Bottom Feature Strip - Compact Ribbon */}
        <div className="bg-gradient-to-r from-white via-[#f4f9f5] to-white backdrop-blur-md rounded-xl lg:rounded-full p-2 sm:px-5 sm:py-2.5 shadow-2xs border border-emerald-800/15">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 divide-y sm:divide-y-0 sm:divide-x divide-emerald-900/10 items-center">
            
            {/* Item 1: 100% Natural Treatment */}
            <div className="flex items-center justify-center lg:justify-start gap-2 py-0.5 sm:py-0 sm:px-2.5 first:pl-1 group">
              <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-[#335e35] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                <Leaf className="w-3.5 h-3.5 text-[#335e35]" strokeWidth={2.2} />
              </div>
              <p className="text-xs whitespace-nowrap">
                <span className="font-bold text-slate-900">100% Natural</span>{' '}
                <span className="font-semibold text-[#335e35]">Treatment</span>
              </p>
            </div>

            {/* Item 2: Safe for All Age Groups */}
            <div className="flex items-center justify-center lg:justify-start gap-2 pt-1.5 sm:pt-0 sm:px-2.5 group">
              <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-[#335e35] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-3.5 h-3.5 text-[#335e35]" strokeWidth={2.2} />
              </div>
              <p className="text-xs whitespace-nowrap">
                <span className="font-bold text-slate-900">Safe for All</span>{' '}
                <span className="font-semibold text-[#335e35]">Age Groups</span>
              </p>
            </div>

            {/* Item 3: Treats Root Cause, Not Just Symptoms */}
            <div className="flex items-center justify-center lg:justify-start gap-2 pt-1.5 sm:pt-0 sm:px-2.5 group">
              <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-[#335e35] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                <Sparkles className="w-3.5 h-3.5 text-[#335e35]" strokeWidth={2.2} />
              </div>
              <p className="text-xs whitespace-nowrap">
                <span className="font-bold text-slate-900">Treats Root Cause,</span>{' '}
                <span className="font-semibold text-[#335e35]">Not Just Symptoms</span>
              </p>
            </div>

            {/* Item 4: Trusted Care, Better Living */}
            <div className="flex items-center justify-center lg:justify-start gap-2 pt-1.5 sm:pt-0 sm:px-2.5 group">
              <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-[#335e35] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                <Heart className="w-3.5 h-3.5 text-[#335e35]" strokeWidth={2.2} />
              </div>
              <p className="text-xs whitespace-nowrap">
                <span className="font-bold text-slate-900">Trusted Care,</span>{' '}
                <span className="font-semibold text-[#335e35]">Better Living</span>
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

