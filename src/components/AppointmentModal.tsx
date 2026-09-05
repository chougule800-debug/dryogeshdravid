import React, { useState, useEffect } from 'react';
import { ClinicBranchId, Appointment, Doctor, ClinicLocation } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  X, 
  Send, 
  Copy,
  Check,
  Building,
  Heart,
  Stethoscope,
  ExternalLink
} from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBranch?: ClinicBranchId;
  initialDoctorId?: string;
  doctors: Doctor[];
  clinics: ClinicLocation[];
  onSaveAppointment: (appt: Appointment) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  initialBranch = 'belgaum',
  initialDoctorId,
  doctors,
  clinics,
  onSaveAppointment,
}) => {
  const [branch, setBranch] = useState<ClinicBranchId>(initialBranch);
  const [doctorId, setDoctorId] = useState<string>(initialDoctorId || doctors[0]?.id || '');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [healthConcern, setHealthConcern] = useState<string>('');
  const [consultationType, setConsultationType] = useState<'In-Clinic' | 'Video/Online'>('In-Clinic');

  // Submission & Email simulation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialBranch) setBranch(initialBranch);
    if (initialDoctorId) setDoctorId(initialDoctorId);
  }, [initialBranch, initialDoctorId, isOpen]);

  // Calculate upcoming valid dates
  const availableDates = React.useMemo(() => {
    const list: { label: string; value: string; isSecondSunday?: boolean }[] = [];
    const today = new Date();

    if (branch === 'goa') {
      // Find next 4 Second Sundays
      for (let m = 0; m < 6; m++) {
        const year = today.getFullYear();
        const month = today.getMonth() + m;
        const calcDate = new Date(year, month, 1);
        let sundayCount = 0;

        for (let day = 1; day <= 31; day++) {
          const d = new Date(calcDate.getFullYear(), calcDate.getMonth(), day);
          if (d.getMonth() !== calcDate.getMonth()) break;
          if (d.getDay() === 0) {
            sundayCount++;
            if (sundayCount === 2) {
              if (d >= today) {
                const val = d.toISOString().split('T')[0];
                const lbl = d.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                list.push({ label: `${lbl} (2nd Sunday)`, value: val, isSecondSunday: true });
              }
            }
          }
        }
      }
    } else {
      // Belgaum: Next 18 days (Monday to Friday only; Saturday & Sunday Closed)
      for (let i = 1; i <= 21; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        if (d.getDay() !== 0 && d.getDay() !== 6) { // skip Sun (0) & Sat (6)
          const val = d.toISOString().split('T')[0];
          const lbl = d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          list.push({ label: `${lbl} (Mon–Fri)`, value: val });
        }
      }
    }
    return list;
  }, [branch]);

  // Available time slots based on branch
  const timeSlots = React.useMemo(() => {
    if (branch === 'goa') {
      return [
        '10:00 AM',
        '10:30 AM',
        '11:00 AM',
        '11:30 AM',
        '12:00 PM',
        '12:30 PM',
        '01:00 PM',
        '01:30 PM',
      ];
    }
    return [
      '12:00 PM (Morning - New Cases)',
      '12:30 PM (Morning - New Cases)',
      '01:00 PM (Morning - New Cases)',
      '01:30 PM (Morning - New Cases)',
      '06:00 PM (Evening - Follow-up Cases)',
      '06:30 PM (Evening - Follow-up Cases)',
      '07:00 PM (Evening - Follow-up Cases)',
      '07:30 PM (Evening - Follow-up Cases)',
    ];
  }, [branch]);

  // Set default date when list changes
  useEffect(() => {
    if (availableDates.length > 0 && (!date || !availableDates.some(d => d.value === date))) {
      setDate(availableDates[0].value);
    }
    if (timeSlots.length > 0 && !time) {
      setTime(timeSlots[0]);
    }
  }, [availableDates, timeSlots]);

  if (!isOpen) return null;

  const selectedClinic = clinics.find((c) => c.id === branch) || clinics[0];
  const selectedDoctor = doctors.find((d) => d.id === doctorId) || doctors[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientEmail || !patientPhone) {
      alert('Please fill in your name, email, and phone number.');
      return;
    }
    if (!selectedDoctor) {
      alert('No doctors are available for booking yet.');
      return;
    }

    setIsSubmitting(true);

    const newAppt: Appointment = {
      id: 'appt-' + Date.now(),
      patientName,
      patientEmail,
      patientPhone,
      patientAge: patientAge ? parseInt(patientAge) : 30,
      patientGender,
      healthConcern: healthConcern || 'General Constitutional Evaluation',
      branchId: branch,
      doctorId: selectedDoctor.id,
      appointmentDate: date,
      appointmentTime: time,
      consultationType,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
      emailReminderSent: true,
    };

    setTimeout(() => {
      onSaveAppointment(newAppt);
      setConfirmedAppt(newAppt);
      setIsSubmitting(false);
    }, 600);
  };

  const getWhatsAppMessageText = (appt: Appointment) => {
    const formattedDate = new Date(appt.appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });

    return `Dear ${appt.patientName}, 

your appointment at Dr DRAVID'S HOMOEOPATHIC CLINIC on ${formattedDate}, ${appt.appointmentTime.split(' ')[0]} ${appt.appointmentTime.split(' ')[1] || 'PM'} has been confirmed. 

Please call 8762465349 for any changes.

Website: no website appointments

Location: https://goo.gl/maps/VbZETwutJjYMSpqU9

Note: Your appointment at Dr. DRAVID’S HOMOEOPATHIC CLINIC has been confirmed. 🩺

For any changes or appointment-related queries, please call 8762465349.

📍 Location:
https://goo.gl/maps/VbZETwutJjYMSpqU9

Important Instructions: 

Please book your tentative consultation or follow‑up slot one day in advance at Belagavi Clinic.

Please arrive on time for your scheduled appointment. If you are unable to attend, kindly inform us in advance.

Please bring all previous medical records, investigation reports, and prescriptions.`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2D5A50] to-[#1C3F3A] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif-display">
                {confirmedAppt ? 'Appointment Slot Confirmed' : 'Consult Dr. Yogesh Dravid'}
              </h3>
              <p className="text-xs text-emerald-100/80">
                Dr. Dravid's Homoeopathic Clinic &bull; Belgaum &amp; Goa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Strip on Consulting Policy */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-2.5 text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Belgaum Hours:</strong> Mon–Fri: 12–2 PM (New Cases) &amp; 6–8 PM (Follow-ups). Saturday &amp; Sunday closed. WhatsApp is for patient info only. Call <strong>8762465349</strong> to confirm.
          </span>
        </div>

        {confirmedAppt ? (
          /* Confirmation & WhatsApp Copy Screen */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 font-serif-display">
                Appointment Registered!
              </h4>
              <p className="text-xs sm:text-sm text-slate-600">
                A confirmation has been prepared for <strong className="text-slate-800">{confirmedAppt.patientName}</strong>.
              </p>
            </div>

            {/* WhatsApp Formatted Message Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Official WhatsApp Message Format:</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">Ready to copy</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs text-slate-800 font-sans whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">
                {getWhatsAppMessageText(confirmedAppt)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getWhatsAppMessageText(confirmedAppt));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebc59] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
              </button>

              <a
                href="https://goo.gl/maps/VbZETwutJjYMSpqU9"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Open Belgaum Clinic Map</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {/* Branch Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Select Clinic Location
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clinics.map((c) => {
                  const isSelected = branch === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setBranch(c.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#2D5A50] bg-emerald-50/60 ring-2 ring-[#2D5A50]/20'
                          : 'border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Building className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-[#2D5A50]' : 'text-slate-600'}`} />
                      <div>
                        <div className="font-bold text-xs text-slate-950">{c.name}</div>
                        <div className="text-[11px] text-slate-800 font-medium">{c.city}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  Consultation Date
                </label>
                <select
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#2D5A50] focus:outline-none"
                  required
                >
                  {availableDates.map((d) => (
                    <option key={d.value} value={d.value} className="text-slate-900">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  Time Slot
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#2D5A50] focus:outline-none"
                  required
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot} className="text-slate-900">
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Patient Info Fields */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Patient Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Patient Full Name *"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 font-medium focus:ring-2 focus:ring-[#2D5A50] focus:outline-none"
                  required
                />

                <input
                  type="tel"
                  placeholder="Phone Number (e.g. 8762465349) *"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 font-medium focus:ring-2 focus:ring-[#2D5A50] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  placeholder="Email for Reminders *"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className="sm:col-span-2 w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 font-medium focus:ring-2 focus:ring-[#2D5A50] focus:outline-none"
                  required
                />

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Age"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-1/2 p-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 font-medium focus:ring-2 focus:ring-[#2D5A50] focus:outline-none"
                    min="1"
                    max="120"
                  />
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-1/2 p-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#2D5A50] focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <textarea
                placeholder="Describe your health condition or symptoms (e.g. chronic allergy, skin, migraine)..."
                rows={2}
                value={healthConcern}
                onChange={(e) => setHealthConcern(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 font-medium focus:ring-2 focus:ring-[#2D5A50] focus:outline-none"
              ></textarea>
            </div>

            {/* Consultation Mode */}
            <div className="flex items-center gap-4 text-xs">
              <span className="font-bold text-slate-900">Consultation Mode:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-900 font-medium">
                <input
                  type="radio"
                  name="consultMode"
                  checked={consultationType === 'In-Clinic'}
                  onChange={() => setConsultationType('In-Clinic')}
                  className="text-[#2D5A50]"
                />
                <span>In-Clinic OPD</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-900 font-medium">
                <input
                  type="radio"
                  name="consultMode"
                  checked={consultationType === 'Video/Online'}
                  onChange={() => setConsultationType('Video/Online')}
                  className="text-[#2D5A50]"
                />
                <span>Online Video Consultation</span>
              </label>
            </div>

            {/* Submit CTA */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-800 font-medium text-center sm:text-left">
                Helpline: <strong className="text-slate-950 font-bold">8762465349</strong>
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Securing Slot...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-300" />
                    <span>Confirm &amp; Generate WhatsApp Slip</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
