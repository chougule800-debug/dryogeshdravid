import React, { useState } from 'react';
import { Database, Download, Upload, CheckCircle } from 'lucide-react';
import { Doctor, PrePostCase, GalleryItem, BlogPost, ClinicLocation, ClinicalServiceItem, Testimonial } from '../../types';

interface AdminBackupTabProps {
  doctors: Doctor[];
  prePostCases: PrePostCase[];
  galleryItems: GalleryItem[];
  blogPosts: BlogPost[];
  clinics: ClinicLocation[];
  services: ClinicalServiceItem[];
  testimonials: Testimonial[];
  onRestoreAllData: (data: any) => void;
}

export const AdminBackupTab: React.FC<AdminBackupTabProps> = ({
  doctors,
  prePostCases,
  galleryItems,
  blogPosts,
  clinics,
  services,
  testimonials,
  onRestoreAllData,
}) => {
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      clinicName: "Dr. Dravid's Homoeopathic Clinic",
      doctors,
      prePostCases,
      galleryItems,
      blogPosts,
      clinics,
      services,
      testimonials,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Dr_Dravid_Clinic_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showSuccess('Complete Clinic Backup JSON exported successfully!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.doctors || parsed.prePostCases) {
          onRestoreAllData(parsed);
          showSuccess('Full clinic data restored successfully from backup file!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 overflow-y-auto space-y-6 flex-1">
      <div className="p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200/70">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#2D5A50]" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif-display">
            Data Backup, Sync & Cloud Restore
          </h3>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Export full clinic records (Doctors, Pre-Post Cases, Gallery, Articles, Clinic Details) into a secure JSON backup, or restore previous data.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D5A50] flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">1-Click Full Backup</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Downloads a snapshot containing all {doctors.length} doctors, {prePostCases.length} clinical cases, {galleryItems.length} photos, and {blogPosts.length} blog articles.
            </p>
          </div>
          <button onClick={handleExportBackup} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2D5A50] hover:bg-[#20423a] text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-colors">
            <Download className="w-4 h-4" />
            <span>Download Backup (.json)</span>
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">Restore from Backup</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload a previously exported JSON backup file to overwrite or restore clinic information immediately.
            </p>
          </div>
          <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs sm:text-sm font-bold border border-sky-200 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Select Backup File</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};