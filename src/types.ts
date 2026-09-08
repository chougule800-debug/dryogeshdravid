export type ClinicBranchId = 'belgaum' | 'goa';

export interface Doctor {
  id: string;
  name: string;
  designation: string;
  qualification: string;
  role: string;
  experienceYears: number;
  teachingExperienceYears?: number;
  image: string;
  bio: string;
  specializations: string[];
  department?: string;
  academicAffiliation?: string;
}

export interface ClinicLocation {
  id: ClinicBranchId;
  name: string;
  tagline: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  timings: string[];
  scheduleNote: string;
  isSpecialSchedule?: boolean;
  specialRule?: string;
  mapQuery: string;
  googleMapEmbedUrl: string;
  whatsappNumber?: string;
  features?: string[];
}

export interface PrePostCase {
  id: string;
  title: string;
  condition: string;
  category: 'Skin' | 'Hair' | 'Respiratory' | 'Pediatric' | 'Joint & Musculoskeletal' | 'Gastrointestinal' | 'Chronic';
  patientAgeGender: string;
  durationOfTreatment: string;
  beforeImage: string;
  afterImage: string;
  remedyPrescribed: string;
  description: string;
  outcomeNotes: string;
  dateAdded: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Clinic' | 'Pharmacy' | 'Consultation' | 'Academic' | 'Events';
  imageUrl: string;
  caption: string;
  date?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  authorRole: string;
  category: string;
  publishedDate: string;
  readTime: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
}

export interface Testimonial {
  id: string;
  patientName: string;
  location: string;
  condition: string;
  comment: string;
  rating: number;
  treatedBy: string;
  doctorConsulted?: string;
  treatmentDuration: string;
  date?: string;
}

export interface ClinicalServiceItem {
  id: string;
  icon?: string;
  iconName?: string;
  title: string;
  description: string;
  highlight: string;
  approach?: string;
  conditions?: string[];
}