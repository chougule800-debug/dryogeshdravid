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
  ClinicBranchId,
} from './types';
import {
  saveDocumentToFirestore,
  deleteDocumentFromFirestore,
  restoreClinicDataToFirestore,
  subscribeAdminAuth,
  RestorePayload,
} from './services/firebaseService';
import { useFirestoreCollection } from './hooks/useFirestoreCollection';
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
  const orderDoctors = useMemo(() => ({ field: 'createdAt', ascending: false }), []);
  const orderPrePost = useMemo(() => ({ field: 'createdAt', ascending: false }), []);
  const orderGallery = useMemo(() => ({ field: 'createdAt', ascending: false }), []);
  const orderBlog = useMemo(() => ({ field: 'createdAt', ascending: false }), []);
  const orderClinics = useMemo(() => ({ field: 'createdAt', ascending: false }), []);
  const orderServices = useMemo(() => ({ field: 'createdAt', ascending: false }), []);
  const orderTestimonials = useMemo(() => ({ field: 'createdAt', ascending: false }), []);

  // Firestore real-time collections with bounded queries & offline cache
  const doctorsState = useFirestoreCollection<Doctor>('doctors', orderDoctors);
  const prePostCasesState = useFirestoreCollection<PrePostCase>('prepost', orderPrePost);
  const galleryItemsState = useFirestoreCollection<GalleryItem>('gallery', orderGallery);
  const blogPostsState = useFirestoreCollection<BlogPost>('blog', orderBlog);
  const clinicsState = useFirestoreCollection<ClinicLocation>('clinics', orderClinics);
  const servicesState = useFirestoreCollection<ClinicalServiceItem>('services', orderServices);
  const testimonialsState = useFirestoreCollection<Testimonial>('testimonials', orderTestimonials);

  const doctors = doctorsState.data || [];
  const prePostCases = prePostCasesState.data || [];
  const galleryItems = galleryItemsState.data || [];
  const blogPosts = blogPostsState.data || [];
  const clinics = clinicsState.data || [];
  const services = servicesState.data || [];
  const testimonials = testimonialsState.data || [];

  // Admin auth — synchronized with Firebase Auth session & admin claims/profile.
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAdminAuth(({ isAdmin }) => {
      setIsAdminLoggedIn(isAdmin);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
  };

  const handleAdminLogout = () => {
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
  // Admin CRUD — writes go straight to Cloud Firestore.
  // ------------------------------------------------------------------
  const handleUpdateDoctor = async (updatedDoctor: Doctor): Promise<boolean> =>
    saveDocumentToFirestore('doctors', updatedDoctor);

  const handleAddDoctor = async (newDoctor: Doctor): Promise<boolean> =>
    saveDocumentToFirestore('doctors', newDoctor);

  const handleDeleteDoctor = async (id: string): Promise<boolean> =>
    deleteDocumentFromFirestore('doctors', id);

  const handleAddPrePostCase = async (newCase: PrePostCase): Promise<boolean> =>
    saveDocumentToFirestore('prepost', newCase);

  const handleUpdatePrePostCase = async (updated: PrePostCase): Promise<boolean> =>
    saveDocumentToFirestore('prepost', updated);

  const handleDeletePrePostCase = async (id: string): Promise<boolean> =>
    deleteDocumentFromFirestore('prepost', id);

  const handleAddGalleryItem = async (newItem: GalleryItem): Promise<boolean> =>
    saveDocumentToFirestore('gallery', newItem);

  const handleUpdateGalleryItem = async (updated: GalleryItem): Promise<boolean> =>
    saveDocumentToFirestore('gallery', updated);

  const handleDeleteGalleryItem = async (id: string): Promise<boolean> =>
    deleteDocumentFromFirestore('gallery', id);

  const handleAddBlogPost = async (newPost: BlogPost): Promise<boolean> =>
    saveDocumentToFirestore('blog', newPost);

  const handleUpdateBlogPost = async (updated: BlogPost): Promise<boolean> =>
    saveDocumentToFirestore('blog', updated);

  const handleDeleteBlogPost = async (id: string): Promise<boolean> =>
    deleteDocumentFromFirestore('blog', id);

  const handleUpdateClinics = async (updatedClinics: ClinicLocation[]): Promise<boolean> => {
    const results = await Promise.all(
      updatedClinics.map((c) => saveDocumentToFirestore('clinics', c))
    );
    return results.every(Boolean);
  };

  // Services handlers
  const handleAddService = async (newService: ClinicalServiceItem): Promise<boolean> =>
    saveDocumentToFirestore('services', newService);

  const handleUpdateService = async (updated: ClinicalServiceItem): Promise<boolean> =>
    saveDocumentToFirestore('services', updated);

  const handleDeleteService = async (id: string): Promise<boolean> =>
    deleteDocumentFromFirestore('services', id);

  // Testimonials handlers
  const handleAddTestimonial = async (newTestimonial: Testimonial): Promise<boolean> =>
    saveDocumentToFirestore('testimonials', newTestimonial);

  const handleUpdateTestimonial = async (updated: Testimonial): Promise<boolean> =>
    saveDocumentToFirestore('testimonials', updated);

  const handleDeleteTestimonial = async (id: string): Promise<boolean> =>
    deleteDocumentFromFirestore('testimonials', id);

  // Restore from backup – batched write to Firestore (no appointments)
  const handleRestoreAllData = async (data: RestorePayload): Promise<void> => {
    await restoreClinicDataToFirestore(data);
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
        onAddService={handleAddService}
        onUpdateService={handleUpdateService}
        onDeleteService={handleDeleteService}
        testimonials={testimonials}
        onAddTestimonial={handleAddTestimonial}
        onUpdateTestimonial={handleUpdateTestimonial}
        onDeleteTestimonial={handleDeleteTestimonial}
        onRestoreAllData={handleRestoreAllData}
      />
    </div>
  );
}
