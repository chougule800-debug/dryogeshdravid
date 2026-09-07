/**
 * Standalone Supabase seed script (server-side, uses the service-role key).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npm run seed:supabase
 *
 * - Reads the canonical seed data from src/data/initialData.ts.
 * - Uploads any /images/* files referenced by the seed data into Supabase
 *   Storage (bucket: clinic-images) and rewrites those record URLs to the
 *   public Storage URL. External URL values are kept as-is.
 * - Upserts every record into the matching table.
 *
 * Admin accounts are created by the project owner through the Supabase Dashboard
 * (Authentication → Users), not by this script. The runtime website does NOT seed
 * anything — Supabase is the single source of truth. This is a developer-only,
 * one-time tool.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import * as fs from 'fs';
import * as path from 'path';

import {
  DOCTORS,
  CLINICS,
  INITIAL_PRE_POST_CASES,
  INITIAL_GALLERY,
  INITIAL_BLOG_POSTS,
  INITIAL_TESTIMONIALS,
  CLINICAL_SERVICES,
} from '../src/data/initialData';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws as any }, // Node 20 has no native WebSocket; use the ws package
});

const BUCKET = 'clinic-images';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

// camelCase -> snake_case (matches supabase/schema.sql)
const COLUMN_MAP: Record<string, Record<string, string>> = {
  doctors: {
    experienceYears: 'experience_years',
    teachingExperienceYears: 'teaching_experience_years',
    academicAffiliation: 'academic_affiliation',
  },
  clinics: {
    alternatePhone: 'alternate_phone',
    scheduleNote: 'schedule_note',
    isSpecialSchedule: 'is_special_schedule',
    specialRule: 'special_rule',
    mapQuery: 'map_query',
    googleMapEmbedUrl: 'google_map_embed_url',
    whatsappNumber: 'whatsapp_number',
  },
  services: { iconName: 'icon_name' },
  gallery: { imageUrl: 'image_url' },
  blog: {
    authorRole: 'author_role',
    publishedDate: 'published_date',
    readTime: 'read_time',
    coverImage: 'cover_image',
  },
  prepost: {
    patientAgeGender: 'patient_age_gender',
    durationOfTreatment: 'duration_of_treatment',
    beforeImage: 'before_image',
    afterImage: 'after_image',
    remedyPrescribed: 'remedy_prescribed',
    outcomeNotes: 'outcome_notes',
    dateAdded: 'date_added',
  },
  testimonials: {
    patientName: 'patient_name',
    treatedBy: 'treated_by',
    doctorConsulted: 'doctor_consulted',
    treatmentDuration: 'treatment_duration',
  },
  appointments: {
    patientName: 'patient_name',
    patientEmail: 'patient_email',
    patientPhone: 'patient_phone',
    patientAge: 'patient_age',
    patientGender: 'patient_gender',
    branchId: 'branch_id',
    doctorId: 'doctor_id',
    appointmentDate: 'appointment_date',
    appointmentTime: 'appointment_time',
    healthConcern: 'health_concern',
    consultationType: 'consultation_type',
    emailReminderSent: 'email_reminder_sent',
    createdAt: 'created_at',
  },
};

function toRow(table: string, data: Record<string, unknown>): Record<string, unknown> {
  const map = COLUMN_MAP[table] || {};
  const row: Record<string, unknown> = { id: data.id };
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id' || value === undefined) continue;
    // Fields with a mapping get the snake_case column name; identical fields pass through.
    row[map[key] ?? key] = value;
  }
  return row;
}

function extToMime(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml' } as Record<string, string>)[ext] || 'application/octet-stream';
}

/** If value is a local /images/... path, upload it to Storage and return the public URL. */
async function resolveImage(value: string | undefined, folder: string): Promise<string | undefined> {
  if (!value) return value;
  if (!value.startsWith('/images/')) return value;

  const filename = path.basename(value);
  const localFile = path.join(PUBLIC_DIR, value.replace(/^\//, ''));
  if (!fs.existsSync(localFile)) {
    console.warn(`  - local image not found, keeping original: ${value}`);
    return value;
  }

  const storagePath = `${folder}/${filename}`;
  const buffer = fs.readFileSync(localFile);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: extToMime(filename), upsert: true });
  if (error) {
    console.error(`  - upload failed for ${value}:`, error.message);
    throw error;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  console.log(`  - uploaded ${value} -> ${data.publicUrl}`);
  return data.publicUrl;
}

async function seedDoctors() {
  const rows = [];
  for (const d of DOCTORS) {
    const image = await resolveImage(d.image, 'doctors');
    rows.push(toRow('doctors', { ...d, image }));
  }
  const { error } = await supabase.from('doctors').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  return rows.length;
}

async function seedClinics() {
  const rows = CLINICS.map((c) => toRow('clinics', { ...c }));
  const { error } = await supabase.from('clinics').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  return rows.length;
}

async function seedServices() {
  const rows = CLINICAL_SERVICES.map((s) => toRow('services', { ...s }));
  const { error } = await supabase.from('services').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  return rows.length;
}

async function seedPrePost() {
  const rows = [];
  for (const c of INITIAL_PRE_POST_CASES) {
    const before = await resolveImage(c.beforeImage, 'prepost');
    const after = await resolveImage(c.afterImage, 'prepost');
    rows.push(toRow('prepost', { ...c, beforeImage: before, afterImage: after }));
  }
  const { error } = await supabase.from('prepost').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  return rows.length;
}

async function seedGallery() {
  const rows = [];
  for (const g of INITIAL_GALLERY) {
    const imageUrl = await resolveImage(g.imageUrl, 'gallery');
    rows.push(toRow('gallery', { ...g, imageUrl }));
  }
  const { error } = await supabase.from('gallery').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  return rows.length;
}

async function seedBlog() {
  const rows = [];
  for (const b of INITIAL_BLOG_POSTS) {
    const cover = await resolveImage(b.coverImage, 'blog');
    rows.push(toRow('blog', { ...b, coverImage: cover }));
  }
  const { error } = await supabase.from('blog').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  return rows.length;
}

async function seedTestimonials() {
  const rows = INITIAL_TESTIMONIALS.map((t) => toRow('testimonials', { ...t }));
  const { error } = await supabase.from('testimonials').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  return rows.length;
}

async function main() {
  console.log('Seeding Supabase...\n');

  const counts = {
    doctors: await seedDoctors(),
    clinics: await seedClinics(),
    services: await seedServices(),
    prepost: await seedPrePost(),
    gallery: await seedGallery(),
    blog: await seedBlog(),
    testimonials: await seedTestimonials(),
  };

  console.log('\nDone. Seeded:');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  - ${table}: ${count} row(s)`);
  }
}

main().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});