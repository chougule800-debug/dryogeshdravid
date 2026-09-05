import React from 'react';
import { 
  Stethoscope, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Heart, 
  Calendar,
  Lock 
} from 'lucide-react';
import { ClinicLocation } from '../types';

interface FooterProps {
  onOpenBooking: () => void;
  onOpenAdmin?: () => void;
  clinics?: ClinicLocation[];
}

export const Footer: React.FC<FooterProps> = ({
  onOpenBooking,
  onOpenAdmin,
  clinics,
}) => {
  // Primary clinic = the Belgaum/Vadagaon branch, falls back to any clinic.
  const primaryClinic = clinics?.find((c) => c.id === 'belgaum') ?? clinics?.[0];
  const clinicName = primaryClinic?.name || "Dr. Dravid's Homoeopathic Clinic";
  const clinicAddress = primaryClinic
    ? `${primaryClinic.address}${primaryClinic.landmark ? `, ${primaryClinic.landmark}` : ''}, ${primaryClinic.city} (${primaryClinic.state})`
    : "At Yallur Road, Vadagaon, Opp. Kalpvruksh Hotel, Belgaum (Belagavi), Karnataka – 590005";
  const clinicPhone = primaryClinic?.phone || '+91 8762465349';
  const clinicTimings = primaryClinic?.scheduleNote || 'Mon–Fri: 12:00 PM–2:00 PM (New Cases) & 6:00 PM–8:00 PM (Follow-ups)';
  return (
    <footer id="contact" className="bg-[#0c1d1a] text-slate-300 pt-10 pb-6 border-t border-emerald-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-8 border-b border-emerald-900/40">
          {/* Brand Col */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-white font-serif-display">
                  Dr. Dravid's
                </span>
                <span className="block text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Homeopathic Clinic
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Pioneering constitutional, individualized homeopathic healing with profound physiological insight. Led by Prof. Dr. Yogesh Dravid (HOD Physiology, Bharatesh Homoeopathic Medical College & Hospital).
            </p>

            <div className="pt-1">
              <button
                onClick={onOpenBooking}
                className="px-5 py-2.5 rounded-full bg-[#335e35] hover:bg-[#284c2a] text-white font-semibold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-200" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>

          {/* Belgaum Main Clinic */}
          <div className="lg:col-span-6 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Clinic Location & Contact</span>
            </h4>

            <div className="space-y-2 text-xs sm:text-sm text-slate-300">
              <p className="font-semibold text-white text-base">
                {clinicName}
              </p>
              <p>
                {clinicAddress}
              </p>
              <p className="flex items-center gap-2 pt-1 font-bold text-emerald-400">
                <Phone className="w-3.5 h-3.5 text-emerald-300" />
                <span>Helpline: {clinicPhone}</span>
              </p>
              <div className="pt-1 text-xs text-slate-400 space-y-1">
                <div><strong>Consulting Hours:</strong> {clinicTimings}</div>
                <div className="text-amber-300/90 font-medium">Saturday &amp; Sunday: Closed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Ananya Infotech Design Credit & Admin Link */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} Dr. Dravid's Homeopathic Clinic. All rights reserved.</span>
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-slate-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Admin Management Portal"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <span>Design by</span>
            <a
              href="tel:9902686173"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1"
            >
              <span>Ananya Infotech (9902686173)</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
