import React, { useState } from 'react';
import { Doctor } from '../../types';
import { 
  Stethoscope, 
  Plus, 
  CheckCircle, 
  Edit3, 
  X, 
  Upload, 
  Check, 
  GraduationCap, 
  Award, 
  Trash2,
  Loader2,
  Cloud
} from 'lucide-react';
import { uploadFileToStorage } from '../../services/supabaseService';

interface AdminDoctorsTabProps {
  doctors: Doctor[];
  onUpdateDoctor: (doc: Doctor) => void;
  onAddDoctor: (doc: Doctor) => void;
  onDeleteDoctor: (id: string) => void;
}

export const AdminDoctorsTab: React.FC<AdminDoctorsTabProps> = ({
  doctors,
  onUpdateDoctor,
  onAddDoctor,
  onDeleteDoctor,
}) => {
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [isAddingNewDoctor, setIsAddingNewDoctor] = useState(false);
  const [docName, setDocName] = useState('');
  const [docDesignation, setDocDesignation] = useState('');
  const [docQualification, setDocQualification] = useState('');
  const [docRole, setDocRole] = useState('');
  const [docExperience, setDocExperience] = useState<number>(20);
  const [docImage, setDocImage] = useState('');
  const [docBio, setDocBio] = useState('');
  const [docDepartment, setDocDepartment] = useState('');
  const [docAcademicAffiliation, setDocAcademicAffiliation] = useState('');
  const [docSpecializations, setDocSpecializations] = useState('');
  const [doctorSuccessMessage, setDoctorSuccessMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const showSuccess = (msg: string) => {
    setDoctorSuccessMessage(msg);
    setTimeout(() => setDoctorSuccessMessage(''), 3500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image exceeds 5MB limit.');
        return;
      }
      setIsUploading(true);
      try {
        const url = await uploadFileToStorage(file, 'doctors');
        if (url) {
          setter(url);
          showSuccess('Doctor photo uploaded to Supabase Storage!');
        }
      } catch (err) {
        console.error('Doctor photo upload failed:', err);
        alert('Image upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleStartEditDoctor = (doctor: Doctor) => {
    setEditingDoctorId(doctor.id);
    setIsAddingNewDoctor(false);
    setDocName(doctor.name);
    setDocDesignation(doctor.designation);
    setDocQualification(doctor.qualification);
    setDocRole(doctor.role);
    setDocExperience(doctor.experienceYears);
    setDocImage(doctor.image);
    setDocBio(doctor.bio);
    setDocDepartment(doctor.department || '');
    setDocAcademicAffiliation(doctor.academicAffiliation || '');
    setDocSpecializations(doctor.specializations.join(', '));
  };

  const handleStartAddDoctor = () => {
    setEditingDoctorId(null);
    setIsAddingNewDoctor(true);
    setDocName('');
    setDocDesignation('Homoeopathic Consultant & Professor');
    setDocQualification('B.H.M.S, M.D. (Hom)');
    setDocRole('Senior Faculty & Physician');
    setDocExperience(15);
    setDocImage('');
    setDocBio('');
    setDocDepartment('Department of Clinical Homoeopathy');
    setDocAcademicAffiliation('Bharatesh Homeopathic Medical College & Hospital, Belgaum');
    setDocSpecializations('Constitutional Homeopathy, Chronic Disorders');
  };

  const handleCancelDoctorEdit = () => {
    setEditingDoctorId(null);
    setIsAddingNewDoctor(false);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docDesignation.trim()) {
      alert('Please provide doctor name and designation.');
      return;
    }

    const specsArray = docSpecializations
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (editingDoctorId) {
      const updated: Doctor = {
        id: editingDoctorId,
        name: docName.trim(),
        designation: docDesignation.trim(),
        qualification: docQualification.trim(),
        role: docRole.trim() || 'Consultant Homoeopath',
        experienceYears: Number(docExperience) || 10,
        image: docImage || '',
        bio: docBio.trim(),
        department: docDepartment.trim(),
        academicAffiliation: docAcademicAffiliation.trim(),
        specializations: specsArray.length > 0 ? specsArray : ['Constitutional Homoeopathy'],
      };
      const ok = await onUpdateDoctor(updated);
      if (!ok) {
        alert('Failed to save doctor. Please try again.');
        return;
      }
      showSuccess(`Profile for "${docName}" updated successfully!`);
    } else {
      const newId = `doc-${Date.now().toString().slice(-4)}`;
      const created: Doctor = {
        id: newId,
        name: docName.trim(),
        designation: docDesignation.trim(),
        qualification: docQualification.trim(),
        role: docRole.trim() || 'Consultant Homoeopath',
        experienceYears: Number(docExperience) || 10,
        image: docImage || '',
        bio: docBio.trim(),
        department: docDepartment.trim(),
        academicAffiliation: docAcademicAffiliation.trim(),
        specializations: specsArray.length > 0 ? specsArray : ['Constitutional Homoeopathy'],
      };
      const ok = await onAddDoctor(created);
      if (!ok) {
        alert('Failed to add doctor. Please try again.');
        return;
      }
      showSuccess(`New doctor "${docName}" added successfully!`);
    }

    setEditingDoctorId(null);
    setIsAddingNewDoctor(false);
  };

  return (
    <div className="p-6 overflow-y-auto space-y-8 flex-1">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#2D5A50]" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif-display">
              Manage Doctors, Faculty & Leadership Profiles
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Upload photos from your device, update academic titles, professorships, qualifications, clinical bios, and specializations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleStartAddDoctor}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Doctor</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {doctorSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{doctorSuccessMessage}</span>
        </div>
      )}

      {/* Add / Edit Doctor Form */}
      {(isAddingNewDoctor || editingDoctorId) && (
        <div id="doctor-edit-form" className="p-6 rounded-3xl bg-slate-50 border-2 border-emerald-300/80 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#2D5A50]" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display">
                {isAddingNewDoctor ? 'Add New Doctor Profile' : 'Edit Doctor Profile & Photo'}
              </h4>
            </div>
            <button
              type="button"
              onClick={handleCancelDoctorEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveDoctor} className="space-y-6 text-xs sm:text-sm">
            {/* Top section: Photo and Core Identity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Doctor Photo Management */}
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
                <label className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Doctor Photo Preview
                </label>

                <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-md border-2 border-[#2D5A50]/40 bg-slate-100 shrink-0">
                  <img
                    src={docImage || ''}
                    alt="Doctor Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
                    }}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-[#0f2420]/90 text-[10px] text-emerald-300 font-bold py-1 px-1 truncate">
                    {docRole || 'Doctor'}
                  </div>
                </div>

                {/* Upload from device */}
                <div className="w-full space-y-2">
                  <label className="block w-full">
                    <span className="sr-only">Choose doctor photo</span>
                    <div className={`flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl font-bold text-xs border border-emerald-200 cursor-pointer transition-colors ${
                      isUploading ? 'bg-emerald-100 text-[#2D5A50] opacity-80 cursor-wait' : 'bg-emerald-50 hover:bg-emerald-100 text-[#2D5A50]'
                    }`}>
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#2D5A50]" />
                          <span>Uploading to Supabase Storage...</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4 text-[#2D5A50]" />
                          <Upload className="w-4 h-4" />
                          <span>Upload Photo</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(e, setDocImage)}
                      className="hidden"
                    />
                  </label>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block text-left mb-1">
                      Or Image URL / Path:
                    </label>
                    <input
                      type="text"
                      placeholder="Enter image URL (or upload above)"
                      value={docImage}
                      onChange={(e) => setDocImage(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Columns 2 & 3: Doctor Details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Doctor Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Prof. Dr. Yogesh Dravid"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Badge / Role Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. HOD Physiology or Prof. Homoeopathic Pharmacy"
                      value={docRole}
                      onChange={(e) => setDocRole(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Designation *</label>
                    <input
                      type="text"
                      placeholder="e.g. HOD Department of Physiology & Professor"
                      value={docDesignation}
                      onChange={(e) => setDocDesignation(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Qualifications *</label>
                    <input
                      type="text"
                      placeholder="e.g. B.H.M.S, M.D. (Hom), Senior Practitioner"
                      value={docQualification}
                      onChange={(e) => setDocQualification(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Years of Experience</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={docExperience}
                      onChange={(e) => setDocExperience(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Academic Affiliation / College</label>
                    <input
                      type="text"
                      placeholder="Bharatesh Homeopathic Medical College & Hospital, Belgaum"
                      value={docAcademicAffiliation}
                      onChange={(e) => setDocAcademicAffiliation(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Department of Human Physiology & Clinical Homoeopathy"
                    value={docDepartment}
                    onChange={(e) => setDocDepartment(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Doctor Profile & Clinical Biography *
              </label>
              <textarea
                rows={4}
                placeholder="Write detailed background, clinical philosophy, research contributions, and patient care approach..."
                value={docBio}
                onChange={(e) => setDocBio(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-300 bg-white leading-relaxed text-xs sm:text-sm"
                required
              />
            </div>

            {/* Specializations */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Areas of Clinical Expertise (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Chronic Skin Disorders, Pediatric Allergies, Hormonal Imbalances, Respiratory Health"
                value={docSpecializations}
                onChange={(e) => setDocSpecializations(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {docSpecializations.split(',').map((s, i) => s.trim() && (
                  <span key={i} className="text-[11px] bg-emerald-50 text-[#2D5A50] border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                    ✓ {s.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isAddingNewDoctor ? 'Add Doctor Profile' : 'Save Changes & Update Doctor'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancelDoctorEdit}
                className="px-5 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listed Doctors Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-sm sm:text-base font-serif-display flex items-center gap-2">
            <span>Currently Listed Doctors & Faculty ({doctors.length})</span>
          </h4>
          <span className="text-xs text-slate-500">
            Changes update live across the entire website and booking portal
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {doctors.length === 0 && (
            <div className="lg:col-span-2 p-10 rounded-3xl bg-white border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-semibold">No doctors available yet.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add New Doctor" to create the first profile.</p>
            </div>
          )}
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className={`p-6 rounded-3xl bg-white border transition-all shadow-2xs flex flex-col justify-between space-y-5 ${
                editingDoctorId === doctor.id
                  ? 'border-[#2D5A50] ring-2 ring-[#2D5A50]/20'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-sm border border-slate-200 shrink-0 bg-slate-100">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
                      }}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-[#0f2420]/95 text-[9px] text-emerald-300 font-bold py-0.5 text-center truncate px-1">
                      {doctor.role || 'Doctor'}
                    </div>
                  </div>

                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <h5 className="text-lg font-bold text-slate-900 font-serif-display">
                      {doctor.name}
                    </h5>
                    <p className="text-xs font-semibold text-[#2D5A50]">
                      {doctor.designation}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {doctor.qualification}
                    </p>
                    {doctor.academicAffiliation && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200 mt-1">
                        <GraduationCap className="w-3.5 h-3.5 inline text-[#2D5A50] mr-1" />
                        <span className="font-semibold">{doctor.role}</span> &bull; {doctor.academicAffiliation}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {doctor.bio}
                </p>

                {doctor.specializations && doctor.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {doctor.specializations.slice(0, 4).map((s, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {s}
                      </span>
                    ))}
                    {doctor.specializations.length > 4 && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                        +{doctor.specializations.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span><strong>{doctor.experienceYears}+ Yrs</strong> Experience</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleStartEditDoctor(doctor);
                      const elem = document.getElementById('doctor-edit-form');
                      elem?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#2D5A50] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Info & Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete profile for "${doctor.name}"?`)) {
                        onDeleteDoctor(doctor.id);
                        showSuccess(`Doctor "${doctor.name}" removed.`);
                      }
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Doctor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
