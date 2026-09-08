/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
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
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { WhatsAppChatBot } from './components/WhatsAppChatBot';
import { ContactToBookModal } from './components/ContactToBookModal';
import { ArrowUp } from 'lucide-react';

export default function App() {
  // Memoize orderBy objects to prevent infinite re-renders
  const orderDoctors = useMemo(() => ({ column: 'created_at', ascending: false }), []);
  const orderPrePost = useMemo(() => ({ column: 'created_at', ascending: false }), []);
  const orderGallery = useMemo(() => ({ column: 'created_at', ascending: false }), []);
  const orderBlog = useMemo(() => ({ column: 'created_at', ascending: false }), []);
  const orderClinics = useMemo(() => ({ column: 'created_at', ascending: false }), []);
  const orderServices = useMemo(() => ({ column: 'created_at', ascending: false }), []);
  const orderTestimonials = useMemo(() => ({ column: 'created_at', ascending: false }), []);

  // Supabase collections with order
  const doctorsState = useSupabaseCollection<Doctor>('doctors', orderDoctors);
  const prePostCasesState = useSupabaseCollection<PrePostCase>('prepost', orderPrePost);
  const galleryItemsState = useSupabaseCollection<GalleryItem>('gallery', orderGallery);
  const blogPostsState = useSupabaseCollection<BlogPost>('blog', orderBlog);
  const clinicsState = useSupabaseCollection<ClinicLocation>('clinics', orderClinics);
  const servicesState = useSupabaseCollection<ClinicalServiceItem>('services', orderServices);
  const testimonialsState = useSupabaseCollection<Testimonial>('testimonials', orderTestimonials);

  const doctors = doctorsState.data || [];
  const prePostCases = prePostCasesState.data || [];
  const galleryItems = galleryItemsState.data || [];
  const blogPosts = blogPostsState.data || [];
  const clinics = clinicsState.data || [];
  const services = servicesState.data || [];
  const testimonials = testimonialsState.data || [];

  // Admin auth — local login.
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

  // Contact modal controls
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactBranch, setContactBranch] = useState<ClinicBranchId>('belgaum');

  const handleOpenContact = (branch: ClinicBranchId = 'belgaum') => {
    setContactBranch(branch);
    setContactModalOpen(true);
  };

  // Admin panel modal
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
  // Admin CRUD — writes go straight to Supabase.
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

  // Restore from backup – write everything to Supabase (no appointments)
  const handleRestoreAllData = async (data: any): Promise<void> => {
    const writers: Promise<boolean>[] = [];
    if (data.doctors) for (const d of data.doctors) writers.push(saveDocumentToSupabase('doctors', d));
    if (data.prePostCases) for (const c of data.prePostCases) writers.push(saveDocumentToSupabase('prepost', c));
    if (data.galleryItems) for (const g of data.galleryItems) writers.push(saveDocumentToSupabase('gallery', g));
    if (data.blogPosts) for (const b of data.blogPosts) writers.push(saveDocumentToSupabase('blog', b));
    if (data.clinics) for (const cl of data.clinics) writers.push(saveDocumentToSupabase('clinics', cl));
    if (data.services) for (const s of data.services) writers.push(saveDocumentToSupabase('services', s));
    if (data.testimonials) for (const t of data.testimonials) writers.push(saveDocumentToSupabase('testimonials', t));
    await Promise.all(writers);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col selection:bg-emerald-200 selection:text-emerald-950 font-sans">
      <Navbar
        onContactClinic={(branch) => handleOpenContact(branch || 'belgaum')}
        onOpenAdmin={() => setAdminModalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        clinics={clinics}
      />

      <main className="flex-1">
        <HeroSection
          onContactClinic={() => handleOpenContact('belgaum')}
          onExploreCases={() => {
            const elem = document.getElementById('pre-post');
            elem?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <DoctorsSection
          doctors={doctors}
          loading={doctorsState.loading}
          error={doctorsState.error}
          onContactClinic={(docId) => handleOpenContact('belgaum')}
        />

        <ClinicsSection
          clinics={clinics}
          loading={clinicsState.loading}
          error={clinicsState.error}
          onContactClinic={(branchId) => handleOpenContact(branchId)}
        />

        <TreatmentsSection
          services={services}
          loading={servicesState.loading}
          error={servicesState.error}
          onContactClinic={() => handleOpenContact('belgaum')}
        />

        <PrePostGallery
          cases={prePostCases}
          loading={prePostCasesState.loading}
          error={prePostCasesState.error}
          onContactClinic={() => handleOpenContact('belgaum')}
        />

        <GallerySection
          items={galleryItems}
          loading={galleryItemsState.loading}
          error={galleryItemsState.error}
        />

        <TestimonialsMarquee
          testimonials={testimonials}
          loading={testimonialsState.loading}
          error={testimonialsState.error}
          onContactClinic={() => handleOpenContact('belgaum')}
        />

        <BlogSection
          posts={blogPosts}
          loading={blogPostsState.loading}
          error={blogPostsState.error}
          onContactClinic={() => handleOpenContact('belgaum')}
        />
      </main>

      <Footer
        onContactClinic={() => handleOpenContact('belgaum')}
        onOpenAdmin={() => setAdminModalOpen(true)}
        clinics={clinics}
      />

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

      <WhatsAppChatBot clinics={clinics} />

      <ContactToBookModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        clinics={clinics}
        initialBranch={contactBranch}
      />

      <AdminPanel
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        isAdminLoggedIn={isAdminLoggedIn}
        onAuthenticated={handleAdminLogin}
        onSignOut={handleAdminLogout}
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