import { describe, expect, it } from 'vitest';
import { validateFirebaseEnv } from '../../src/lib/firebaseConfig';
import {
  base64ToBytes,
  bytesToBase64,
  fromFirestoreDoc,
  parseDataUrl,
  splitStringIntoChunks,
  toFirestorePayload,
  validateMediaFile,
} from '../../src/services/firestoreTransforms';

describe('Firebase Environment Validation (Firestore + Auth only)', () => {
  const validEnv = {
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'drdravid-f4b42.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'drdravid-f4b42',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '1024197258069',
    VITE_FIREBASE_APP_ID: '1:1024197258069:web:test',
    VITE_FIREBASE_MEASUREMENT_ID: 'G-TEST',
  };

  it('returns validated FirebaseOptions without requiring any Storage bucket', () => {
    const config = validateFirebaseEnv(validEnv);
    expect(config.projectId).toBe('drdravid-f4b42');
    expect(config.measurementId).toBe('G-TEST');
    expect(config.storageBucket).toBeUndefined();
  });

  it('throws clear error listing missing required environment variables', () => {
    expect(() =>
      validateFirebaseEnv({
        VITE_FIREBASE_API_KEY: 'abc',
      })
    ).toThrowError(/Missing Firebase environment variables:.*VITE_FIREBASE_PROJECT_ID/);
  });
});

describe('Firestore Media String Encoding & Chunking Helpers', () => {
  it('round-trips arbitrary bytes cleanly through Base64 and chunk splitting', () => {
    const original = new Uint8Array([0, 1, 2, 127, 128, 255, 42, 99, 13]);
    const b64 = bytesToBase64(original);
    const chunks = splitStringIntoChunks(b64, 4);
    expect(chunks.length).toBeGreaterThan(1);
    const restored = base64ToBytes(chunks.join(''));
    expect(Array.from(restored)).toEqual(Array.from(original));
  });

  it('parses Data URL headers and Base64 body accurately', () => {
    const parsed = parseDataUrl('data:image/jpeg;base64,/9j/4AAQ');
    expect(parsed).toEqual({ contentType: 'image/jpeg', base64: '/9j/4AAQ' });
    expect(parseDataUrl('firestore-media://asset_1')).toBeNull();
  });
});

describe('Media File Validation', () => {
  function fakeFile(name: string, type: string, sizeBytes: number): File {
    return { name, type, size: sizeBytes } as unknown as File;
  }

  it('accepts valid images under 5MB and rejects oversized or invalid MIME images', () => {
    expect(validateMediaFile(fakeFile('photo.jpg', 'image/jpeg', 1024 * 1024), 'image')).toEqual({
      valid: true,
    });
    expect(validateMediaFile(fakeFile('big.png', 'image/png', 6 * 1024 * 1024), 'image').valid).toBe(
      false
    );
    expect(validateMediaFile(fakeFile('bad.exe', 'application/x-msdownload', 1024), 'image').valid).toBe(
      false
    );
    expect(validateMediaFile(fakeFile('unknown', '', 1024), 'image').valid).toBe(false);
  });

  it('accepts valid videos under 50MB and rejects oversized videos', () => {
    expect(
      validateMediaFile(fakeFile('clip.mp4', 'video/mp4', 20 * 1024 * 1024), 'video')
    ).toEqual({ valid: true });
    expect(
      validateMediaFile(fakeFile('huge.mp4', 'video/mp4', 51 * 1024 * 1024), 'video').valid
    ).toBe(false);
  });
});

describe('Firestore Document Mapping & Legacy Fallbacks', () => {
  it('hydrates legacy gallery imageUrl/image_url into mediaUrl', () => {
    const item = fromFirestoreDoc<any>('gallery', 'gal-1', {
      title: 'Clinic',
      category: 'Clinic',
      image_url: 'data:image/jpeg;base64,abc',
      caption: 'Desc',
    });
    expect(item.id).toBe('gal-1');
    expect(item.mediaType).toBe('image');
    expect(item.mediaUrl).toBe('data:image/jpeg;base64,abc');
    expect(item.imageUrl).toBeUndefined();
  });

  it('hydrates legacy blog coverImage into mediaUrl', () => {
    const post = fromFirestoreDoc<any>('blog', 'post-1', {
      title: 'Title',
      cover_image: 'firestore-media://blog__cover.jpg',
      content: 'Body',
    });
    expect(post.mediaType).toBe('image');
    expect(post.mediaUrl).toBe('firestore-media://blog__cover.jpg');
    expect(post.tags).toEqual([]);
  });

  it('normalizes legacy snake_case backup JSON and strips undefined & timestamp fields in toFirestorePayload', () => {
    const payload = toFirestorePayload('doctors', {
      id: 'dr-1',
      name: 'Dr. Yogesh',
      experience_years: 20,
      department: undefined,
      created_at: '2026-09-05T12:00:00Z',
    } as any);

    expect(payload.id).toBe('dr-1');
    expect(payload.experienceYears).toBe(20);
    expect('department' in payload).toBe(false);
    expect('created_at' in payload).toBe(false);
    expect('createdAt' in payload).toBe(false);
  });
});
