/**
 * Pure Firestore document mapping, legacy field normalization, chunking helpers,
 * and media file validation.
 * Separated from stateful Firebase SDK initialization for clean unit testability.
 */

export const FIRESTORE_MEDIA_PREFIX = 'firestore-media://';
export const INLINE_DATA_URL_LIMIT_CHARS = 700_000;
export const PREPOST_INLINE_DATA_URL_LIMIT_CHARS = 340_000;
export const FIRESTORE_CHUNK_SIZE_CHARS = 700_000;
export const MAX_FIRESTORE_DOC_SAFE_BYTES = 850_000;

const LEGACY_FIELD_MAP: Record<string, Record<string, string>> = {
  doctors: {
    experience_years: 'experienceYears',
    teaching_experience_years: 'teachingExperienceYears',
    academic_affiliation: 'academicAffiliation',
  },
  clinics: {
    alternate_phone: 'alternatePhone',
    schedule_note: 'scheduleNote',
    is_special_schedule: 'isSpecialSchedule',
    special_rule: 'specialRule',
    map_query: 'mapQuery',
    google_map_embed_url: 'googleMapEmbedUrl',
    whatsapp_number: 'whatsappNumber',
  },
  services: {
    icon_name: 'iconName',
  },
  gallery: {
    media_type: 'mediaType',
    media_url: 'mediaUrl',
    image_url: 'imageUrl',
  },
  blog: {
    author_role: 'authorRole',
    published_date: 'publishedDate',
    read_time: 'readTime',
    media_type: 'mediaType',
    media_url: 'mediaUrl',
    cover_image: 'coverImage',
  },
  prepost: {
    patient_age_gender: 'patientAgeGender',
    duration_of_treatment: 'durationOfTreatment',
    before_media_type: 'beforeMediaType',
    before_media_url: 'beforeMediaUrl',
    before_image: 'beforeImage',
    after_media_type: 'afterMediaType',
    after_media_url: 'afterMediaUrl',
    after_image: 'afterImage',
    remedy_prescribed: 'remedyPrescribed',
    outcome_notes: 'outcomeNotes',
    date_added: 'dateAdded',
  },
  testimonials: {
    patient_name: 'patientName',
    treated_by: 'treatedBy',
    doctor_consulted: 'doctorConsulted',
    treatment_duration: 'treatmentDuration',
  },
  profiles: {
    is_admin: 'isAdmin',
  },
};

export function normalizeRawKeys(
  collectionName: string,
  raw: Record<string, unknown>
): Record<string, unknown> {
  const legacyMap = LEGACY_FIELD_MAP[collectionName] || {};
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    const mappedKey = legacyMap[key] || key;
    if (normalized[mappedKey] === undefined || normalized[mappedKey] === null) {
      normalized[mappedKey] = value;
    }
  }

  return normalized;
}

/** Map a Firestore document into the application's typed object shape. */
export function fromFirestoreDoc<T>(
  collectionName: string,
  docId: string,
  rawData: Record<string, unknown>
): T {
  const data = normalizeRawKeys(collectionName, rawData);
  const out: Record<string, unknown> = {
    ...data,
    id: (data.id as string) || docId,
  };

  if (collectionName === 'prepost') {
    if (!out.beforeMediaType) out.beforeMediaType = 'image';
    if (!out.beforeMediaUrl && out.beforeImage) out.beforeMediaUrl = out.beforeImage;
    if (!out.afterMediaType) out.afterMediaType = 'image';
    if (!out.afterMediaUrl && out.afterImage) out.afterMediaUrl = out.afterImage;
  } else if (collectionName === 'gallery') {
    if (!out.mediaType) out.mediaType = 'image';
    if (!out.mediaUrl && out.imageUrl) out.mediaUrl = out.imageUrl;
  } else if (collectionName === 'blog') {
    if (!out.mediaType) out.mediaType = 'image';
    if (!out.mediaUrl && out.coverImage) out.mediaUrl = out.coverImage;
    if (!Array.isArray(out.tags)) out.tags = [];
  } else if (collectionName === 'doctors') {
    if (!Array.isArray(out.specializations)) out.specializations = [];
    if (typeof out.experienceYears !== 'number') {
      out.experienceYears = Number(out.experienceYears) || 0;
    }
  } else if (collectionName === 'clinics') {
    if (!Array.isArray(out.timings)) out.timings = [];
    if (out.features !== undefined && !Array.isArray(out.features)) {
      out.features = [];
    }
  } else if (collectionName === 'services') {
    if (out.conditions !== undefined && !Array.isArray(out.conditions)) {
      out.conditions = [];
    }
  } else if (collectionName === 'testimonials') {
    if (typeof out.rating !== 'number') {
      out.rating = Number(out.rating) || 5;
    }
  }

  delete out.imageUrl;
  delete out.coverImage;
  delete out.beforeImage;
  delete out.afterImage;

  return out as T;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    clean[k] = v;
  }
  return clean;
}

/** Convert a typed domain object (or legacy JSON backup item) into a clean Firestore document payload. */
export function toFirestorePayload<T extends { id: string }>(
  collectionName: string,
  data: T
): Record<string, unknown> {
  const normalized = normalizeRawKeys(
    collectionName,
    data as unknown as Record<string, unknown>
  );

  delete normalized.created_at;
  delete normalized.updated_at;
  delete normalized.createdAt;
  delete normalized.updatedAt;

  if (collectionName === 'gallery') {
    if (!normalized.mediaType) normalized.mediaType = 'image';
    if (!normalized.mediaUrl && normalized.imageUrl) {
      normalized.mediaUrl = normalized.imageUrl;
    }
    delete normalized.imageUrl;
  } else if (collectionName === 'blog') {
    if (!normalized.mediaType) normalized.mediaType = 'image';
    if (!normalized.mediaUrl && normalized.coverImage) {
      normalized.mediaUrl = normalized.coverImage;
    }
    delete normalized.coverImage;
  } else if (collectionName === 'prepost') {
    if (!normalized.beforeMediaType) normalized.beforeMediaType = 'image';
    if (!normalized.beforeMediaUrl && normalized.beforeImage) {
      normalized.beforeMediaUrl = normalized.beforeImage;
    }
    if (!normalized.afterMediaType) normalized.afterMediaType = 'image';
    if (!normalized.afterMediaUrl && normalized.afterImage) {
      normalized.afterMediaUrl = normalized.afterImage;
    }
    delete normalized.beforeImage;
    delete normalized.afterImage;
  }

  return stripUndefined({
    ...normalized,
    id: data.id,
  });
}

// ---------------------------------------------------------------------------
// STRING / BASE64 / CHUNK HELPERS FOR FIRESTORE MEDIA STORAGE
// ---------------------------------------------------------------------------

export function isFirestoreMediaPointer(url: string | undefined | null): url is string {
  return typeof url === 'string' && url.startsWith(FIRESTORE_MEDIA_PREFIX);
}

export function extractFirestoreMediaId(pointer: string): string {
  return pointer.slice(FIRESTORE_MEDIA_PREFIX.length);
}

export function parseDataUrl(dataUrl: string): { contentType: string; base64: string } | null {
  if (!dataUrl.startsWith('data:')) return null;
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return null;
  const header = dataUrl.slice(5, commaIdx); // after "data:"
  const semiIdx = header.indexOf(';');
  const contentType = semiIdx !== -1 ? header.slice(0, semiIdx) : header || 'application/octet-stream';
  const base64 = dataUrl.slice(commaIdx + 1);
  return { contentType, base64 };
}

export function splitStringIntoChunks(
  str: string,
  chunkSize = FIRESTORE_CHUNK_SIZE_CHARS
): string[] {
  if (str.length === 0) return [''];
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, '');
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(clean, 'base64'));
  }
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

export function estimatePayloadBytes(obj: unknown): number {
  const json = JSON.stringify(obj);
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(json).length;
  }
  return Buffer.byteLength(json, 'utf8');
}

// ---------------------------------------------------------------------------
// MEDIA VALIDATION
// ---------------------------------------------------------------------------

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_VIDEO_SIZE_MB = 50;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
];

export function validateMediaFile(
  file: File,
  mediaType: 'image' | 'video'
): { valid: boolean; error?: string } {
  const types = mediaType === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;

  if (!file.type) {
    return { valid: false, error: `Could not determine file type for "${file.name}".` };
  }
  if (!types.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported ${mediaType} format (${file.type}). Allowed: ${types.join(', ')}.`,
    };
  }

  const maxMB = mediaType === 'image' ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB;
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxMB) {
    return {
      valid: false,
      error: `${
        mediaType === 'image' ? 'Image' : 'Video'
      } exceeds ${maxMB}MB limit (file is ${sizeMB.toFixed(1)}MB).`,
    };
  }

  return { valid: true };
}
