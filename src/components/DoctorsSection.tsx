import React from 'react';
import { Doctor } from '../types';
import { 
  GraduationCap, 
  Award, 
  CheckCircle, 
  Calendar, 
  Stethoscope, 
  Activity,
  Clock,
  AlertTriangle,
  Phone,
  MessageCircle,
  ShieldCheck,
  Building
} from 'lucide-react';

interface DoctorsSectionProps {
  doctors?: Doctor[];
  loading?: boolean;
  error?: string | null;
  onBookWithDoctor: (doctorId: string) => void;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({ doctors = [], loading = false, error = null, onBookWithDoctor }) => {
  const activeDoctors = doctors.filter(d => d.id === 'dr-yogesh-dravid' || !doctors.some(x => x.id === 'dr-yogesh-dravid'));
  const doctor = activeDoctors[0];

  if (error) {
    return (
      <section id="doctors" className="py-10 sm:py-14 bg-white border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-sm text-slate-500 font-semibold">Unable to load doctors from the server. Please try again.</p>
        </div>
      </section>
    );
  }

  if (loading && doctors.length === 0) {
    return (
      <section id="doctors" className="py-10 sm:py-14 bg-white border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-sm text-slate-500 font-semibold animate-pulse">Loading doctors...</p>
        </div>
      </section>
    );
  }

  if (!doctor) {
    return (
      <section id="doctors" className="py-10 sm:py-14 bg-white border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-sm text-slate-500 font-semibold">No doctor profile available.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="doctors" className="py-10 sm:py-14 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-[#1C3F3A] text-xs font-bold uppercase tracking-wider border border-emerald-300">
            <Stethoscope className="w-3.5 h-3.5 text-[#1C3F3A]" />
            <span className="text-[#1C3F3A]">Senior Homoeopathic Consultant</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-serif-display">
            Meet Dr. Yogesh Dravid
          </h2>
          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
            HOD Department of Physiology at Bharatesh Homeopathic Medical College with 24+ years of clinical mastery in classical constitutional homoeopathy.
          </p>
        </div>

        {/* Doctor Profile & Schedule Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Doctor Profile Card */}
          <div 
            id={`doctor-card-${doctor.id}`}
            className="lg:col-span-7 rounded-3xl border border-emerald-200/90 bg-gradient-to-b from-[#fbfdfb] via-white to-[#f7faf8] shadow-sm p-6 sm:p-8 flex flex-col justify-between"
          >
            <div className="space-y-6">
              {/* Doctor Header: Image & Badges */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-md border-2 border-emerald-700/20 shrink-0 bg-slate-100">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== '/images/dr_yogesh_dravid.jpg') {
                        target.src = '/images/dr_yogesh_dravid.jpg';
                      }
                    }}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-[#0f2420]/95 backdrop-blur-xs text-[10px] text-emerald-300 font-bold py-1 text-center border-t border-emerald-500/30 truncate px-1">
                    {doctor.role || 'HOD Physiology'}
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-serif-display">
                      {doctor.name}
                    </h3>
                  </div>

                  <p className="text-sm sm:text-base font-bold text-[#1C3F3A]">
                    {doctor.designation}
                  </p>

                  <p className="text-xs text-slate-800 font-bold">
                    {doctor.qualification}
                  </p>

                  <div className="pt-1.5 flex items-start gap-2 text-xs text-slate-900 bg-emerald-50/90 p-2.5 rounded-2xl border border-emerald-200">
                    <GraduationCap className="w-4 h-4 text-[#1C3F3A] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1C3F3A]">{doctor.role}</span> &bull; <span className="text-slate-800 font-medium">{doctor.academicAffiliation}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-slate-800 font-normal leading-relaxed whitespace-pre-line">
                {doctor.bio}
              </p>

              {/* Specializations List */}
              {doctor.specializations && doctor.specializations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#1C3F3A]" />
                    <span className="text-slate-900">Key Areas of Clinical Expertise</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {doctor.specializations.map((spec, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-slate-200"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer: Experience & Direct Call / Consult Trigger */}
            <div className="pt-6 mt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-800 font-medium">
                <Award className="w-4 h-4 text-amber-600" />
                <span><strong className="text-slate-950 font-bold">{doctor.experienceYears}+ Years</strong> of Classical Practice</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href="tel:8762465349"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-98"
                >
                  <Phone className="w-4 h-4 text-emerald-300" />
                  <span>Call 8762465349 to Book</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Official Consulting Hours & Patient Schedule Rules */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Consulting Hours Box */}
            <div className="rounded-3xl border border-emerald-800/20 bg-gradient-to-br from-[#122b25] via-[#1c3f3a] to-[#0c1d1a] text-white p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-emerald-700/40 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">CONSULTING HOURS</h3>
                    <p className="text-[11px] text-emerald-300/90 font-medium">Dr. Dravid's Belgaum Clinic</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Strict OPD Timings
                </span>
              </div>

              {/* Sessions Breakdown */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">Morning Session</span>
                    <span className="font-mono font-bold text-white bg-emerald-950/80 px-2 py-0.5 rounded text-xs">12:00 PM – 2:00 PM</span>
                  </div>
                  <p className="text-xs text-emerald-100/90 font-semibold">
                    &bull; Exclusively for New Cases
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Monday to Friday (Detailed Hahnemannian case taking).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300">Evening Session</span>
                    <span className="font-mono font-bold text-white bg-emerald-950/80 px-2 py-0.5 rounded text-xs">6:00 PM – 8:00 PM</span>
                  </div>
                  <p className="text-xs text-teal-100/90 font-semibold">
                    &bull; Only Follow-Up Cases
                  </p>
                  <p className="text-[11px] text-slate-300">
                    (New case: only accepted in acute emergencies).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 flex items-center justify-between text-xs">
                  <span className="font-bold">Saturday &amp; Sunday</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-amber-900/60 text-amber-300">CLOSED</span>
                </div>
              </div>
            </div>

            {/* Important Patient Instructions & WhatsApp Policy Card */}
            <div className="rounded-3xl border border-slate-200 bg-amber-50/60 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Important Patient Instructions &amp; Rules</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-900 leading-relaxed font-normal">
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 font-bold">&bull;</span>
                  <span><strong className="text-slate-950 font-bold">Calls and messages</strong> outside consulting hours will be responded to later.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 font-bold">&bull;</span>
                  <span>Kindly <strong className="text-slate-950 font-bold">avoid repeated calls/messages</strong> for the same concern.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 font-bold">&bull;</span>
                  <span>Patients are requested to <strong className="text-slate-950 font-bold">strictly maintain their scheduled time slot</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 font-bold">&bull;</span>
                  <span className="text-amber-950 font-semibold bg-amber-100/90 px-2 py-1 rounded-lg">
                    <strong>WhatsApp is only for patient's info.</strong> Hence, please do not text or WhatsApp for seeking appointments. Call <strong className="text-slate-950">8762465349</strong> for prior booking.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 font-bold">&bull;</span>
                  <span className="text-slate-900">Please bring all previous medical records, investigation reports, and current prescriptions.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Classical Hahnemannian Philosophy Quote */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 max-w-4xl mx-auto text-center space-y-3">
          <div className="text-2xl text-[#1C3F3A] font-serif italic font-medium">
            "Similia Similibus Curentur — Let Likes Be Cured By Likes"
          </div>
          <p className="text-xs sm:text-sm text-slate-800 font-medium max-w-2xl mx-auto leading-relaxed">
            By understanding each patient's physiological reactivity, thermal preferences, and emotional disposition, Dr. Yogesh Dravid prescribes the single constitutional dynamic remedy that stimulates the vital force to restore enduring health.
          </p>
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            &mdash; Classical Hahnemannian Homoeopathy &bull; Dept. of Physiology
          </div>
        </div>
      </div>
    </section>
  );
};

