import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  X,
  Stethoscope,
  Images,
  BookOpen,
  Sparkles,
  Building2,
  Activity,
  Quote,
  Database,
  ShieldCheck,
} from 'lucide-react';
import {
  BlogPost,
  ClinicLocation,
  ClinicalServiceItem,
  Doctor,
  GalleryItem,
  PrePostCase,
  Testimonial,
} from '../types';
import { supabase } from '../lib/supabase';
import { AdminDoctorsTab } from './admin/AdminDoctorsTab';
import { AdminPrePostTab } from './admin/AdminPrePostTab';
import { AdminGalleryTab } from './admin/AdminGalleryTab';
import { AdminBlogTab } from './admin/AdminBlogTab';
import { AdminClinicsTab } from './admin/AdminClinicsTab';
import { AdminTreatmentsTab } from './admin/AdminTreatmentsTab';
import { AdminTestimonialsTab } from './admin/AdminTestimonialsTab';
import { AdminBackupTab } from './admin/AdminBackupTab';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminLoggedIn: boolean;
  onAuthenticated: () => void;
  onSignOut: () => void;
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
  onAddService: (s: ClinicalServiceItem) => void;
  onUpdateService: (s: ClinicalServiceItem) => void;
  onDeleteService: (id: string) => void;
  // Testimonials
  testimonials: Testimonial[];
  onAddTestimonial: (t: Testimonial) => void;
  onUpdateTestimonial: (t: Testimonial) => void;
  onDeleteTestimonial: (id: string) => void;
  // Restore
  onRestoreAllData: (data: any) => void;
}

export type AdminTabType =
  | 'doctors'
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
  doctors = [],
  onUpdateDoctor,
  onAddDoctor,
  onDeleteDoctor,
  prePostCases = [],
  onAddPrePostCase,
  onUpdatePrePostCase,
  onDeletePrePostCase,
  galleryItems = [],
  onAddGalleryItem,
  onUpdateGalleryItem,
  onDeleteGalleryItem,
  blogPosts = [],
  onAddBlogPost,
  onUpdateBlogPost,
  onDeleteBlogPost,
  clinics = [],
  onUpdateClinics,
  services = [],
  onAddService,
  onUpdateService,
  onDeleteService,
  testimonials = [],
  onAddTestimonial,
  onUpdateTestimonial,
  onDeleteTestimonial,
  onRestoreAllData,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTabType>('doctors');

  // Check auth state on mount
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Verify admin status by calling is_admin() via RPC
        const { data, error } = await supabase.rpc('is_admin');
        if (data === true) {
          onAuthenticated();
        } else {
          // User is not admin, sign out
          await supabase.auth.signOut();
        }
      }
    };
    if (isOpen) {
      checkSession();
    }
  }, [isOpen, onAuthenticated]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      if (error) throw error;
      // Check admin status
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (adminError) throw adminError;
      if (isAdmin) {
        setPassword('');
        setAuthError('');
        onAuthenticated();
      } else {
        // Sign out if not admin
        await supabase.auth.signOut();
        setAuthError('You are not authorized as an administrator.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPassword('');
    setAuthError('');
    onSignOut();
  };

  const navTabs: { id: AdminTabType; label: string; icon: any; count?: number }[] = [
    { id: 'doctors', label: 'Doctors & Faculty', icon: Stethoscope, count: doctors.length },
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
        {/* Top Title Bar - responsive padding */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold font-serif-display tracking-tight text-white">
                  Clinic Admin
                </h2>
                {isAdminLoggedIn ? (
                  <span className="text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Live
                  </span>
                ) : (
                  <span className="text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Locked
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400">
                Dr. Dravid's Homoeopathic Clinic &bull; Belgaum Main & Goa Quepem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] sm:text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                title="Lock Portal"
              >
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Lock Portal</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Admin Panel"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Authentication Gate */}
        {!isAdminLoggedIn ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#2D5A50] mx-auto flex items-center justify-center shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 font-serif-display">
                  Admin Sign In
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Sign in with an authorized administrator account.
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
                    required
                    autoFocus
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
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#2D5A50] hover:bg-[#20423a] text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Authenticating...'
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Horizontal Tabs Header Bar - scrollable on mobile */}
            <div className="bg-slate-100/90 border-b border-slate-200 px-2 sm:px-4 py-2 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-thin">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-white text-[#2D5A50] shadow-sm border border-slate-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                    }`}
                  >
                    <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${isActive ? 'text-[#2D5A50]' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`text-[8px] sm:text-[10px] px-1 py-0.2 rounded-full font-semibold ${
                          isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
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
                <AdminClinicsTab clinics={clinics} onUpdateClinics={onUpdateClinics} />
              )}

              {activeTab === 'treatments' && (
                <AdminTreatmentsTab
                  services={services}
                  onAddService={onAddService}
                  onUpdateService={onUpdateService}
                  onDeleteService={onDeleteService}
                />
              )}

              {activeTab === 'testimonials' && (
                <AdminTestimonialsTab
                  testimonials={testimonials}
                  onAddTestimonial={onAddTestimonial}
                  onUpdateTestimonial={onUpdateTestimonial}
                  onDeleteTestimonial={onDeleteTestimonial}
                />
              )}

              {activeTab === 'backup' && (
                <AdminBackupTab
                  doctors={doctors}
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