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
  ExternalLink,
  Info
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

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);

  // For clinic rules expand/collapse
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (initialBranch) setBranch(initialBranch);
    if (initialDoctorId) setDoctorId(initialDoctorId);
  }, [initialBranch, initialDoctorId, isOpen]);

  // Calculate available dates: only from tomorrow onwards (one-day advance rule)
  const availableDates = React.useMemo(() => {
    const list: { label: string; value: string; isSecondSunday?: boolean }[] = [];
    const today = new Date();
    // Start from tomorrow
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);

    if (branch === 'goa') {
      // Find next 4 Second Sundays starting from tomorrow
      for (let m = 0; m < 6; m++) {
        const year = startDate.getFullYear();
        const month = startDate.getMonth() + m;
        const calcDate = new Date(year, month, 1);
        let sundayCount = 0;

        for (let day = 1; day <= 31; day++) {
          const d = new Date(calcDate.getFullYear(), calcDate.getMonth(), day);
          if (d.getMonth() !== calcDate.getMonth()) break;
          if (d.getDay() === 0) {
            sundayCount++;
            if (sundayCount === 2) {
              if (d >= startDate) {
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
      // Belgaum: Next 21 days from tomorrow, Monday to Friday only
      for (let i = 0; i < 21; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dayNum = d.getDay();
        if (dayNum !== 0 && dayNum !== 6) { // skip Sat, Sun
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

  // Time slots based on branch
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

  // Set default date/time when list changes
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
    // Check if date is today or earlier (should not happen with available dates, but just in case)
    const today = new Date();
    const selectedDate = new Date(date);
    if (selectedDate <= today) {
      alert('Appointment requests must be made at least one day in advance. Please select a future date.');
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
      status: 'Tentative', // status is now tentative
      createdAt: new Date().toISOString(),
      emailReminderSent: false, // not sent automatically
    };

    setTimeout(() => {
      onSaveAppointment(newAppt);
      setConfirmedAppt(newAppt);
      setIsSubmitting(false);
    }, 600);
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
                {confirmedAppt ? 'Tentative Request Submitted' : 'Request Consultation with Dr. Yogesh Dravid'}
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

        {/* Tentative Request Notice - shown only before submission */}
        {!confirmedAppt && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Important:</strong> This is only a <strong>tentative request</strong> to check the doctor's availability. Your appointment is <strong>NOT confirmed</strong> when you submit this form. The clinic will check availability and send the confirmed appointment timing to you on <strong>WhatsApp</strong>.
              <br />
              <span className="font-semibold">Please book your tentative consultation/follow-up slot at least one day in advance.</span>
            </span>
          </div>
        )}

        {confirmedAppt ? (
          /* Success Screen - Tentative Request Submitted */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 font-serif-display">
                Tentative Request Submitted
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Your request for a consultation/follow-up has been received. This does not confirm your appointment. 
                The clinic will check the doctor's availability and send the confirmed appointment timing to you on <strong>WhatsApp</strong>.
              </p>
              <p className="text-xs text-slate-500">
                <strong>Please note:</strong> Requests must be made at least one day in advance.
              </p>
            </div>

            {/* Display summary of request */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="font-semibold text-slate-600">Patient:</span>
                <span>{confirmedAppt.patientName}</span>
                <span className="font-semibold text-slate-600">Requested Date:</span>
                <span>{confirmedAppt.appointmentDate}</span>
                <span className="font-semibold text-slate-600">Requested Time:</span>
                <span>{confirmedAppt.appointmentTime}</span>
                <span className="font-semibold text-slate-600">Branch:</span>
                <span>{confirmedAppt.branchId === 'belgaum' ? 'Belgaum' : 'Goa'}</span>
                <span className="font-semibold text-slate-600">Status:</span>
                <span className="text-amber-600 font-bold">Tentative</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3 text-xs text-slate-700 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <Info className="w-4 h-4" />
                <span>What happens next?</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>The clinic will review your request and check the doctor's availability.</li>
                <li>You will receive a WhatsApp message with the <strong>confirmed appointment timing</strong>.</li>
                <li>Please wait for the WhatsApp confirmation before considering your appointment confirmed.</li>
                <li>If you need to make changes, you can call the clinic at <strong>8762465349</strong>.</li>
              </ul>
            </div>

            {/* Clinic Rules Summary (collapsible) */}
            <div className="border-t border-slate-200 pt-4">
              <button
                onClick={() => setShowRules(!showRules)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span>{showRules ? 'Hide' : 'Show'} Clinic Rules & Instructions</span>
                <span className="text-[10px]">{showRules ? '▲' : '▼'}</span>
              </button>
              {showRules && (
                <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Patients are requested to maintain cleanliness, discipline and decorum inside the clinic premises.</li>
                    <li>Please arrive on time for your appointment. Kindly intimate prior if you are unable to attend the scheduled appointment.</li>
                    <li>Please bring all your previous/prescribed medical records, investigation reports, and prescriptions/medicines for reference.</li>
                    <li>Kindly maintain silence and avoid loud conversations or unnecessary mobile phone use inside the clinic. 📵</li>
                    <li>Kindly cooperate with clinic staff during registration and consultation.</li>
                    <li>Kindly avoid repeated non-emergency calls to the doctor during consultation hours.</li>
                    <li>Please respect every patient's personal space, time and privacy.</li>
                    <li>Kindly wait patiently and follow the appointment sequence.</li>
                    <li>Please avoid bringing children to the clinic unless they are accompanying a patient for consultation, to help minimize the risk of cross-infection.</li>
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
            >
              Close
            </button>
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
                <p className="text-[10px] text-slate-500 mt-1">
                  <span className="font-semibold">Note:</span> Requests must be made at least one day in advance.
                </p>
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

            {/* Clinic Rules & Instructions - Collapsible */}
            <div className="border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setShowRules(!showRules)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span>{showRules ? 'Hide' : 'Show'} Clinic Rules & Instructions</span>
                <span className="text-[10px]">{showRules ? '▲' : '▼'}</span>
              </button>
              {showRules && (
                <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Patients are requested to maintain cleanliness, discipline and decorum inside the clinic premises.</li>
                    <li>Please arrive on time for your appointment. Kindly intimate prior if you are unable to attend the scheduled appointment.</li>
                    <li>Please bring all your previous/prescribed medical records, investigation reports, and prescriptions/medicines for reference.</li>
                    <li>Kindly maintain silence and avoid loud conversations or unnecessary mobile phone use inside the clinic. 📵</li>
                    <li>Kindly cooperate with clinic staff during registration and consultation.</li>
                    <li>Kindly avoid repeated non-emergency calls to the doctor during consultation hours.</li>
                    <li>Please respect every patient's personal space, time and privacy.</li>
                    <li>Kindly wait patiently and follow the appointment sequence.</li>
                    <li>Please avoid bringing children to the clinic unless they are accompanying a patient for consultation, to help minimize the risk of cross-infection.</li>
                  </ul>
                  <p className="mt-2 text-amber-800 font-medium">
                    <strong>Calls and messages outside consulting hours will be responded to later.</strong>
                  </p>
                  <p className="text-amber-800 text-[11px]">
                    <strong>WhatsApp is only for patient information.</strong> Please do not text or WhatsApp for seeking appointments. You will receive a confirmation via WhatsApp after the clinic checks availability.
                  </p>
                </div>
              )}
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
                  <span>Submitting Request...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-300" />
                    <span>Submit Tentative Request</span>
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