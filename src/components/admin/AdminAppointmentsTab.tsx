import React, { useState } from 'react';
import { Appointment, ClinicBranchId, Doctor } from '../../types';
import { 
  Search, 
  Mail, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Plus, 
  Download, 
  MessageCircle, 
  X, 
  Check, 
  Filter,
  Stethoscope
} from 'lucide-react';

interface AdminAppointmentsTabProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onUpdateAppointments: (appts: Appointment[]) => void;
}

export const AdminAppointmentsTab: React.FC<AdminAppointmentsTabProps> = ({
  appointments,
  doctors,
  onUpdateAppointments,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');

  // Edit / Reschedule Modal State
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State for Edit or Create
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAge, setFormAge] = useState<number>(30);
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [formBranch, setFormBranch] = useState<ClinicBranchId>('belgaum');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('10:30 AM');
  const [formConcern, setFormConcern] = useState('');
  const [formMode, setFormMode] = useState<'In-Clinic' | 'Video/Online'>('In-Clinic');
  const [formStatus, setFormStatus] = useState<'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled'>('Confirmed');

  const [notificationMsg, setNotificationMsg] = useState('');

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 3500);
  };

  const handleStartEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    setIsCreatingNew(false);
    setFormName(appt.patientName);
    setFormPhone(appt.patientPhone);
    setFormEmail(appt.patientEmail);
    setFormAge(appt.patientAge || 30);
    setFormGender(appt.patientGender || 'Male');
    setFormBranch(appt.branchId);
    setFormDoctorId(appt.doctorId || doctors[0]?.id || 'dr-yogesh-dravid');
    setFormDate(appt.appointmentDate);
    setFormTime(appt.appointmentTime);
    setFormConcern(appt.healthConcern);
    setFormMode(appt.consultationType);
    setFormStatus(appt.status);
  };

  const handleStartCreate = () => {
    setEditingAppt(null);
    setIsCreatingNew(true);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAge(30);
    setFormGender('Male');
    setFormBranch('belgaum');
    setFormDoctorId(doctors[0]?.id || 'dr-yogesh-dravid');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormDate(tomorrow.toISOString().split('T')[0]);
    setFormTime('10:30 AM');
    setFormConcern('');
    setFormMode('In-Clinic');
    setFormStatus('Confirmed');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formDate) {
      alert('Please fill in patient name, phone number, and appointment date.');
      return;
    }

    if (editingAppt) {
      // Update existing appointment
      const updatedList = appointments.map((a) => {
        if (a.id === editingAppt.id) {
          return {
            ...a,
            patientName: formName.trim(),
            patientPhone: formPhone.trim(),
            patientEmail: formEmail.trim(),
            patientAge: Number(formAge),
            patientGender: formGender,
            branchId: formBranch,
            doctorId: formDoctorId,
            appointmentDate: formDate,
            appointmentTime: formTime,
            healthConcern: formConcern.trim(),
            consultationType: formMode,
            status: formStatus,
          };
        }
        return a;
      });
      onUpdateAppointments(updatedList);
      showNotification(`Appointment for ${formName} updated & rescheduled successfully!`);
    } else {
      // Create new manual appointment
      const newAppt: Appointment = {
        id: `APPT-${Date.now().toString().slice(-4)}`,
        patientName: formName.trim(),
        patientPhone: formPhone.trim(),
        patientEmail: formEmail.trim() || 'walkin@dravidclinic.com',
        patientAge: Number(formAge),
        patientGender: formGender,
        branchId: formBranch,
        doctorId: formDoctorId,
        appointmentDate: formDate,
        appointmentTime: formTime,
        healthConcern: formConcern.trim() || 'General Consultation',
        consultationType: formMode,
        status: formStatus,
        emailReminderSent: true,
        createdAt: new Date().toISOString(),
      };
      onUpdateAppointments([newAppt, ...appointments]);
      showNotification(`New appointment created for ${formName}!`);
    }

    setEditingAppt(null);
    setIsCreatingNew(false);
  };

  const handleStatusChange = (id: string, newStatus: 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled') => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    onUpdateAppointments(updated);
    showNotification(`Status updated to ${newStatus}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete appointment for ${name}?`)) {
      onUpdateAppointments(appointments.filter((a) => a.id !== id));
      showNotification(`Appointment deleted.`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (appointments.length === 0) {
      alert('No appointments to export.');
      return;
    }
    const headers = ['ID', 'Patient Name', 'Phone', 'Email', 'Age', 'Gender', 'Branch', 'Doctor', 'Date', 'Time', 'Mode', 'Chief Complaint', 'Status', 'Created At'];
    const rows = appointments.map((a) => {
      const doc = doctors.find((d) => d.id === a.doctorId);
      return [
        a.id,
        `"${a.patientName.replace(/"/g, '""')}"`,
        `"${a.patientPhone}"`,
        `"${a.patientEmail}"`,
        a.patientAge,
        a.patientGender,
        a.branchId === 'goa' ? 'Goa Quepem' : 'Belgaum Vadagaon',
        `"${(doc?.name || 'Dr. Dravid').replace(/"/g, '""')}"`,
        a.appointmentDate,
        a.appointmentTime,
        a.consultationType,
        `"${a.healthConcern.replace(/"/g, '""')}"`,
        a.status,
        a.createdAt,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dr_Dravid_Appointments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate WhatsApp Message Link for Patient
  const getWhatsAppLink = (appt: Appointment) => {
    const doc = doctors.find((d) => d.id === appt.doctorId);
    const branchName = appt.branchId === 'goa' ? 'Goa Visiting Clinic (Quepem)' : "Belgaum Main Clinic (Opp. Kalpvruksh Hotel)";
    const cleanPhone = appt.patientPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const text = `Hello ${appt.patientName},\n\nThis is a reminder regarding your appointment with ${doc?.name || 'Dr. Dravid'} at Dr. Dravid's Homoeopathic Clinic.\n\n📅 Date: ${appt.appointmentDate}\n⏰ Time: ${appt.appointmentTime}\n🏥 Location: ${branchName}\n📋 Mode: ${appt.consultationType}\n📊 Status: ${appt.status}\n\nClinic Helpline: +91 8762465349. Please feel free to reply if you need any adjustments.`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  // Filtered appointments
  const filtered = appointments.filter((a) => {
    const matchesSearch = 
      a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.patientPhone.includes(searchTerm) ||
      a.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.healthConcern.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || a.branchId === branchFilter;
    const matchesDoctor = doctorFilter === 'all' || a.doctorId === doctorFilter;

    return matchesSearch && matchesStatus && matchesBranch && matchesDoctor;
  });

  const countConfirmed = appointments.filter((a) => a.status === 'Confirmed').length;
  const countRescheduled = appointments.filter((a) => a.status === 'Rescheduled').length;
  const countCompleted = appointments.filter((a) => a.status === 'Completed').length;
  const countCancelled = appointments.filter((a) => a.status === 'Cancelled').length;

  return (
    <div className="p-6 overflow-y-auto space-y-6 flex-1">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Bookings</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-serif-display">{appointments.length}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Confirmed</div>
          <div className="text-xl font-bold text-emerald-900 mt-1 font-serif-display">{countConfirmed}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Rescheduled</div>
          <div className="text-xl font-bold text-amber-900 mt-1 font-serif-display">{countRescheduled}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 shadow-2xs">
          <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Completed</div>
          <div className="text-xl font-bold text-sky-900 mt-1 font-serif-display">{countCompleted}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Cancelled</div>
          <div className="text-xl font-bold text-rose-900 mt-1 font-serif-display">{countCancelled}</div>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Action Bar (Search, Filters, Export, Add New) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, phone, email, complaint, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2D5A50] focus:outline-none"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-medium"
          >
            <option value="all">All Branches</option>
            <option value="belgaum">Belgaum Clinic</option>
            <option value="goa">Goa Quepem Branch</option>
          </select>

          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-medium"
          >
            <option value="all">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add Walk-in Booking */}
          <button
            type="button"
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Edit / Reschedule / Create Form (Modal or Inline Drawer) */}
      {(editingAppt || isCreatingNew) && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border-2 border-emerald-300/80 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#2D5A50]" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
                {isCreatingNew ? 'Create Walk-in / Phone-in Appointment' : `Edit / Reschedule Appointment (${editingAppt?.id})`}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => { setEditingAppt(null); setIsCreatingNew(false); }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kulkarni"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Email Address</label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formAge}
                  onChange={(e) => setFormAge(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Gender</label>
                <select
                  value={formGender}
                  onChange={(e) => setFormGender(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinic Branch *</label>
                <select
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="belgaum">Belgaum (Main Clinic)</option>
                  <option value="goa">Goa Quepem (2nd Sunday)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Consulting Doctor *</label>
                <select
                  value={formDoctorId}
                  onChange={(e) => setFormDoctorId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Appointment Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Time Slot *</label>
                <select
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="12:30 PM">12:30 PM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="01:30 PM">01:30 PM</option>
                  <option value="06:00 PM">06:00 PM (Evening Belgaum)</option>
                  <option value="06:30 PM">06:30 PM</option>
                  <option value="07:00 PM">07:00 PM</option>
                  <option value="07:30 PM">07:30 PM</option>
                  <option value="08:00 PM">08:00 PM</option>
                  <option value="08:30 PM">08:30 PM</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mode</label>
                <select
                  value={formMode}
                  onChange={(e) => setFormMode(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="In-Clinic">In-Clinic Consultation</option>
                  <option value="Video/Online">Video / Online Call</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Booking Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-emerald-800"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Health Concern / Chief Symptoms</label>
              <textarea
                rows={2}
                placeholder="Describe patient condition, duration of symptoms, previous treatments..."
                value={formConcern}
                onChange={(e) => setFormConcern(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingAppt ? 'Save Changes & Reschedule' : 'Save & Confirm Booking'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setEditingAppt(null); setIsCreatingNew(false); }}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-2">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-medium text-slate-600">No appointments matching your criteria.</p>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setBranchFilter('all'); setDoctorFilter('all'); }}
            className="text-[#2D5A50] font-bold underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((appt) => {
            const doc = doctors.find((d) => d.id === appt.doctorId);
            const isGoa = appt.branchId === 'goa';

            return (
              <div
                key={appt.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs space-y-4 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {appt.id}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#2D5A50]" />
                      <span>{appt.patientName}</span>
                      <span className="text-xs text-slate-500 font-normal">({appt.patientAge}y, {appt.patientGender})</span>
                    </h4>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isGoa ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}>
                      {isGoa ? 'Goa Branch (Quepem)' : 'Belgaum Clinic'}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {appt.consultationType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#2D5A50]" />
                        <span>{appt.appointmentDate}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{appt.appointmentTime}</span>
                      </div>
                    </div>

                    {/* Quick Status Pill */}
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                      appt.status === 'Confirmed'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : appt.status === 'Rescheduled'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : appt.status === 'Completed'
                        ? 'bg-sky-100 text-sky-900 border border-sky-200'
                        : 'bg-rose-100 text-rose-900 border border-rose-200'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Doctor</span>
                    <span className="font-semibold text-slate-800">{doc?.name || 'Dr. Dravid'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Phone</span>
                    <a href={`tel:${appt.patientPhone}`} className="font-semibold text-slate-800 hover:text-[#2D5A50] underline">
                      {appt.patientPhone}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Email</span>
                    <span className="font-medium text-slate-700 truncate block">{appt.patientEmail || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Chief Complaint</span>
                    <span className="font-medium text-slate-800 line-clamp-1">{appt.healthConcern || 'General health check'}</span>
                  </div>
                </div>

                {/* Actions Row (WhatsApp, Reschedule/Edit, Status, Delete) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  {/* Left: Quick Communication */}
                  <div className="flex items-center gap-2">
                    <a
                      href={getWhatsAppLink(appt)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-800 font-bold border border-green-200 transition-colors"
                      title="Send WhatsApp appointment confirmation / reminder"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                      <span>WhatsApp Patient</span>
                    </a>

                    <a
                      href={`tel:${appt.patientPhone}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span>Call</span>
                    </a>
                  </div>

                  {/* Right: Quick Status dropdown and Edit */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                      <select
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt.id, e.target.value as any)}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Rescheduled">Rescheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(appt)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#2D5A50] font-bold border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Change / Reschedule</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(appt.id, appt.patientName)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete appointment record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
