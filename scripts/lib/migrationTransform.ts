import * as crypto from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';

export const COLLECTION_ORDER = [
  'profiles',
  'doctors',
  'clinics',
  'services',
  'gallery',
  'blog',
  'prepost',
  'testimonials',
  'appointments',
] as const;

export type MigratedCollection = (typeof COLLECTION_ORDER)[number];

const SUPABASE_STORAGE_MARKER = '/storage/v1/object/public/clinic-images/';
const SUPABASE_AUTH_STORAGE_MARKER = '/storage/v1/object/authenticated/clinic-images/';

/** Convert a relative object path (e.g. `gallery/123_photo.jpg`) into a deterministic Firestore doc ID. */
export function toMediaAssetId(objectPath: string): string {
  return objectPath.replace(/\//g, '__').replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Parse a PostgreSQL ISO-8601 TIMESTAMPTZ string into a Firestore Timestamp,
 * preserving up to nanosecond fractional precision when available.
 */
export function parsePgTimestamp(value: unknown): Timestamp | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);

  const str = String(value).trim();
  const parsedMs = Date.parse(str);
  if (Number.isNaN(parsedMs)) {
    throw new Error(`Invalid PostgreSQL timestamp: "${str}"`);
  }

  const match = /\.([0-9]+)/.exec(str);
  const wholeSeconds = Math.floor(parsedMs / 1000);
  let nanoseconds = (parsedMs % 1000) * 1_000_000;
  if (nanoseconds < 0) nanoseconds += 1_000_000_000;

  if (match) {
    const padded = match[1].slice(0, 9).padEnd(9, '0');
    nanoseconds = Number(padded);
  }

  return new Timestamp(wholeSeconds, nanoseconds);
}

/** Extract the relative object path inside Supabase `clinic-images` bucket, if applicable. */
export function extractSupabaseStoragePath(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  for (const marker of [SUPABASE_STORAGE_MARKER, SUPABASE_AUTH_STORAGE_MARKER]) {
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const rawPath = url.slice(idx + marker.length).split('?')[0];
      return rawPath
        .split('/')
        .map((seg) => decodeURIComponent(seg))
        .join('/');
    }
  }
  return null;
}

/** Rewrite a Supabase Storage URL to its Cloud Firestore string value (inline Data URL or `firestore-media://` pointer). */
export function rewriteMediaUrl(
  url: unknown,
  mediaValueMap: Record<string, string>
): string | null {
  if (url === null || url === undefined) return null;
  const str = String(url).trim();
  if (!str) return null;

  const relativePath = extractSupabaseStoragePath(str);
  if (relativePath) {
    const mapped = mediaValueMap[relativePath];
    if (!mapped) {
      throw new Error(
        `Missing migrated Firestore media string for Supabase object "${relativePath}".`
      );
    }
    return mapped;
  }

  return str;
}

function asStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map((item) => String(item));
  return [];
}

function asNullableString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  return String(val);
}

function asNullableInt(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/**
 * Transform a raw PostgreSQL row from a Supabase table backup into the
 * target Cloud Firestore document structure (with media converted to strings).
 */
export function transformSupabaseRow(
  collectionName: MigratedCollection,
  row: Record<string, unknown>,
  mediaValueMap: Record<string, string>
): Record<string, unknown> {
  const id = String(row.id);
  const createdAt = parsePgTimestamp(row.created_at) ?? Timestamp.now();
  const updatedAt = parsePgTimestamp(row.updated_at) ?? createdAt;

  switch (collectionName) {
    case 'profiles':
      return {
        id,
        email: asNullableString(row.email),
        isAdmin: Boolean(row.is_admin),
        createdAt,
        updatedAt,
      };

    case 'doctors':
      return {
        id,
        name: String(row.name || ''),
        designation: asNullableString(row.designation),
        qualification: asNullableString(row.qualification),
        role: asNullableString(row.role),
        experienceYears: asNullableInt(row.experience_years) ?? 0,
        teachingExperienceYears: asNullableInt(row.teaching_experience_years) ?? 0,
        image: rewriteMediaUrl(row.image, mediaValueMap),
        bio: asNullableString(row.bio),
        specializations: asStringArray(row.specializations),
        department: asNullableString(row.department),
        academicAffiliation: asNullableString(row.academic_affiliation),
        createdAt,
        updatedAt,
      };

    case 'clinics':
      return {
        id,
        name: asNullableString(row.name),
        tagline: asNullableString(row.tagline),
        address: asNullableString(row.address),
        landmark: asNullableString(row.landmark),
        city: asNullableString(row.city),
        state: asNullableString(row.state),
        phone: asNullableString(row.phone),
        alternatePhone: asNullableString(row.alternate_phone),
        email: asNullableString(row.email),
        timings: asStringArray(row.timings),
        scheduleNote: asNullableString(row.schedule_note),
        isSpecialSchedule: Boolean(row.is_special_schedule),
        specialRule: asNullableString(row.special_rule),
        mapQuery: asNullableString(row.map_query),
        googleMapEmbedUrl: asNullableString(row.google_map_embed_url),
        whatsappNumber: asNullableString(row.whatsapp_number),
        features: asStringArray(row.features),
        createdAt,
        updatedAt,
      };

    case 'services':
      return {
        id,
        icon: asNullableString(row.icon),
        iconName: asNullableString(row.icon_name),
        title: asNullableString(row.title),
        description: asNullableString(row.description),
        highlight: asNullableString(row.highlight),
        approach: asNullableString(row.approach),
        conditions: asStringArray(row.conditions),
        createdAt,
        updatedAt,
      };

    case 'gallery': {
      const rawMediaUrl = row.media_url ?? row.image_url;
      return {
        id,
        title: asNullableString(row.title),
        category: asNullableString(row.category),
        mediaType: row.media_type === 'video' ? 'video' : 'image',
        mediaUrl: rewriteMediaUrl(rawMediaUrl, mediaValueMap),
        caption: asNullableString(row.caption),
        date: asNullableString(row.date),
        createdAt,
        updatedAt,
      };
    }

    case 'blog': {
      const rawMediaUrl = row.media_url ?? row.cover_image;
      return {
        id,
        title: asNullableString(row.title),
        slug: asNullableString(row.slug),
        author: asNullableString(row.author),
        authorRole: asNullableString(row.author_role),
        category: asNullableString(row.category),
        publishedDate: asNullableString(row.published_date),
        readTime: asNullableString(row.read_time),
        excerpt: asNullableString(row.excerpt),
        content: asNullableString(row.content),
        mediaType: row.media_type === 'video' ? 'video' : 'image',
        mediaUrl: rewriteMediaUrl(rawMediaUrl, mediaValueMap),
        tags: asStringArray(row.tags),
        createdAt,
        updatedAt,
      };
    }

    case 'prepost': {
      const rawBefore = row.before_media_url ?? row.before_image;
      const rawAfter = row.after_media_url ?? row.after_image;
      return {
        id,
        title: asNullableString(row.title),
        condition: asNullableString(row.condition),
        category: asNullableString(row.category),
        patientAgeGender: asNullableString(row.patient_age_gender),
        durationOfTreatment: asNullableString(row.duration_of_treatment),
        beforeMediaType: row.before_media_type === 'video' ? 'video' : 'image',
        beforeMediaUrl: rewriteMediaUrl(rawBefore, mediaValueMap),
        afterMediaType: row.after_media_type === 'video' ? 'video' : 'image',
        afterMediaUrl: rewriteMediaUrl(rawAfter, mediaValueMap),
        remedyPrescribed: asNullableString(row.remedy_prescribed),
        description: asNullableString(row.description),
        outcomeNotes: asNullableString(row.outcome_notes),
        dateAdded: asNullableString(row.date_added),
        createdAt,
        updatedAt,
      };
    }

    case 'testimonials':
      return {
        id,
        patientName: asNullableString(row.patient_name),
        location: asNullableString(row.location),
        condition: asNullableString(row.condition),
        comment: asNullableString(row.comment),
        rating: asNullableInt(row.rating) ?? 5,
        treatedBy: asNullableString(row.treated_by),
        doctorConsulted: asNullableString(row.doctor_consulted),
        treatmentDuration: asNullableString(row.treatment_duration),
        date: asNullableString(row.date),
        createdAt,
        updatedAt,
      };

    case 'appointments':
      return {
        id,
        patientName: asNullableString(row.patient_name),
        patientEmail: asNullableString(row.patient_email),
        patientPhone: asNullableString(row.patient_phone),
        patientAge: asNullableInt(row.patient_age),
        patientGender: asNullableString(row.patient_gender),
        branchId: asNullableString(row.branch_id),
        doctorId: asNullableString(row.doctor_id),
        appointmentDate: asNullableString(row.appointment_date),
        appointmentTime: asNullableString(row.appointment_time),
        healthConcern: asNullableString(row.health_concern),
        consultationType: asNullableString(row.consultation_type),
        status: asNullableString(row.status) ?? 'Tentative',
        emailReminderSent: Boolean(row.email_reminder_sent),
        createdAt,
        updatedAt,
      };
  }
}

export function validateTransformedDoc(
  collectionName: MigratedCollection,
  doc: Record<string, unknown>
): string[] {
  const errors: string[] = [];
  if (typeof doc.id !== 'string' || !doc.id.trim()) {
    errors.push('Missing or empty document id.');
  }

  const approxBytes = Buffer.byteLength(JSON.stringify(doc), 'utf8');
  if (approxBytes > 950_000) {
    errors.push(`Document size (${approxBytes} bytes) approaches Firestore 1 MiB limit.`);
  }

  switch (collectionName) {
    case 'profiles':
      if (typeof doc.isAdmin !== 'boolean') errors.push('profiles.isAdmin must be boolean.');
      break;
    case 'doctors':
      if (!doc.name) errors.push('doctors.name is required.');
      break;
    case 'clinics':
      if (!doc.name) errors.push('clinics.name is required.');
      break;
    case 'services':
      if (!doc.title) errors.push('services.title is required.');
      break;
    case 'gallery':
      if (!doc.title) errors.push('gallery.title is required.');
      if (!doc.mediaUrl) errors.push('gallery.mediaUrl is required.');
      break;
    case 'blog':
      if (!doc.title) errors.push('blog.title is required.');
      if (!doc.content) errors.push('blog.content is required.');
      if (!doc.mediaUrl) errors.push('blog.mediaUrl is required.');
      break;
    case 'prepost':
      if (!doc.title) errors.push('prepost.title is required.');
      if (!doc.beforeMediaUrl) errors.push('prepost.beforeMediaUrl is required.');
      if (!doc.afterMediaUrl) errors.push('prepost.afterMediaUrl is required.');
      break;
    case 'testimonials':
      if (!doc.patientName) errors.push('testimonials.patientName is required.');
      if (!doc.comment) errors.push('testimonials.comment is required.');
      break;
    case 'appointments':
      if (!doc.status) errors.push('appointments.status is required.');
      break;
  }

  return errors;
}

function normalizeForChecksum(val: unknown): unknown {
  if (val === null || val === undefined) return null;
  if (val instanceof Timestamp) {
    return { __tsMs: val.toMillis() };
  }
  if (
    typeof val === 'object' &&
    val !== null &&
    'seconds' in val &&
    'nanoseconds' in val &&
    typeof (val as any).toMillis === 'function'
  ) {
    return { __tsMs: (val as any).toMillis() };
  }
  if (Array.isArray(val)) {
    return val.map(normalizeForChecksum);
  }
  if (typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(val as Record<string, unknown>).sort()) {
      out[k] = normalizeForChecksum((val as Record<string, unknown>)[k]);
    }
    return out;
  }
  return val;
}

export function computeDocumentChecksum(doc: Record<string, unknown>): string {
  const canonical = JSON.stringify(normalizeForChecksum(doc));
  return crypto.createHash('sha256').update(canonical).digest('hex');
}
