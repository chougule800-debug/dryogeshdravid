/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Appointment, 
  PrePostCase, 
  GalleryItem, 
  BlogPost, 
  Doctor,
  ClinicLocation,
  ClinicalServiceItem,
  Testimonial,
  ClinicBranchId 
} from './types';
import { 
  saveDocumentToSupabase, 
  deleteDocumentFromSupabase 
} from './services/supabaseService';
import { useSupabaseCollection } from './hooks/useSupabaseCollection';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { DoctorsSection } from './components/DoctorsSection';
import { ClinicsSection } from './components/ClinicsSection';
import { TreatmentsSection } from './components/TreatmentsSection';
import { PrePostGallery } from './components/PrePostGallery';
import { GallerySection } from './components/GallerySection';
import { BlogSection } from './components/BlogSection';
import { TestimonialsMarquee } from './components/TestimonialsMarquee';
import { AppointmentModal } from './components/AppointmentModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { WhatsAppChatBot } from './components/WhatsAppChatBot';
import { 
  Calendar, 
  Star, 
  Quote, 
  Sparkles,
  ArrowUp
} from 'lucide-react';

export default function App() {
  // ------------------------------------------------------------------
  // Supabase is the single source of truth. React state is a temporary
  // projection of the real-time listeners — NOT a database.
  // ------------------------------------------------------------------
  const doctorsState = useSupabaseCollection<Doctor>('doctors');
  const appointmentsState = useSupabaseCollection<Appointment>('appointments');
  const prePostCasesState = useSupabaseCollection<PrePostCase>('prepost');
  const galleryItemsState = useSupabaseCollection<GalleryItem>('gallery');
  const blogPostsState = useSupabaseCollection<BlogPost>('blog');
  const clinicsState = useSupabaseCollection<ClinicLocation>('clinics');
  const servicesState = useSupabaseCollection<ClinicalServiceItem>('services');
  const testimonialsState = useSupabaseCollection<Testimonial>('testimonials');

  const doctors = doctorsState.data;
  const appointments = appointmentsState.data;
  const prePostCases = prePostCasesState.data;
  const galleryItems = galleryItemsState.data;
  const blogPosts = blogPostsState.data;
  const clinics = clinicsState.data;
  const services = servicesState.data;
  const testimonials = testimonialsState.data;

  // Admin auth — local login. Credentials live in the codebase (AdminPanel.tsx),
  // not in .env or Supabase Auth. Only a boolean flag is remembered in sessionStorage
  // so a refresh keeps the owner signed in; credentials are never persisted.
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    () => sessionStorage.getItem('dr_admin_logged_in') === 'true'
  );
  const handleAdminLogin = () => {
    sessionStorage.setItem('dr_admin_logged_in', 'true');
    setIsAdminLoggedIn(true);
  };
  const handleAdminLogout = () => {
    sessionStorage.removeItem('dr_admin_logged_in');
    setIsAdminLoggedIn(false);
  };

  // Modal controls
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingBranch, setBookingBranch] = useState<ClinicBranchId>('belgaum');
  const [bookingDoctorId, setBookingDoctorId] = useState<string | undefined>(undefined);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ------------------------------------------------------------------
  // Admin CRUD — writes go straight to Supabase. The real-time listener
  // updates the UI; there is no secondary local database and no optimistic
  // setState. Each handler reports success so the UI can show an error.
  // ------------------------------------------------------------------
  const handleUpdateDoctor = async (updatedDoctor: Doctor): Promise<boolean> =>
    saveDocumentToSupabase('doctors', updatedDoctor);

  const handleAddDoctor = async (newDoctor: Doctor): Promise<boolean> =>
    saveDocumentToSupabase('doctors', newDoctor);

  const handleDeleteDoctor = async (id: string): Promise<boolean> =>
    deleteDocumentFromSupabase('doctors', id);

  const handleAddPrePostCase = async (newCase: PrePostCase): Promise<boolean> =>
    saveDocumentToSupabase('prepost', newCase);

  const handleUpdatePrePostCase = async (updated: PrePostCase): Promise<boolean> =>
    saveDocumentToSupabase('prepost', updated);

  const handleDeletePrePostCase = async (id: string): Promise<boolean> =>
    deleteDocumentFromSupabase('prepost', id);

  const handleAddGalleryItem = async (newItem: GalleryItem): Promise<boolean> =>
    saveDocumentToSupabase('gallery', newItem);

  const handleUpdateGalleryItem = async (updated: GalleryItem): Promise<boolean> =>
    saveDocumentToSupabase('gallery', updated);

  const handleDeleteGalleryItem = async (id: string): Promise<boolean> =>
    deleteDocumentFromSupabase('gallery', id);

  const handleAddBlogPost = async (newPost: BlogPost): Promise<boolean> =>
    saveDocumentToSupabase('blog', newPost);

  const handleUpdateBlogPost = async (updated: BlogPost): Promise<boolean> =>
    saveDocumentToSupabase('blog', updated);

  const handleDeleteBlogPost = async (id: string): Promise<boolean> =>
    deleteDocumentFromSupabase('blog', id);

  const handleUpdateClinics = async (updatedClinics: ClinicLocation[]): Promise<boolean> => {
    const results = await Promise.all(
      updatedClinics.map((c) => saveDocumentToSupabase('clinics', c))
    );
    return results.every(Boolean);
  };

  const handleUpdateServices = async (updatedServices: ClinicalServiceItem[]): Promise<boolean> => {
    const results = await Promise.all(
      updatedServices.map((s) => saveDocumentToSupabase('services', s))
    );
    return results.every(Boolean);
  };

  const handleUpdateTestimonials = async (updatedTestimonials: Testimonial[]): Promise<boolean> => {
    const results = await Promise.all(
      updatedTestimonials.map((t) => saveDocumentToSupabase('testimonials', t))
    );
    return results.every(Boolean);
  };

  const handleUpdateAppointments = async (updatedAppts: Appointment[]): Promise<boolean> => {
    const results = await Promise.all(
      updatedAppts.map((a) => saveDocumentToSupabase('appointments', a))
    );
    return results.every(Boolean);
  };

  // Restore from an imported backup — write everything to Supabase.
  const handleRestoreAllData = async (data: any): Promise<void> => {
    const writers: Promise<boolean>[] = [];
    if (data.doctors) for (const d of data.doctors) writers.push(saveDocumentToSupabase('doctors', d));
    if (data.appointments) for (const a of data.appointments) writers.push(saveDocumentToSupabase('appointments', a));
    if (data.prePostCases) for (const c of data.prePostCases) writers.push(saveDocumentToSupabase('prepost', c));
    if (data.galleryItems) for (const g of data.galleryItems) writers.push(saveDocumentToSupabase('gallery', g));
    if (data.blogPosts) for (const b of data.blogPosts) writers.push(saveDocumentToSupabase('blog', b));
    if (data.clinics) for (const cl of data.clinics) writers.push(saveDocumentToSupabase('clinics', cl));
    if (data.services) for (const s of data.services) writers.push(saveDocumentToSupabase('services', s));
    if (data.testimonials) for (const t of data.testimonials) writers.push(saveDocumentToSupabase('testimonials', t));
    await Promise.all(writers);
  };

  const handleOpenBooking = (branch: ClinicBranchId = 'belgaum', docId?: string) => {
    setBookingBranch(branch);
    if (docId) setBookingDoctorId(docId);
    setBookingModalOpen(true);
  };

  const handleSaveAppointment = async (newAppt: Appointment): Promise<boolean> =>
    saveDocumentToSupabase('appointments', newAppt);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col selection:bg-emerald-200 selection:text-emerald-950 font-sans">
      {/* Navigation Bar */}
      <Navbar
        onOpenBooking={(branch) => handleOpenBooking(branch || 'belgaum')}
        onOpenAdmin={() => setAdminModalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        clinics={clinics}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onBookAppointment={() => handleOpenBooking('belgaum')}
          onExploreCases={() => {
            const elem = document.getElementById('pre-post');
            elem?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Doctors Section */}
        <DoctorsSection
          doctors={doctors}
          loading={doctorsState.loading}
          error={doctorsState.error}
          onBookWithDoctor={(docId) => handleOpenBooking('belgaum', docId)}
        />

        {/* Clinics & Timings Section */}
        <ClinicsSection
          clinics={clinics}
          loading={clinicsState.loading}
          error={clinicsState.error}
          onBookBranch={(branchId) => handleOpenBooking(branchId)}
        />

        {/* Clinical Treatments */}
        <TreatmentsSection
          services={services}
          loading={servicesState.loading}
          error={servicesState.error}
          onConsultCategory={() => handleOpenBooking('belgaum')}
        />

        {/* Pre & Post Cases (Before/After) */}
        <PrePostGallery
          cases={prePostCases}
          loading={prePostCasesState.loading}
          error={prePostCasesState.error}
          onOpenBooking={() => handleOpenBooking('belgaum')}
        />

        {/* Photo Gallery */}
        <GallerySection
          items={galleryItems}
          loading={galleryItemsState.loading}
          error={galleryItemsState.error}
          onOpenBooking={() => handleOpenBooking('belgaum')}
        />

        {/* Patient Testimonials Marquee (Flowing Left to Right) */}
        <TestimonialsMarquee
          testimonials={testimonials}
          loading={testimonialsState.loading}
          error={testimonialsState.error}
          onOpenBooking={() => handleOpenBooking('belgaum')}
        />

        {/* Blog & Educational Articles */}
        <BlogSection
          posts={blogPosts}
          loading={blogPostsState.loading}
          error={blogPostsState.error}
          onOpenBooking={() => handleOpenBooking('belgaum')}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenBooking={() => handleOpenBooking('belgaum')}
        onOpenAdmin={() => setAdminModalOpen(true)}
        clinics={clinics}
      />

      {/* Floating Scroll To Top on Left Side */}
      {showScrollTop && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 rounded-full bg-stone-800/80 hover:bg-stone-900 text-white shadow-md flex items-center justify-center transition-all cursor-pointer"
            title="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* WhatsApp Chatbot Widget on Right Side */}
      <WhatsAppChatBot clinics={clinics} />

      {/* Modals */}
      <AppointmentModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialBranch={bookingBranch}
        initialDoctorId={bookingDoctorId}
        doctors={doctors}
        clinics={clinics}
        onSaveAppointment={handleSaveAppointment}
      />

      <AdminPanel
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        isAdminLoggedIn={isAdminLoggedIn}
        onAuthenticated={handleAdminLogin}
        onSignOut={handleAdminLogout}
        appointments={appointments}
        onUpdateAppointments={handleUpdateAppointments}
        doctors={doctors}
        onUpdateDoctor={handleUpdateDoctor}
        onAddDoctor={handleAddDoctor}
        onDeleteDoctor={handleDeleteDoctor}
        prePostCases={prePostCases}
        onAddPrePostCase={handleAddPrePostCase}
        onUpdatePrePostCase={handleUpdatePrePostCase}
        onDeletePrePostCase={handleDeletePrePostCase}
        galleryItems={galleryItems}
        onAddGalleryItem={handleAddGalleryItem}
        onUpdateGalleryItem={handleUpdateGalleryItem}
        onDeleteGalleryItem={handleDeleteGalleryItem}
        blogPosts={blogPosts}
        onAddBlogPost={handleAddBlogPost}
        onUpdateBlogPost={handleUpdateBlogPost}
        onDeleteBlogPost={handleDeleteBlogPost}
        clinics={clinics}
        onUpdateClinics={handleUpdateClinics}
        services={services}
        onUpdateServices={handleUpdateServices}
        testimonials={testimonials}
        onUpdateTestimonials={handleUpdateTestimonials}
        onRestoreAllData={handleRestoreAllData}
      />
    </div>
  );
}
