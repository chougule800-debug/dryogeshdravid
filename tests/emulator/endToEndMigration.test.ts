import { execFile } from 'child_process';
import { createRequire } from 'module';
import * as path from 'path';
import { promisify } from 'util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeFirebaseAdmin } from '../../scripts/lib/firebaseAdmin';
import {
  base64ToBytes,
  extractFirestoreMediaId,
  isFirestoreMediaPointer,
  parseDataUrl,
} from '../../src/services/firestoreTransforms';

const require = createRequire(import.meta.url);
const { getApps, initializeApp } = require('firebase/app') as typeof import('firebase/app');
const {
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
  signOut,
} = require('firebase/auth') as typeof import('firebase/auth');
const {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} = require('firebase/firestore') as typeof import('firebase/firestore');

const execFileAsync = promisify(execFile);

const hasEmulators = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST
);

describe.skipIf(!hasEmulators)('End-to-End Firestore-Only Migration & Verification', () => {
  const tsxBin = path.resolve(process.cwd(), 'node_modules', '.bin', 'tsx');

  beforeAll(async () => {
    await fetch(
      `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/drdravid-f4b42/databases/(default)/documents`,
      { method: 'DELETE' }
    );

    // 1. Dry-run must succeed cleanly
    const dryRes = await execFileAsync(tsxBin, ['scripts/migrate-to-firebase.ts', '--dry-run'], {
      cwd: process.cwd(),
      env: process.env,
    });
    expect(dryRes.stdout).toContain('Firebase Storage required : 0 bytes');
    expect(dryRes.stdout).toContain('Preflight validation      : PASSED');

    // 2. Actual migration into Firebase Auth + Firestore Emulators (no Storage emulator needed)
    const migRes = await execFileAsync(tsxBin, ['scripts/migrate-to-firebase.ts', '--emulator'], {
      cwd: process.cwd(),
      env: process.env,
    });
    expect(migRes.stdout).toContain('Migration finished cleanly');

    // 3. Idempotent re-run must skip already verified chunked assets & docs without duplication
    const resumeRes = await execFileAsync(
      tsxBin,
      ['scripts/migrate-to-firebase.ts', '--emulator', '--resume'],
      {
        cwd: process.cwd(),
        env: process.env,
      }
    );
    expect(resumeRes.stdout).toContain('chunked_written=0');
  });

  afterAll(async () => {
    const fs = await import('fs');
    const cp = path.resolve(
      process.cwd(),
      'migration-archive/migration-checkpoint.emulator.json'
    );
    if (fs.existsSync(cp)) fs.unlinkSync(cp);
  });

  it('passes 100% record-level, Auth, and cryptographic Media Asset SHA-256 verification', async () => {
    const verifyRes = await execFileAsync(
      tsxBin,
      ['scripts/verify-firebase-migration.ts', '--emulator'],
      {
        cwd: process.cwd(),
        env: process.env,
      }
    );
    expect(verifyRes.stdout).toContain('| Auth Users | 1 | 1 | 1 | 0 | 0 |');
    expect(verifyRes.stdout).toContain('| doctors | 1 | 1 | 1 | 0 | 0 |');
    expect(verifyRes.stdout).toContain('| clinics | 2 | 2 | 2 | 0 | 0 |');
    expect(verifyRes.stdout).toContain('| services | 6 | 6 | 6 | 0 | 0 |');
    expect(verifyRes.stdout).toContain('| gallery | 10 | 10 | 10 | 0 | 0 |');
    expect(verifyRes.stdout).toContain('| blog | 2 | 2 | 2 | 0 | 0 |');
    expect(verifyRes.stdout).toContain('| prepost | 1 | 1 | 1 | 0 | 0 |');
    expect(verifyRes.stdout).toContain('| testimonials | 7 | 7 | 7 | 0 | 0 |');
    expect(verifyRes.stdout).toContain('| appointments | 4 | 4 | 4 | 0 | 0 |');
    expect(verifyRes.stdout).toContain('| Media Assets (Firestore) | 38 | 38 | 38 | 0 | 0 |');
    expect(verifyRes.stdout).toContain(
      'ALL RECORDS, AUTH USERS, AND FIRESTORE STRING MEDIA ASSETS VERIFIED WITH 100% CRYPTOGRAPHIC INTEGRITY.'
    );
  });

  it('resolves inline Data URLs and chunked Firestore media strings via client SDK, preserves createdAt, and protects PII', async () => {
    const clientAppName = 'e2e-firestore-only-check';
    const existing = getApps().find((a) => a.name === clientAppName);
    const clientApp =
      existing ||
      initializeApp(
        {
          apiKey: 'demo-api-key',
          authDomain: 'drdravid-f4b42.firebaseapp.com',
          projectId: 'drdravid-f4b42',
        },
        clientAppName
      );

    const clientDb = getFirestore(clientApp);
    const clientAuth = getAuth(clientApp);
    if (!existing) {
      const [fsHost, fsPort] = process.env.FIRESTORE_EMULATOR_HOST!.split(':');
      connectFirestoreEmulator(clientDb, fsHost, Number(fsPort));
      connectAuthEmulator(clientAuth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {
        disableWarnings: true,
      });
    }

    // 1. Verify inline Data URL photo stored directly on doctors document
    const doctorSnap = await getDoc(doc(clientDb, 'doctors', 'dr-yogesh-dravid'));
    expect(doctorSnap.exists()).toBe(true);
    const doctorImage = doctorSnap.data()!.image as string;
    expect(doctorImage.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(parseDataUrl(doctorImage)?.base64.length).toBeGreaterThan(1000);

    // 2. Verify gallery items (mix of inline Data URLs and chunked firestore-media:// strings)
    const gallerySnap = await getDocs(
      query(collection(clientDb, 'gallery'), orderBy('createdAt', 'desc'), limit(50))
    );
    expect(gallerySnap.size).toBe(10);

    const videoDoc = gallerySnap.docs.find((d) => d.id === 'gal-305330')!.data();
    expect(isFirestoreMediaPointer(videoDoc.mediaUrl)).toBe(true);
    const assetId = extractFirestoreMediaId(videoDoc.mediaUrl);

    // Reassemble chunked video string from Firestore via public client read
    const assetMeta = (await getDoc(doc(clientDb, 'media_assets', assetId))).data()!;
    expect(assetMeta.contentType).toBe('video/mp4');
    const chunksSnap = await getDocs(
      query(collection(clientDb, 'media_assets', assetId, 'chunks'), orderBy('index', 'asc'))
    );
    expect(chunksSnap.size).toBe(assetMeta.totalChunks);
    const decodedVideoBytes = base64ToBytes(
      chunksSnap.docs.map((d) => String(d.data().data)).join('')
    );
    expect(decodedVideoBytes.length).toBe(assetMeta.totalBytes);

    // 3. Verify migrated admin UID can sign in and preserve createdAt on transactional save
    const { auth: adminAuth } = initializeFirebaseAdmin();
    const adminUid = 'ed2cee0e-01e3-4fc4-8922-205aa7443b19';
    const customToken = await adminAuth.createCustomToken(adminUid, { is_admin: true });
    const cred = await signInWithCustomToken(clientAuth, customToken);
    const tokenRes = await cred.user.getIdTokenResult();
    expect(tokenRes.claims.is_admin).toBe(true);

    const originalCreatedAt = doctorSnap.data()!.createdAt;
    await runTransaction(clientDb, async (tx) => {
      const snap = await tx.get(doc(clientDb, 'doctors', 'dr-yogesh-dravid'));
      tx.set(
        doc(clientDb, 'doctors', 'dr-yogesh-dravid'),
        {
          id: 'dr-yogesh-dravid',
          name: snap.data()!.name,
          createdAt: snap.data()!.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    const afterDoc = await getDoc(doc(clientDb, 'doctors', 'dr-yogesh-dravid'));
    expect(afterDoc.data()!.createdAt.toMillis()).toBe(originalCreatedAt.toMillis());

    await signOut(clientAuth);

    // Ensure non-admin cannot read appointments PII
    await expect(getDoc(doc(clientDb, 'appointments', 'appt-1788787052162'))).rejects.toThrow();
  });
});
