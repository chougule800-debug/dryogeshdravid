/**
 * Standalone Firebase seed script (for fresh environments or local Firebase Emulators).
 * Converts local /images/... assets into Firestore-only Base64 strings (inline or chunked).
 *
 * Usage:
 *   npx tsx scripts/seed-firebase.ts --emulator
 *   GOOGLE_APPLICATION_CREDENTIALS=... npm run seed:firebase
 */
import 'dotenv/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import {
  CLINICS,
  CLINICAL_SERVICES,
  DOCTORS,
  INITIAL_BLOG_POSTS,
  INITIAL_GALLERY,
  INITIAL_PRE_POST_CASES,
  INITIAL_TESTIMONIALS,
} from '../src/data/initialData';
import {
  FIRESTORE_CHUNK_SIZE_CHARS,
  FIRESTORE_MEDIA_PREFIX,
  INLINE_DATA_URL_LIMIT_CHARS,
  PREPOST_INLINE_DATA_URL_LIMIT_CHARS,
  splitStringIntoChunks,
} from '../src/services/firestoreTransforms';
import { initializeFirebaseAdmin } from './lib/firebaseAdmin';
import { toMediaAssetId } from './lib/migrationTransform';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

function extToMime(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
  return (
    (
      {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        svg: 'image/svg+xml',
      } as Record<string, string>
    )[ext] || 'application/octet-stream'
  );
}

async function resolveImageToFirestoreString(
  value: string | undefined,
  folder: string,
  db: Firestore
): Promise<string | undefined> {
  if (!value || !value.startsWith('/images/')) return value;

  const filename = path.basename(value);
  const localFile = path.join(PUBLIC_DIR, value.replace(/^\//, ''));
  if (!fs.existsSync(localFile)) return value;

  const buf = fs.readFileSync(localFile);
  const contentType = extToMime(filename);
  const base64 = buf.toString('base64');
  const dataUrl = `data:${contentType};base64,${base64}`;
  const inlineLimit =
    folder === 'prepost'
      ? PREPOST_INLINE_DATA_URL_LIMIT_CHARS
      : INLINE_DATA_URL_LIMIT_CHARS;

  if (dataUrl.length <= inlineLimit) {
    return dataUrl;
  }

  const assetId = toMediaAssetId(`${folder}/${filename}`);
  const chunks = splitStringIntoChunks(base64, FIRESTORE_CHUNK_SIZE_CHARS);
  const now = Timestamp.now();
  const assetRef = db.collection('media_assets').doc(assetId);
  await assetRef.set(
    {
      id: assetId,
      sourcePath: `${folder}/${filename}`,
      contentType,
      encoding: 'base64',
      totalChunks: chunks.length,
      totalBytes: buf.length,
      sha256: crypto.createHash('sha256').update(buf).digest('hex'),
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  for (let i = 0; i < chunks.length; i += 3) {
    const batch = db.batch();
    chunks.slice(i, i + 3).forEach((chunkStr, offset) => {
      const idx = i + offset;
      batch.set(assetRef.collection('chunks').doc(String(idx).padStart(4, '0')), {
        index: idx,
        data: chunkStr,
      });
    });
    await batch.commit();
  }

  return `${FIRESTORE_MEDIA_PREFIX}${assetId}`;
}

async function main() {
  if (process.argv.includes('--emulator')) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
  }

  const { db } = initializeFirebaseAdmin();
  const now = Timestamp.now();
  const batch = db.batch();

  for (const d of DOCTORS) {
    const image = await resolveImageToFirestoreString(d.image, 'doctors', db);
    batch.set(db.collection('doctors').doc(d.id), { ...d, image, createdAt: now, updatedAt: now }, { merge: true });
  }
  for (const c of CLINICS) {
    batch.set(db.collection('clinics').doc(c.id), { ...c, createdAt: now, updatedAt: now }, { merge: true });
  }
  for (const s of CLINICAL_SERVICES) {
    batch.set(db.collection('services').doc(s.id), { ...s, createdAt: now, updatedAt: now }, { merge: true });
  }
  for (const p of INITIAL_PRE_POST_CASES) {
    const beforeMediaUrl =
      p.beforeMediaType === 'image'
        ? await resolveImageToFirestoreString(p.beforeMediaUrl, 'prepost', db)
        : p.beforeMediaUrl;
    const afterMediaUrl =
      p.afterMediaType === 'image'
        ? await resolveImageToFirestoreString(p.afterMediaUrl, 'prepost', db)
        : p.afterMediaUrl;
    batch.set(
      db.collection('prepost').doc(p.id),
      { ...p, beforeMediaUrl, afterMediaUrl, createdAt: now, updatedAt: now },
      { merge: true }
    );
  }
  for (const g of INITIAL_GALLERY) {
    const mediaUrl =
      g.mediaType === 'image'
        ? await resolveImageToFirestoreString(g.mediaUrl, 'gallery', db)
        : g.mediaUrl;
    batch.set(db.collection('gallery').doc(g.id), { ...g, mediaUrl, createdAt: now, updatedAt: now }, { merge: true });
  }
  for (const b of INITIAL_BLOG_POSTS) {
    const mediaUrl =
      b.mediaType === 'image'
        ? await resolveImageToFirestoreString(b.mediaUrl, 'blog', db)
        : b.mediaUrl;
    batch.set(db.collection('blog').doc(b.id), { ...b, mediaUrl, createdAt: now, updatedAt: now }, { merge: true });
  }
  for (const t of INITIAL_TESTIMONIALS) {
    batch.set(db.collection('testimonials').doc(t.id), { ...t, createdAt: now, updatedAt: now }, { merge: true });
  }

  await batch.commit();
  console.log('Firebase seeded successfully (Firestore-only).');
}

main().catch((err) => {
  console.error('Firebase seed failed:', err);
  process.exit(1);
});
