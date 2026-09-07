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
  const errMsg = error instanceof Error ? error.message : String(error);
  console.warn(`Supabase [${operationType}] at "${path}":`, errMsg);
}

// ---------------------------------------------------------------------------
// CamelCase <-> snake_case column mapping (matches src/types.ts fields)
// ---------------------------------------------------------------------------
type ColumnMap = Record<string, Record<string, string>>; // table -> (camel -> snake)

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
    imageUrl: 'image_url',
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
    coverImage: 'cover_image',
    tags: 'tags',
  },
  prepost: {
    title: 'title',
    condition: 'condition',
    category: 'category',
    patientAgeGender: 'patient_age_gender',
    durationOfTreatment: 'duration_of_treatment',
    beforeImage: 'before_image',
    afterImage: 'after_image',
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
    status: 'status',
    emailReminderSent: 'email_reminder_sent',
    createdAt: 'created_at',
  },
};

const REVERSE_MAP: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(COLUMN_MAP).map(([table, map]) => [
    table,
    Object.fromEntries(Object.entries(map).map(([camel, snake]) => [snake, camel])),
  ])
);

/** Write a JS object into DB row shape (snake_case columns) for a table. */
function toRow<T extends { id: string }>(table: string, data: T): Record<string, unknown> {
  const map = COLUMN_MAP[table] || {};
  const row: Record<string, unknown> = { id: data.id };
  for (const [camel, snake] of Object.entries(map)) {
    if ((data as unknown as Record<string, unknown>)[camel] !== undefined) {
      row[snake] = (data as unknown as Record<string, unknown>)[camel];
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
  return out as T;
}

// ---------------------------------------------------------------------------
// COLLECTION READS (with Realtime subscription)
// ---------------------------------------------------------------------------

export async function fetchSupabaseCollection<T extends { id: string }>(
  table: string
): Promise<T[]> {
  try {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    return (data as unknown as Record<string, unknown>[]).map((row) => fromRow<T>(table, row));
  } catch (error) {
    handleSupabaseError(error, SupabaseOp.LIST, table);
    return [];
  }
}

/**
 * Subscribes to a Supabase table. Fetches the initial snapshot, then refetches the
 * whole collection whenever a row changes (insert/update/delete) via Supabase
 * Realtime. Always calls onData even when the collection becomes empty, so the UI
 * shows a proper empty state.
 */
export function subscribeSupabaseCollection<T extends { id: string }>(
  table: string,
  onData: (data: T[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  let unsubscribed = false;

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from(table).select('*');
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
// WRITE OPERATIONS (upsert by id, delete by id)
// ---------------------------------------------------------------------------

export async function saveDocumentToSupabase<T extends { id: string }>(
  table: string,
  data: T
): Promise<boolean> {
  try {
    const row = toRow(table, data);
    const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
    if (error) throw error;
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
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, SupabaseOp.DELETE, `${table}/${id}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// SUPABASE STORAGE — image upload (throws on failure, no Base64 fallback)
// ---------------------------------------------------------------------------
export async function uploadFileToStorage(
  file: File,
  folder: 'gallery' | 'blog' | 'doctors' | 'prepost' | 'cases' = 'gallery'
): Promise<string> {
  const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storagePath = `${folder}/${cleanFileName}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(storagePath, file, { upsert: true });
  if (error) {
    throw new Error(error.message);
  }
  return getPublicStorageUrl(storagePath);
}