import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  X, 
  Calendar, 
  Stethoscope, 
  Images, 
  BookOpen, 
  Sparkles, 
  Building2, 
  Activity, 
  Quote, 
  Database,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  Appointment, 
  BlogPost, 
  ClinicLocation, 
  ClinicalServiceItem, 
  Doctor, 
  GalleryItem, 
  PrePostCase, 
  Testimonial 
} from '../types';
import { AdminDoctorsTab } from './admin/AdminDoctorsTab';
import { AdminAppointmentsTab } from './admin/AdminAppointmentsTab';
import { AdminPrePostTab } from './admin/AdminPrePostTab';
import { AdminGalleryTab } from './admin/AdminGalleryTab';
import { AdminBlogTab } from './admin/AdminBlogTab';
import { AdminClinicsTab } from './admin/AdminClinicsTab';
import { AdminTreatmentsTab } from './admin/AdminTreatmentsTab';
import { AdminTestimonialsTab } from './admin/AdminTestimonialsTab';
import { AdminBackupTab } from './admin/AdminBackupTab';

// Admin login credentials are stored here in the codebase only (per the owner's
// explicit requirement). Never move these into .env, localStorage, or any store.
const ADMIN_EMAIL = 'admin@doc.com';
const ADMIN_PASSWORD = 'admin@123';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminLoggedIn: boolean;
  onAuthenticated: () => void;
  onSignOut: () => void;
  // Appointments
  appointments: Appointment[];
  onUpdateAppointments: (appts: Appointment[]) => void;
  // Doctors
  doctors: Doctor[];
  onUpdateDoctor: (doc: Doctor) => void;
  onAddDoctor: (doc: Doctor) => void;
  onDeleteDoctor: (id: string) => void;
  // PrePost Cases
  prePostCases: PrePostCase[];
  onAddPrePostCase: (c: PrePostCase) => void;
  onUpdatePrePostCase: (c: PrePostCase) => void;
  onDeletePrePostCase: (id: string) => void;
  // Gallery
  galleryItems: GalleryItem[];
  onAddGalleryItem: (item: GalleryItem) => void;
  onUpdateGalleryItem: (item: GalleryItem) => void;
  onDeleteGalleryItem: (id: string) => void;
  // Blog
  blogPosts: BlogPost[];
  onAddBlogPost: (post: BlogPost) => void;
  onUpdateBlogPost: (post: BlogPost) => void;
  onDeleteBlogPost: (id: string) => void;
  // Clinics
  clinics: ClinicLocation[];
  onUpdateClinics: (clinics: ClinicLocation[]) => void;
  // Services
  services: ClinicalServiceItem[];
  onUpdateServices: (services: ClinicalServiceItem[]) => void;
  // Testimonials
  testimonials: Testimonial[];
  onUpdateTestimonials: (testimonials: Testimonial[]) => void;
  // Restore
  onRestoreAllData: (data: any) => void;
}

export type AdminTabType = 
  | 'doctors' 
  | 'appointments' 
  | 'prepost' 
  | 'gallery' 
  | 'blog' 
  | 'clinics' 
  | 'treatments' 
  | 'testimonials' 
  | 'backup';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  isAdminLoggedIn,
  onAuthenticated,
  onSignOut,
  appointments,
  onUpdateAppointments,
  doctors,
  onUpdateDoctor,
  onAddDoctor,
  onDeleteDoctor,
  prePostCases,
  onAddPrePostCase,
  onUpdatePrePostCase,
  onDeletePrePostCase,
  galleryItems,
  onAddGalleryItem,
  onUpdateGalleryItem,
  onDeleteGalleryItem,
  blogPosts,
  onAddBlogPost,
  onUpdateBlogPost,
  onDeleteBlogPost,
  clinics,
  onUpdateClinics,
  services,
  onUpdateServices,
  testimonials,
  onUpdateTestimonials,
  onRestoreAllData,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTabType>('doctors');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setPassword('');
      setAuthError('');
      onAuthenticated();
    } else {
      setAuthError('Invalid email or password. Access denied.');
    }
  };

  const handleLogout = () => {
    setPassword('');
    setAuthError('');
    onSignOut();
  };

  const navTabs: { id: AdminTabType; label: string; icon: any; count?: number }[] = [
    { id: 'doctors', label: 'Doctors & Faculty', icon: Stethoscope, count: doctors.length },
    { id: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
    { id: 'prepost', label: 'Pre-Post Cases', icon: Sparkles, count: prePostCases.length },
    { id: 'gallery', label: 'Photo Gallery', icon: Images, count: galleryItems.length },
    { id: 'blog', label: 'Blog & Articles', icon: BookOpen, count: blogPosts.length },
    { id: 'clinics', label: 'Clinics & Timings', icon: Building2, count: clinics.length },
    { id: 'treatments', label: 'Specialties', icon: Activity, count: services.length },
    { id: 'testimonials', label: 'Reviews', icon: Quote, count: testimonials.length },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative">
        {/* Top Title Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif-display tracking-tight text-white">
                  Clinic Administration & CMS Portal
                </h2>
                {isAdminLoggedIn ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Live Master Control
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Protected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Dr. Dravid's Homoeopathic Clinic &bull; Belgaum Main & Goa Quepem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                title="Lock Portal"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Lock Portal</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Authentication Gate (if locked) */}
        {!isAdminLoggedIn ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#2D5A50] mx-auto flex items-center justify-center shadow-inner">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 font-serif-display">
                  Admin Sign In Required
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Sign in with an authorized administrator account to manage clinic records, doctors, and content.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-center p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D5A50] text-slate-900"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-center p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2D5A50] text-slate-900"
                    required
                  />
                  {authError && <p className="text-xs text-rose-600 font-bold mt-2">{authError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Authenticate & Enter</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Horizontal Tabs Header Bar */}
            <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-thin">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as AdminTabType)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-white text-[#2D5A50] shadow-sm border border-slate-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#2D5A50]' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Body View */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {activeTab === 'doctors' && (
                <AdminDoctorsTab
                  doctors={doctors}
                  onUpdateDoctor={onUpdateDoctor}
                  onAddDoctor={onAddDoctor}
                  onDeleteDoctor={onDeleteDoctor}
                />
              )}

              {activeTab === 'appointments' && (
                <AdminAppointmentsTab
                  appointments={appointments}
                  doctors={doctors}
                  onUpdateAppointments={onUpdateAppointments}
                />
              )}

              {activeTab === 'prepost' && (
                <AdminPrePostTab
                  prePostCases={prePostCases}
                  onAddPrePostCase={onAddPrePostCase}
                  onUpdatePrePostCase={onUpdatePrePostCase}
                  onDeletePrePostCase={onDeletePrePostCase}
                />
              )}

              {activeTab === 'gallery' && (
                <AdminGalleryTab
                  galleryItems={galleryItems}
                  onAddGalleryItem={onAddGalleryItem}
                  onUpdateGalleryItem={onUpdateGalleryItem}
                  onDeleteGalleryItem={onDeleteGalleryItem}
                />
              )}

              {activeTab === 'blog' && (
                <AdminBlogTab
                  blogPosts={blogPosts}
                  onAddBlogPost={onAddBlogPost}
                  onUpdateBlogPost={onUpdateBlogPost}
                  onDeleteBlogPost={onDeleteBlogPost}
                />
              )}

              {activeTab === 'clinics' && (
                <AdminClinicsTab
                  clinics={clinics}
                  onUpdateClinics={onUpdateClinics}
                />
              )}

              {activeTab === 'treatments' && (
                <AdminTreatmentsTab
                  services={services}
                  onUpdateServices={onUpdateServices}
                />
              )}

              {activeTab === 'testimonials' && (
                <AdminTestimonialsTab
                  testimonials={testimonials}
                  onUpdateTestimonials={onUpdateTestimonials}
                />
              )}

              {activeTab === 'backup' && (
                <AdminBackupTab
                  doctors={doctors}
                  appointments={appointments}
                  prePostCases={prePostCases}
                  galleryItems={galleryItems}
                  blogPosts={blogPosts}
                  clinics={clinics}
                  services={services}
                  testimonials={testimonials}
                  onRestoreAllData={onRestoreAllData}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
