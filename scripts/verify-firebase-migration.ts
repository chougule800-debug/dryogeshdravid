/**
 * Comprehensive record-level Supabase-backup vs Cloud Firestore verification audit.
 *
 * Verifies:
 *  - Document counts & primary IDs across all 9 entity collections
 *  - Normalized field-level SHA-256 checksum comparison (zero silent data corruption)
 *  - Zero remaining Supabase Storage URLs
 *  - Byte-for-byte SHA-256 verification of ALL 38 migrated media files (both inline Data URLs
 *    and chunked `media_assets/{id}/chunks/*` strings inside Cloud Firestore!)
 *  - Firebase Auth user existence, emailVerified status, and admin custom claims
 */
import 'dotenv/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { FIRESTORE_MEDIA_PREFIX, parseDataUrl } from '../src/services/firestoreTransforms';
import { initializeFirebaseAdmin } from './lib/firebaseAdmin';
import {
  COLLECTION_ORDER,
  MigratedCollection,
  computeDocumentChecksum,
  extractSupabaseStoragePath,
  transformSupabaseRow,
} from './lib/migrationTransform';
import { buildMediaMigrationPlan } from './migrate-to-firebase';

interface VerificationRow {
  entity: string;
  sourceCount: number;
  firebaseCount: number;
  verified: number;
  failed: number;
  missing: number;
}

async function main() {
  const args = process.argv.slice(2);
  const emulator = args.includes('--emulator');
  if (emulator) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
  }

  const backupDir = path.resolve(process.cwd(), 'migration-archive', 'supabase-backup');
  const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, 'manifest.json'), 'utf8'));
  const tables: Record<MigratedCollection, Record<string, unknown>[]> = {} as any;
  for (const col of COLLECTION_ORDER) {
    tables[col] = JSON.parse(
      fs.readFileSync(path.join(backupDir, 'tables', `${col}.json`), 'utf8')
    ) as Record<string, unknown>[];
  }

  const storageRoot = path.join(backupDir, 'storage', 'clinic-images');
  const { planByPath, mediaValueMap } = buildMediaMigrationPlan(manifest, tables, storageRoot);

  const { auth, db, projectId, isEmulator } = initializeFirebaseAdmin();
  console.log(`Verifying Firebase project="${projectId}", emulator=${isEmulator} (Firestore-only mode)\n`);

  const reportRows: VerificationRow[] = [];
  const discrepancies: string[] = [];

  // 1. Verify Auth users
  const sourceUsers = JSON.parse(
    fs.readFileSync(path.join(backupDir, 'auth', 'users.json'), 'utf8')
  ) as Array<Record<string, unknown>>;
  const adminIds = new Set(
    tables.profiles.filter((p) => Boolean(p.is_admin)).map((p) => String(p.id))
  );

  const listAuthRes = await auth.listUsers(1000);
  const firebaseUsersByUid = new Map(listAuthRes.users.map((u) => [u.uid, u]));
  let authVerified = 0;
  let authFailed = 0;
  let authMissing = 0;

  for (const su of sourceUsers) {
    const uid = String(su.id);
    const fu = firebaseUsersByUid.get(uid);
    if (!fu) {
      authMissing++;
      discrepancies.push(`Auth user missing in Firebase: ${uid}`);
      continue;
    }
    const expectedVerified = Boolean(su.email_confirmed_at);
    const expectedAdmin = adminIds.has(uid);
    const hasAdminClaim = fu.customClaims?.is_admin === true;
    if (
      fu.email !== su.email ||
      fu.emailVerified !== expectedVerified ||
      (expectedAdmin && !hasAdminClaim)
    ) {
      authFailed++;
      discrepancies.push(`Auth metadata mismatch for uid=${uid}`);
    } else {
      authVerified++;
    }
  }
  reportRows.push({
    entity: 'Auth Users',
    sourceCount: sourceUsers.length,
    firebaseCount: listAuthRes.users.length,
    verified: authVerified,
    failed: authFailed,
    missing: authMissing,
  });

  // 2. Verify all 9 Firestore collections record-by-record
  const destDocsByCollection = new Map<MigratedCollection, Map<string, Record<string, unknown>>>();

  for (const col of COLLECTION_ORDER) {
    const sourceRows = tables[col];
    const destSnap = await db.collection(col).get();
    const destById = new Map(destSnap.docs.map((d) => [d.id, d.data()]));
    destDocsByCollection.set(col, destById);

    let verified = 0;
    let failed = 0;
    let missing = 0;

    for (const row of sourceRows) {
      const id = String(row.id);
      const destData = destById.get(id);
      if (!destData) {
        missing++;
        discrepancies.push(`${col}/${id}: missing in Firestore`);
        continue;
      }

      for (const fieldVal of Object.values(destData)) {
        if (typeof fieldVal === 'string' && extractSupabaseStoragePath(fieldVal)) {
          failed++;
          discrepancies.push(`${col}/${id}: still references Supabase Storage URL`);
        }
      }

      const expected = transformSupabaseRow(col, row, mediaValueMap);
      const expectedSum = computeDocumentChecksum(expected);
      const actualSum = computeDocumentChecksum(destData);

      if (expectedSum !== actualSum) {
        failed++;
        discrepancies.push(
          `${col}/${id}: field checksum mismatch (expected=${expectedSum.slice(
            0,
            10
          )}, actual=${actualSum.slice(0, 10)})`
        );
      } else {
        verified++;
      }
    }

    const sourceIds = new Set(sourceRows.map((r) => String(r.id)));
    for (const destId of destById.keys()) {
      if (!sourceIds.has(destId)) {
        discrepancies.push(`${col}/${destId}: unexpected extra document in Firestore`);
      }
    }

    reportRows.push({
      entity: col,
      sourceCount: sourceRows.length,
      firebaseCount: destSnap.size,
      verified,
      failed,
      missing,
    });
  }

  // 3. Verify all 38 Media Files inside Cloud Firestore (inline strings + chunked media_assets)
  // Collect every inline Data URL present on destination entity docs keyed by SHA-256
  const inlineShaCounts = new Map<string, number>();
  for (const col of ['doctors', 'gallery', 'blog', 'prepost'] as MigratedCollection[]) {
    const destById = destDocsByCollection.get(col)!;
    for (const docData of destById.values()) {
      for (const field of ['image', 'mediaUrl', 'beforeMediaUrl', 'afterMediaUrl']) {
        const val = docData[field];
        if (typeof val === 'string' && val.startsWith('data:')) {
          const parsed = parseDataUrl(val);
          if (parsed) {
            const bytes = Buffer.from(parsed.base64, 'base64');
            const sha = crypto.createHash('sha256').update(bytes).digest('hex');
            inlineShaCounts.set(sha, (inlineShaCounts.get(sha) || 0) + 1);
          }
        }
      }
    }
  }

  let mediaVerified = 0;
  let mediaFailed = 0;
  let mediaMissing = 0;
  let destMediaCount = 0;

  for (const item of planByPath.values()) {
    if (item.storeInline) {
      if ((inlineShaCounts.get(item.sha256) || 0) > 0) {
        destMediaCount++;
        mediaVerified++;
      } else {
        mediaMissing++;
        discrepancies.push(`Inline media missing or corrupted in Firestore docs: ${item.path}`);
      }
      continue;
    }

    const assetRef = db.collection('media_assets').doc(item.assetId);
    const assetSnap = await assetRef.get();
    if (!assetSnap.exists) {
      mediaMissing++;
      discrepancies.push(`Chunked media_assets doc missing: ${item.assetId} (${item.path})`);
      continue;
    }
    destMediaCount++;

    const meta = assetSnap.data()!;
    const chunksSnap = await assetRef.collection('chunks').orderBy('index', 'asc').get();
    const combinedBase64 = chunksSnap.docs.map((d) => String(d.data().data || '')).join('');
    const decodedBytes = Buffer.from(combinedBase64, 'base64');
    const actualSha = crypto.createHash('sha256').update(decodedBytes).digest('hex');

    if (
      chunksSnap.size !== meta.totalChunks ||
      decodedBytes.length !== item.size ||
      actualSha !== item.sha256
    ) {
      mediaFailed++;
      discrepancies.push(
        `Chunked media integrity mismatch for ${item.path}: size=${decodedBytes.length}/${item.size}, chunks=${chunksSnap.size}/${meta.totalChunks}`
      );
    } else {
      mediaVerified++;
    }
  }

  // Also ensure every firestore-media:// pointer on entity docs resolves to an existing media_assets doc
  for (const col of ['doctors', 'gallery', 'blog', 'prepost'] as MigratedCollection[]) {
    const destById = destDocsByCollection.get(col)!;
    for (const [docId, docData] of destById.entries()) {
      for (const field of ['image', 'mediaUrl', 'beforeMediaUrl', 'afterMediaUrl']) {
        const val = docData[field];
        if (typeof val === 'string' && val.startsWith(FIRESTORE_MEDIA_PREFIX)) {
          const assetId = val.slice(FIRESTORE_MEDIA_PREFIX.length);
          const snap = await db.collection('media_assets').doc(assetId).get();
          if (!snap.exists) {
            discrepancies.push(`${col}/${docId}.${field} points to missing media_assets/${assetId}`);
          }
        }
      }
    }
  }

  reportRows.push({
    entity: 'Media Assets (Firestore)',
    sourceCount: planByPath.size,
    firebaseCount: destMediaCount,
    verified: mediaVerified,
    failed: mediaFailed,
    missing: mediaMissing,
  });

  console.log('| Data Entity | Supabase Records | Firebase Records | Verified | Failed | Missing |');
  console.log('|---|---:|---:|---:|---:|---:|');
  for (const r of reportRows) {
    console.log(
      `| ${r.entity} | ${r.sourceCount} | ${r.firebaseCount} | ${r.verified} | ${r.failed} | ${r.missing} |`
    );
  }

  if (discrepancies.length > 0) {
    console.error('\nDiscrepancies detected:');
    discrepancies.forEach((d) => console.error(`  - ${d}`));
    process.exit(1);
  }

  console.log(
    '\nALL RECORDS, AUTH USERS, AND FIRESTORE STRING MEDIA ASSETS VERIFIED WITH 100% CRYPTOGRAPHIC INTEGRITY.'
  );
}

main().catch((err) => {
  console.error('\nVerification failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
