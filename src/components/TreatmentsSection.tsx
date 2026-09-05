import React, { useState } from 'react';
import { ClinicalServiceItem } from '../types';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  HeartHandshake, 
  ShieldCheck,
  Stethoscope,
  Info
} from 'lucide-react';

interface TreatmentsSectionProps {
  services?: ClinicalServiceItem[];
  loading?: boolean;
  error?: string | null;
  onConsultCategory: (categoryTitle: string) => void;
}

export const TreatmentsSection: React.FC<TreatmentsSectionProps> = ({ 
  services = [], 
  loading = false,
  error = null,
  onConsultCategory 
}) => {
  const [selectedService, setSelectedService] = useState<number | null>(0);

  const keyConditions = [
    { name: 'Psoriasis & Eczema', cat: 'Skin Disorders' },
    { name: 'Alopecia & Hair Fall', cat: 'Hair Care' },
    { name: 'Pediatric Asthma & Allergies', cat: 'Pediatrics' },
    { name: 'Thyroid & PCOS/PCOD', cat: 'Hormonal' },
    { name: 'Osteoarthritis & Sciatica', cat: 'Joint Health' },
    { name: 'Chronic Sinusitis & Rhinitis', cat: 'Respiratory' },
    { name: 'Migraine & Chronic Headaches', cat: 'Neurological' },
    { name: 'IBS, Acid Reflux & Gastritis', cat: 'Digestive' },
    { name: 'Warts, Corns & Skin Tags', cat: 'Dermatology' },
    { name: 'Anxiety, Panic & Insomnia', cat: 'Psychosomatic' },
  ];

  return (
    <section id="treatments" className="py-10 sm:py-14 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#1C3F3A] text-xs font-bold uppercase tracking-wider border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-[#1C3F3A]" />
            <span className="text-[#1C3F3A]">Specialized Clinical Care</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-serif-display">
            Conditions We Successfully Treat
          </h2>
          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
            Homeopathy treats the patient who has the disease, not merely the disease in isolation. Our physiological-constitutional methodology restores systemic vitality.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {error && (
            <div className="md:col-span-2 lg:col-span-3 p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">Unable to load treatments from the server. Please try again.</p>
            </div>
          )}
          {!error && loading && services.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold animate-pulse">Loading treatments...</p>
            </div>
          )}
          {!error && !loading && services.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">No treatments available.</p>
            </div>
          )}
          {services.map((service, idx) => (
            <div
              key={service.id || idx}
              className={`rounded-3xl border p-6 sm:p-7 transition-all flex flex-col justify-between cursor-pointer ${
                selectedService === idx
                  ? 'border-emerald-500/50 bg-slate-50 shadow-md ring-1 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedService(idx)}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1C3F3A] flex items-center justify-center font-bold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-900 border border-slate-200">
                    {service.highlight}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-950 font-serif-display">
                  {service.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConsultCategory(service.title);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#1C3F3A] hover:text-[#2D5A50] transition-colors cursor-pointer"
                >
                  <span>Book Consultation for this</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Tags of Conditions */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-base sm:text-lg font-bold text-slate-950 font-serif-display">
                Common Intractable Complaints Resolved:
              </h4>
              <p className="text-xs text-slate-800 font-medium">
                Individualized remedies selected after thorough physiological case evaluation.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center md:justify-end max-w-2xl">
              {keyConditions.map((cond, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:border-emerald-400 hover:text-[#1C3F3A] transition-colors cursor-default"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-700 font-bold" />
                  <span>{cond.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
