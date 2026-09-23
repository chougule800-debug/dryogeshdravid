import { supabase, IMAGE_BUCKET, getPublicStorageUrl } from '../lib/supabase';

export enum SupabaseOp {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type Unsubscribe = () => void;

export function handleSupabaseError(
  error: unknown,
  operationType: SupabaseOp,
  path: string | null
) {
  if (error && typeof error === 'object' && 'message' in error) {
    const err = error as any;
    console.error(
      `Supabase [${operationType}] at "${path}":`,
      err.message,
      err.details ? `\nDetails: ${err.details}` : '',
      err.hint ? `\nHint: ${err.hint}` : '',
      err.code ? `\nCode: ${err.code}` : ''
    );
  } else {
    console.warn(`Supabase [${operationType}] at "${path}":`, error);
  }
}

// ---------------------------------------------------------------------------
// CamelCase <-> snake_case column mapping
// ---------------------------------------------------------------------------
type ColumnMap = Record<string, Record<string, string>>;

const COLUMN_MAP: ColumnMap = {
  doctors: {
    name: 'name',
    designation: 'designation',
    qualification: 'qualification',
    role: 'role',
    experienceYears: 'experience_years',
    teachingExperienceYears: 'teaching_experience_years',
    image: 'image',
    bio: 'bio',
    specializations: 'specializations',
    department: 'department',
    academicAffiliation: 'academic_affiliation',
  },
  clinics: {
    name: 'name',
    tagline: 'tagline',
    address: 'address',
    landmark: 'landmark',
    city: 'city',
    state: 'state',
    phone: 'phone',
    alternatePhone: 'alternate_phone',
    email: 'email',
    timings: 'timings',
    scheduleNote: 'schedule_note',
    isSpecialSchedule: 'is_special_schedule',
    specialRule: 'special_rule',
    mapQuery: 'map_query',
    googleMapEmbedUrl: 'google_map_embed_url',
    whatsappNumber: 'whatsapp_number',
    features: 'features',
  },
  services: {
    icon: 'icon',
    iconName: 'icon_name',
    title: 'title',
    description: 'description',
    highlight: 'highlight',
    approach: 'approach',
    conditions: 'conditions',
  },
  gallery: {
    title: 'title',
    category: 'category',
    mediaType: 'media_type',
    mediaUrl: 'media_url',
    caption: 'caption',
    date: 'date',
  },
  blog: {
    title: 'title',
    slug: 'slug',
    author: 'author',
    authorRole: 'author_role',
    category: 'category',
    publishedDate: 'published_date',
    readTime: 'read_time',
    excerpt: 'excerpt',
    content: 'content',
    mediaType: 'media_type',
    mediaUrl: 'media_url',
    tags: 'tags',
  },
  prepost: {
    title: 'title',
    condition: 'condition',
    category: 'category',
    patientAgeGender: 'patient_age_gender',
    durationOfTreatment: 'duration_of_treatment',
    beforeMediaType: 'before_media_type',
    beforeMediaUrl: 'before_media_url',
    afterMediaType: 'after_media_type',
    afterMediaUrl: 'after_media_url',
    remedyPrescribed: 'remedy_prescribed',
    description: 'description',
    outcomeNotes: 'outcome_notes',
    dateAdded: 'date_added',
  },
  testimonials: {
    patientName: 'patient_name',
    location: 'location',
    condition: 'condition',
    comment: 'comment',
    rating: 'rating',
    treatedBy: 'treated_by',
    doctorConsulted: 'doctor_consulted',
    treatmentDuration: 'treatment_duration',
    date: 'date',
  },
};

const REVERSE_MAP: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(COLUMN_MAP).map(([table, map]) => [
    table,
    Object.fromEntries(Object.entries(map).map(([camel, snake]) => [snake, camel])),
  ])
);

/** Write a JS object into DB row shape (snake_case) for a table. */
function toRow<T extends { id: string }>(table: string, data: T): Record<string, unknown> {
  const map = COLUMN_MAP[table] || {};
  const d = data as unknown as Record<string, unknown>;
  const row: Record<string, unknown> = { id: data.id };

  for (const [camel, snake] of Object.entries(map)) {
    if (d[camel] !== undefined) row[snake] = d[camel];
  }

  // Mirror media URL into legacy image-only columns when the media is an image.
  if (table === 'prepost') {
    if (d.beforeMediaType === 'image' && d.beforeMediaUrl) {
      row.before_image = d.beforeMediaUrl;
    }
    if (d.afterMediaType === 'image' && d.afterMediaUrl) {
      row.after_image = d.afterMediaUrl;
    }
  } else if (table === 'gallery') {
    if (d.mediaType === 'image' && d.mediaUrl) {
      row.image_url = d.mediaUrl;
    }
  } else if (table === 'blog') {
    if (d.mediaType === 'image' && d.mediaUrl) {
      row.cover_image = d.mediaUrl;
    }
  }

  return row;
}

/** Read a DB row (snake_case) back into the app's camelCase shape. */
function fromRow<T>(table: string, row: Record<string, unknown>): T {
  const map = REVERSE_MAP[table] || {};
  const out: Record<string, unknown> = { id: row.id };

  for (const [snake, value] of Object.entries(row)) {
    const camel = map[snake];
    if (camel) out[camel] = value;
  }

  // Legacy fallbacks — treat pre-migration rows as `image` media.
  if (table === 'prepost') {
    if (!out.beforeMediaType) out.beforeMediaType = 'image';
    if (!out.beforeMediaUrl && row.before_image) {
      out.beforeMediaUrl = row.before_image;
    }
    if (!out.afterMediaType) out.afterMediaType = 'image';
    if (!out.afterMediaUrl && row.after_image) {
      out.afterMediaUrl = row.after_image;
    }
  } else if (table === 'gallery') {
    if (!out.mediaType) out.mediaType = 'image';
    if (!out.mediaUrl && row.image_url) out.mediaUrl = row.image_url;
  } else if (table === 'blog') {
    if (!out.mediaType) out.mediaType = 'image';
    if (!out.mediaUrl && row.cover_image) out.mediaUrl = row.cover_image;
  }

  return out as T;
}

// ---------------------------------------------------------------------------
// COLLECTION READS
// ---------------------------------------------------------------------------

export async function fetchSupabaseCollection<T extends { id: string }>(
  table: string,
  orderBy?: { column: string; ascending?: boolean }
): Promise<T[]> {
  try {
    let query = supabase.from(table).select('*');
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Record<string, unknown>[]).map((row) => fromRow<T>(table, row));
  } catch (error) {
    handleSupabaseError(error, SupabaseOp.LIST, table);
    return [];
  }
}

export function subscribeSupabaseCollection<T extends { id: string }>(
  table: string,
  onData: (data: T[]) => void,
  onError?: (message: string) => void,
  orderBy?: { column: string; ascending?: boolean }
): Unsubscribe {
  let unsubscribed = false;

  const fetchData = async () => {
    try {
      let query = supabase.from(table).select('*');
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }
      const { data, error } = await query;
      if (unsubscribed) return;
      if (error) throw error;
      const mapped = (data as unknown as Record<string, unknown>[]).map((row) =>
        fromRow<T>(table, row)
      );
      onData(mapped);
    } catch (error) {
      if (unsubscribed) return;
      handleSupabaseError(error, SupabaseOp.LIST, table);
      const message = error instanceof Error ? error.message : String(error);
      onError?.(message);
    }
  };

  fetchData();

  const channel = supabase
    .channel(`realtime-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      fetchData();
    })
    .subscribe();

  return () => {
    unsubscribed = true;
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// WRITE OPERATIONS
// ---------------------------------------------------------------------------

export async function saveDocumentToSupabase<T extends { id: string }>(
  table: string,
  data: T
): Promise<boolean> {
  try {
    const row = toRow(table, data);
    const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
    if (error) {
      handleSupabaseError(error, SupabaseOp.WRITE, `${table}/${data.id}`);
      return false;
    }
    return true;
  } catch (error) {
    handleSupabaseError(error, SupabaseOp.WRITE, `${table}/${data.id}`);
    return false;
  }
}

export async function deleteDocumentFromSupabase(
  table: string,
  id: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      handleSupabaseError(error, SupabaseOp.DELETE, `${table}/${id}`);
      return false;
    }
    return true;
  } catch (error) {
    handleSupabaseError(error, SupabaseOp.DELETE, `${table}/${id}`);
    return false;
  }
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

// ---------------------------------------------------------------------------
// SUPABASE STORAGE — media upload
// ---------------------------------------------------------------------------

export async function uploadFileToStorage(
  file: File,
  folder: 'gallery' | 'blog' | 'doctors' | 'prepost' | 'cases' = 'gallery',
  subfolder?: 'images' | 'videos'
): Promise<string> {
  const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storagePath = subfolder
    ? `${folder}/${subfolder}/${cleanFileName}`
    : `${folder}/${cleanFileName}`;

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || undefined,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(error.message);
  }

  return getPublicStorageUrl(storagePath);
}