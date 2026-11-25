import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import {
  MissingFirebaseAdminCredentialsError,
  initializeFirebaseAdmin,
} from '../../scripts/lib/firebaseAdmin';
import {
  computeDocumentChecksum,
  extractSupabaseStoragePath,
  parsePgTimestamp,
  rewriteMediaUrl,
  toMediaAssetId,
  transformSupabaseRow,
  validateTransformedDoc,
} from '../../scripts/lib/migrationTransform';

describe('Migration Data Transformations (Firestore-Only Strings)', () => {
  it('parses PostgreSQL TIMESTAMPTZ with fractional seconds cleanly', () => {
    const ts = parsePgTimestamp('2026-09-05T12:06:16.701185+00:00');
    expect(ts).toBeInstanceOf(Timestamp);
    expect(ts!.toDate().toISOString()).toBe('2026-09-05T12:06:16.701Z');
    expect(parsePgTimestamp(null)).toBeNull();
    expect(() => parsePgTimestamp('not-a-date')).toThrowError(/Invalid PostgreSQL timestamp/);
  });

  it('converts Supabase Storage URLs into deterministic Firestore string media values', () => {
    const urlMap = {
      'gallery/1789_photo.jpg': 'data:image/jpeg;base64,/9j/4AAQ',
      'gallery/videos/clip.mp4': 'firestore-media://gallery__videos__clip.mp4',
    };
    const supaPhoto =
      'https://uhlsjevfzcbgllprfxdt.supabase.co/storage/v1/object/public/clinic-images/gallery/1789_photo.jpg';
    const supaVideo =
      'https://uhlsjevfzcbgllprfxdt.supabase.co/storage/v1/object/public/clinic-images/gallery/videos/clip.mp4';

    expect(extractSupabaseStoragePath(supaPhoto)).toBe('gallery/1789_photo.jpg');
    expect(toMediaAssetId('gallery/videos/clip.mp4')).toBe('gallery__videos__clip.mp4');
    expect(rewriteMediaUrl(supaPhoto, urlMap)).toBe('data:image/jpeg;base64,/9j/4AAQ');
    expect(rewriteMediaUrl(supaVideo, urlMap)).toBe('firestore-media://gallery__videos__clip.mp4');
    expect(rewriteMediaUrl('https://images.unsplash.com/photo-123', urlMap)).toBe(
      'https://images.unsplash.com/photo-123'
    );
    expect(() =>
      rewriteMediaUrl(
        'https://uhlsjevfzcbgllprfxdt.supabase.co/storage/v1/object/public/clinic-images/missing.jpg',
        urlMap
      )
    ).toThrowError(/Missing migrated Firestore media string/);
  });

  it('backfills gallery.mediaUrl and blog.mediaUrl from legacy columns and preserves appointments PII', () => {
    const urlMap = {
      'gallery/legacy.jpg': 'firestore-media://gallery__legacy.jpg',
      'blog/cover.jpg': 'data:image/jpeg;base64,COVERDATA',
    };

    const gal = transformSupabaseRow(
      'gallery',
      {
        id: 'gal-9685',
        title: 'BELAGAVI CLINIC',
        category: 'Clinic',
        media_type: 'image',
        media_url: null,
        image_url:
          'https://uhlsjevfzcbgllprfxdt.supabase.co/storage/v1/object/public/clinic-images/gallery/legacy.jpg',
        caption: null,
        date: 'Belgaum Clinic',
        created_at: '2026-09-20T16:18:39.83183+00:00',
        updated_at: '2026-09-20T16:18:39.83183+00:00',
      },
      urlMap
    );
    expect(gal.mediaUrl).toBe('firestore-media://gallery__legacy.jpg');
    expect(gal.caption).toBeNull();
    expect(validateTransformedDoc('gallery', gal)).toEqual([]);

    const blog = transformSupabaseRow(
      'blog',
      {
        id: 'post-9870',
        title: 'Sciatica',
        slug: 'sciatica',
        author: 'Dr. Yogesh Dravid',
        author_role: 'HOD',
        category: 'Clinical',
        published_date: 'Sep 21, 2026',
        read_time: '4 min',
        excerpt: 'Summary',
        content: 'Full content',
        media_type: 'image',
        media_url: null,
        cover_image:
          'https://uhlsjevfzcbgllprfxdt.supabase.co/storage/v1/object/public/clinic-images/blog/cover.jpg',
        tags: ['Physiology'],
        created_at: '2026-09-21T09:27:40.00108+00:00',
        updated_at: '2026-09-21T09:27:40.00108+00:00',
      },
      urlMap
    );
    expect(blog.mediaUrl).toBe('data:image/jpeg;base64,COVERDATA');
    expect(validateTransformedDoc('blog', blog)).toEqual([]);

    const appt = transformSupabaseRow(
      'appointments',
      {
        id: 'appt-1',
        patient_name: 'Patient A',
        patient_email: 'a@example.com',
        patient_phone: '9999999999',
        patient_age: 42,
        patient_gender: 'Male',
        branch_id: 'belgaum',
        doctor_id: 'dr-yogesh-dravid',
        appointment_date: '2026-09-08',
        appointment_time: '12:00 PM',
        health_concern: 'Skin',
        consultation_type: 'In-Clinic',
        status: 'Confirmed',
        email_reminder_sent: false,
        created_at: '2026-09-07T13:17:32.162+00:00',
        updated_at: '2026-09-07T14:56:05.78689+00:00',
      },
      urlMap
    );
    expect(appt.patientAge).toBe(42);
    expect(appt.status).toBe('Confirmed');
    expect(appt.emailReminderSent).toBe(false);
  });

  it('produces identical checksums regardless of object key order', () => {
    const ts = Timestamp.fromMillis(1788787052162);
    const a = { id: 'x', b: 2, a: 1, createdAt: ts };
    const b = { createdAt: ts, a: 1, b: 2, id: 'x' };
    expect(computeDocumentChecksum(a)).toBe(computeDocumentChecksum(b));
  });

  it('throws clear credential error when Admin SDK env vars are absent and not in emulator mode', () => {
    const prevCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const prevEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const prevKey = process.env.FIREBASE_PRIVATE_KEY;
    const prevFs = process.env.FIRESTORE_EMULATOR_HOST;
    const prevAuth = process.env.FIREBASE_AUTH_EMULATOR_HOST;

    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

    try {
      expect(() => initializeFirebaseAdmin()).toThrowError(
        MissingFirebaseAdminCredentialsError
      );
    } finally {
      if (prevCreds !== undefined) process.env.GOOGLE_APPLICATION_CREDENTIALS = prevCreds;
      if (prevEmail !== undefined) process.env.FIREBASE_CLIENT_EMAIL = prevEmail;
      if (prevKey !== undefined) process.env.FIREBASE_PRIVATE_KEY = prevKey;
      if (prevFs !== undefined) process.env.FIRESTORE_EMULATOR_HOST = prevFs;
      if (prevAuth !== undefined) process.env.FIREBASE_AUTH_EMULATOR_HOST = prevAuth;
    }
  });
});
