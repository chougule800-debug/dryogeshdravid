import React, { useState } from 'react';
import { ClinicLocation } from '../../types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Mail, 
  Edit3, 
  Check, 
  X, 
  CheckCircle, 
  Navigation, 
  Calendar 
} from 'lucide-react';

interface AdminClinicsTabProps {
  clinics: ClinicLocation[];
  onUpdateClinics: (clinics: ClinicLocation[]) => void;
}

export const AdminClinicsTab: React.FC<AdminClinicsTabProps> = ({
  clinics,
  onUpdateClinics,
}) => {
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAltPhone, setFormAltPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formScheduleNote, setFormScheduleNote] = useState('');
  const [formSpecialRule, setFormSpecialRule] = useState('');
  const [formTimings, setFormTimings] = useState('');
  const [formMapEmbedUrl, setFormMapEmbedUrl] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleStartEdit = (clinic: ClinicLocation) => {
    setEditingClinicId(clinic.id);
    setFormName(clinic.name);
    setFormTagline(clinic.tagline);
    setFormAddress(clinic.address);
    setFormLandmark(clinic.landmark || '');
    setFormCity(clinic.city);
    setFormState(clinic.state);
    setFormPhone(clinic.phone);
    setFormAltPhone(clinic.alternatePhone || '');
    setFormEmail(clinic.email);
    setFormScheduleNote(clinic.scheduleNote || '');
    setFormSpecialRule(clinic.specialRule || '');
    setFormTimings(clinic.timings.join('\n'));
    setFormMapEmbedUrl(clinic.googleMapEmbedUrl || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClinicId) return;

    const timingsArray = formTimings
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedClinics = clinics.map((c) => {
      if (c.id === editingClinicId) {
        return {
          ...c,
          name: formName.trim(),
          tagline: formTagline.trim(),
          address: formAddress.trim(),
          landmark: formLandmark.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          phone: formPhone.trim(),
          alternatePhone: formAltPhone.trim() || undefined,
          email: formEmail.trim(),
          scheduleNote: formScheduleNote.trim(),
          specialRule: formSpecialRule.trim() || undefined,
          timings: timingsArray.length > 0 ? timingsArray : c.timings,
          googleMapEmbedUrl: formMapEmbedUrl.trim(),
        };
      }
      return c;
    });

    onUpdateClinics(updatedClinics);
    showSuccess(`Clinic info for "${formName}" updated successfully!`);
    setEditingClinicId(null);
  };

  return (
    <div className="p-6 overflow-y-auto space-y-6 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2D5A50]" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif-display">
              Clinic Branches, Timings & Contact Details
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Manage official addresses, landmark directions, OPD consultation hours, Goa 2nd Sunday visit schedules, and phone numbers.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Edit Form */}
      {editingClinicId && (
        <div className="p-6 rounded-3xl bg-slate-50 border-2 border-emerald-300/80 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#2D5A50]" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
                Edit Branch Details ({editingClinicId === 'belgaum' ? 'Belgaum Main Clinic' : 'Goa Quepem Visiting Clinic'})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setEditingClinicId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinic Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Full Postal Address *</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Landmark / Directions</label>
                <input
                  type="text"
                  value={formLandmark}
                  onChange={(e) => setFormLandmark(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Phone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alternate Phone</label>
                <input
                  type="text"
                  value={formAltPhone}
                  onChange={(e) => setFormAltPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City & State</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="City"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-1/2 p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-1/2 p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Timings (one per line) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block mb-1">
                Consultation Timings (One line per slot, e.g. "Mon - Sat: 10:00 AM - 1:30 PM")
              </label>
              <textarea
                rows={3}
                value={formTimings}
                onChange={(e) => setFormTimings(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Schedule Note</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Clinical Sessions by Prior Appointment"
                  value={formScheduleNote}
                  onChange={(e) => setFormScheduleNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Special Schedule Rule (Goa)</label>
                <input
                  type="text"
                  placeholder="e.g. Every Second Sunday 10:00 AM - 3:00 PM"
                  value={formSpecialRule}
                  onChange={(e) => setFormSpecialRule(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Google Maps Embed URL</label>
              <input
                type="text"
                value={formMapEmbedUrl}
                onChange={(e) => setFormMapEmbedUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Branch Updates</span>
              </button>

              <button
                type="button"
                onClick={() => setEditingClinicId(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Branches List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clinics.map((clinic) => {
          const isGoa = clinic.id === 'goa';

          return (
            <div
              key={clinic.id}
              className={`p-6 rounded-3xl bg-white border shadow-2xs space-y-4 transition-all ${
                editingClinicId === clinic.id ? 'border-[#2D5A50] ring-2 ring-[#2D5A50]/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isGoa ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {isGoa ? 'Visiting Clinic (South Goa)' : 'Main Operational Headquarter'}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 font-serif-display">
                    {clinic.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{clinic.tagline}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartEdit(clinic)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#2D5A50] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Branch</span>
                </button>
              </div>

              <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#2D5A50] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">{clinic.address}</span>
                    {clinic.landmark && <p className="text-slate-500 text-[11px] mt-0.5">Near: {clinic.landmark}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Phone className="w-4 h-4 text-[#2D5A50] shrink-0" />
                  <span className="font-semibold text-slate-800">
                    {clinic.phone} {clinic.alternatePhone ? ` / ${clinic.alternatePhone}` : ''}
                  </span>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <Clock className="w-4 h-4 text-[#2D5A50] shrink-0 mt-0.5" />
                  <div className="text-slate-700 space-y-0.5">
                    {clinic.timings.map((t, i) => (
                      <div key={i} className="font-medium">{t}</div>
                    ))}
                    {clinic.specialRule && (
                      <div className="text-amber-800 font-bold mt-1">Rule: {clinic.specialRule}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
