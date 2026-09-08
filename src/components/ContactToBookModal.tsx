import React, { useState } from 'react';
import { ClinicLocation, ClinicBranchId } from '../types';
import { X, Phone, Building2, AlertCircle } from 'lucide-react';

interface ContactToBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: ClinicLocation[];
  initialBranch?: ClinicBranchId;
}

export const ContactToBookModal: React.FC<ContactToBookModalProps> = ({
  isOpen,
  onClose,
  clinics,
  initialBranch = 'belgaum',
}) => {
  const [selectedBranch, setSelectedBranch] = useState<ClinicBranchId>(initialBranch);

  if (!isOpen) return null;

  const selectedClinic = clinics.find((c) => c.id === selectedBranch) || clinics[0];

  const phone = selectedClinic?.phone || '';

  const handleCall = () => {
    window.open(`tel:${phone}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Modal container with constrained height and safe margins */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#2D5A50] to-[#1C3F3A] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-serif-display">Contact Clinic to Book</h3>
              <p className="text-[11px] text-emerald-100/80">Select a clinic and call directly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-200 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Clinic Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Clinic Location
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clinics.map((clinic) => (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => setSelectedBranch(clinic.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedBranch === clinic.id
                      ? 'border-[#2D5A50] bg-emerald-50/60 ring-2 ring-[#2D5A50]/20'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{clinic.name}</div>
                  <div className="text-[11px] text-slate-600">{clinic.city}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info - only Call Now */}
          {selectedClinic && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <h4 className="font-bold text-sm text-slate-900">{selectedClinic.name}</h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCall}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-emerald-300" />
                  <span>Call Now — {selectedClinic.phone}</span>
                </button>
                {selectedClinic.alternatePhone && (
                  <p className="text-xs text-slate-500 text-center">
                    Alternate: {selectedClinic.alternatePhone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs space-y-1">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p>
                <strong>Important:</strong> Appointments are not booked through this website. Please call the selected clinic directly to book your appointment.
              </p>
            </div>
            <p className="text-amber-700 font-medium">
              Please do not send WhatsApp messages for appointment booking. Call the clinic directly.
            </p>
          </div>

          {/* Clinic Rules - always visible */}
          <div className="border-t border-slate-200 pt-4">
            <h5 className="font-bold text-sm text-slate-900 mb-2">Clinic Rules & Instructions</h5>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              <li>Appointments are booked directly through the clinic by phone call.</li>
              <li>Please contact the selected clinic before visiting.</li>
              <li>Please arrive on time once your appointment has been confirmed by the clinic.</li>
              <li>Please bring previous medical records, investigation reports, prescriptions and medicines for reference.</li>
              <li>Maintain cleanliness, discipline and decorum inside the clinic.</li>
              <li>Maintain silence and avoid loud conversations or unnecessary mobile-phone use.</li>
              <li>Cooperate with clinic staff during registration and consultation.</li>
              <li>Avoid repeated non-emergency calls during consultation hours.</li>
              <li>Respect every patient's personal space, time and privacy.</li>
              <li>Follow the appointment sequence given by the clinic.</li>
              <li>Avoid bringing children unless they are accompanying a patient for consultation, where appropriate.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};