import React, { useMemo } from 'react';
import { 
  MapPin, Phone, Clock, Calendar, Navigation, CheckCircle2, Building2, AlertCircle
} from 'lucide-react';
import { ClinicBranchId, ClinicLocation } from '../types';

interface ClinicsSectionProps {
  clinics?: ClinicLocation[];
  loading?: boolean;
  error?: string | null;
  onContactClinic: (branchId: ClinicBranchId) => void;
}

export const ClinicsSection: React.FC<ClinicsSectionProps> = ({ 
  clinics = [], 
  loading = false,
  error = null,
  onContactClinic 
}) => {
  // Calculate the next First Sunday of the month for Goa
  const nextFirstSunday = useMemo(() => {
    const today = new Date();
    const findFirstSunday = (year: number, month: number) => {
      for (let day = 1; day <= 7; day++) {
        const date = new Date(year, month, day);
        if (date.getMonth() !== month) break;
        if (date.getDay() === 0) { // Sunday
          return date;
        }
      }
      return null;
    };

    let targetDate = findFirstSunday(today.getFullYear(), today.getMonth());
    // If this month's first Sunday has already passed, get next month's first Sunday
    if (targetDate && targetDate < today) {
      const nextMonth = today.getMonth() + 1;
      const nextYear = nextMonth > 11 ? today.getFullYear() + 1 : today.getFullYear();
      targetDate = findFirstSunday(nextYear, nextMonth % 12);
    }

    if (targetDate) {
      return targetDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return 'First Sunday of Every Month';
  }, []);

  return (
    <section id="clinics" className="py-10 sm:py-14 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#1C3F3A] text-xs font-bold uppercase tracking-wider border border-emerald-300">
            <Building2 className="w-3.5 h-3.5 text-[#1C3F3A]" />
            <span className="text-[#1C3F3A]">Consultation Locations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-serif-display">
            Our Clinics in Belgaum & South Goa
          </h2>
          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
            Visit our primary homoeopathic centre in Belgaum or consult during our specialized monthly clinical visits in Quepem, South Goa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {error && (
            <div className="lg:col-span-2 p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">Unable to load clinics from the server. Please try again.</p>
            </div>
          )}
          {!error && loading && clinics.length === 0 && (
            <div className="lg:col-span-2 p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold animate-pulse">Loading clinic info...</p>
            </div>
          )}
          {!error && !loading && clinics.length === 0 && (
            <div className="lg:col-span-2 p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">No clinic information available.</p>
            </div>
          )}
          {clinics.map((clinic) => {
            const isGoa = clinic.id === 'goa';

            return (
              <div
                key={clinic.id}
                id={`clinic-card-${clinic.id}`}
                className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all ${
                  isGoa
                    ? 'border-amber-200/90 bg-white shadow-sm ring-1 ring-amber-500/20 hover:shadow-md'
                    : 'border-slate-200 bg-white shadow-sm ring-1 ring-emerald-500/20 hover:shadow-md'
                }`}
              >
                {/* Header Banner - more compact on mobile */}
                <div className={`p-4 sm:p-7 ${
                  isGoa 
                    ? 'bg-gradient-to-r from-amber-900 to-amber-950 text-white' 
                    : 'bg-gradient-to-r from-[#2D5A50] to-[#1C3F3A] text-white'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-slate-100">
                      {isGoa ? 'Goa Visiting Centre' : 'Main Belgaum Centre'}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-100 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      {clinic.city}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif-display">{clinic.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium mt-0.5">{clinic.tagline}</p>
                </div>

                <div className="p-4 sm:p-7 space-y-4 sm:space-y-6 flex-1">
                  {/* Goa Special Schedule Notice - updated to First Sunday */}
                  {isGoa && (
                    <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                        <AlertCircle className="w-4 h-4 text-amber-800 shrink-0" />
                        <span>Goa Clinic Schedule Notice:</span>
                      </div>
                      <p className="text-xs leading-relaxed text-amber-950 font-normal">
                        Consultations in Quepem, South Goa are held strictly <strong className="font-bold">Every First Sunday (10:00 AM to 2:00 PM)</strong>.
                      </p>
                      <div className="pt-1 flex items-center gap-2 text-xs font-bold text-amber-950">
                        <Calendar className="w-3.5 h-3.5 text-amber-800" />
                        <span>Next Upcoming Goa Visit: <u>{nextFirstSunday}</u></span>
                      </div>
                    </div>
                  )}

                  {/* Address - compact */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1C3F3A]" />
                      <span className="text-slate-900 font-bold">Address</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{clinic.address}</p>
                    <p className="text-xs text-slate-800 font-normal">
                      Landmark: <span className="font-bold text-slate-950">{clinic.landmark}</span> &bull; <span className="font-medium text-slate-900">{clinic.state}</span>
                    </p>
                  </div>

                  {/* Timings - compact */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#1C3F3A]" />
                      <span className="text-slate-900 font-bold">Timings</span>
                    </div>
                    <div className="space-y-1">
                      {clinic.timings.map((time, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs font-medium text-slate-950 bg-slate-50 p-2 rounded-xl border border-slate-200"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span className="text-slate-950">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact - only phone, no WhatsApp */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#1C3F3A]" />
                      <span className="text-slate-900 font-bold">Contact</span>
                    </div>
                    <a
                      href={`tel:${clinic.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1C3F3A] font-bold text-sm border border-emerald-300 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-emerald-800" />
                      <span>+91 {clinic.phone}</span>
                    </a>
                    {clinic.alternatePhone && (
                      <p className="text-xs text-slate-500">Alternate: {clinic.alternatePhone}</p>
                    )}
                  </div>

                  {/* Map - compact height on mobile */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-28 sm:h-36 relative">
                    <iframe
                      title={`${clinic.name} Map`}
                      src={clinic.googleMapEmbedUrl}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                    <div className="absolute bottom-2 right-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.mapQuery)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 bg-white text-slate-950 rounded-md shadow-xs hover:bg-slate-50 border border-slate-300"
                      >
                        <Navigation className="w-3 h-3 text-[#1C3F3A]" />
                        <span>Directions</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-900 font-semibold text-center sm:text-left">
                    {isGoa ? 'Slots fill quickly' : 'Walk-in & scheduled consultations'}
                  </span>
                  <button
                    onClick={() => onContactClinic(clinic.id)}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-xs transition-all active:scale-98 cursor-pointer ${
                      isGoa ? 'bg-amber-800 hover:bg-amber-900' : 'bg-[#2D5A50] hover:bg-[#20423a]'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-emerald-300" />
                    <span>Call Clinic</span>
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