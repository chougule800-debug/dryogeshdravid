/**
 * Production-grade Supabase-backup -> Firebase (Auth + Cloud Firestore ONLY) migration runner.
 *
 * Zero Firebase Storage required:
 *  - Converts all media files (photos & videos) into Base64 strings stored exclusively in Cloud Firestore.
 *  - Media whose Data URL fits safely inside the parent document (<= 700 KB, or <= 340 KB per prepost side)
 *    is stored inline directly on the document field (`data:<mime>;base64,...`).
 *  - Larger photos, videos, and historical media assets are stored losslessly as chunked Base64 strings
 *    in `media_assets/{assetId}/chunks/{0000..N}` and referenced via `firestore-media://{assetId}`.
 *
 * Features:
 *  - Dry-run mode (`--dry-run`) and validation-only mode (`--validate-only`)
 *  - Resumable checkpoints (`--resume` / default skips identical verified items unless `--overwrite`)
 *  - Idempotent Auth + Firestore writes (preserves primary keys, UIDs, and timestamps)
 *  - Cost & quota estimation against Firebase Spark Free Tier before writing
 */
import 'dotenv/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Timestamp } from 'firebase-admin/firestore';
import {
  FIRESTORE_CHUNK_SIZE_CHARS,
  FIRESTORE_MEDIA_PREFIX,
  INLINE_DATA_URL_LIMIT_CHARS,
  PREPOST_INLINE_DATA_URL_LIMIT_CHARS,
  splitStringIntoChunks,
} from '../src/services/firestoreTransforms';
import { initializeFirebaseAdmin } from './lib/firebaseAdmin';
import {
  COLLECTION_ORDER,
  MigratedCollection,
  computeDocumentChecksum,
  extractSupabaseStoragePath,
  toMediaAssetId,
  transformSupabaseRow,
  validateTransformedDoc,
} from './lib/migrationTransform';

interface CliOptions {
  dryRun: boolean;
  validateOnly: boolean;
  resume: boolean;
  overwrite: boolean;
  emulator: boolean;
  backupDir: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  let backupDir = path.resolve(process.cwd(), 'migration-archive', 'supabase-backup');

  for (const arg of args) {
    if (arg.startsWith('--backup-dir=')) {
      backupDir = path.resolve(process.cwd(), arg.split('=')[1]);
    }
  }

  return {
    dryRun: args.includes('--dry-run'),
    validateOnly: args.includes('--validate-only'),
    resume: args.includes('--resume'),
    overwrite: args.includes('--overwrite'),
    emulator: args.includes('--emulator'),
    backupDir,
  };
}

interface BackupManifest {
  createdAt: string;
  sourceSupabaseUrl: string;
  tables: Record<string, { count: number; ids: string[]; sha256: string }>;
  auth: { userCount: number; userIds: string[]; hasEncryptedPasswordField: boolean; sha256: string };
  storage: {
    bucket: string;
    objectCount: number;
    totalBytes: number;
    files: Array<{
      path: string;
      size: number;
      expectedSize: number | null;
      contentType: string;
      sha256: string;
    }>;
  };
}

interface CheckpointState {
  updatedAt: string;
  projectId: string;
  isEmulator: boolean;
  mediaAssetsWritten: Record<string, { sha256: string; totalChunks: number }>;
  authImported: string[];
  firestoreWritten: Record<string, Record<string, string>>;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(label: string, fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = 500 * Math.pow(2, attempt - 1);
      console.warn(
        `  [retry ${attempt}/${maxAttempts}] ${label}: ${
          err instanceof Error ? err.message : String(err)
        } (waiting ${delay}ms)`
      );
      await sleep(delay);
    }
  }
  throw lastErr;
}

function loadBackupData(backupDir: string) {
  const manifestPath = path.join(backupDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Backup manifest not found at ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as BackupManifest;

  const tables: Record<MigratedCollection, Record<string, unknown>[]> = {} as any;
  for (const col of COLLECTION_ORDER) {
    const file = path.join(backupDir, 'tables', `${col}.json`);
    if (!fs.existsSync(file)) {
      throw new Error(`Missing table backup file: ${file}`);
    }
    const raw = fs.readFileSync(file, 'utf8');
    const actualSha = crypto.createHash('sha256').update(raw).digest('hex');
    if (manifest.tables[col] && manifest.tables[col].sha256 !== actualSha) {
      throw new Error(`Checksum mismatch on backup table ${col}.json!`);
    }
    tables[col] = JSON.parse(raw) as Record<string, unknown>[];
  }

  const usersPath = path.join(backupDir, 'auth', 'users.json');
  const usersRaw = fs.readFileSync(usersPath, 'utf8');
  const usersSha = crypto.createHash('sha256').update(usersRaw).digest('hex');
  if (manifest.auth.sha256 !== usersSha) {
    throw new Error('Checksum mismatch on auth/users.json!');
  }
  const users = JSON.parse(usersRaw) as Record<string, unknown>[];

  const storageRoot = path.join(backupDir, 'storage', 'clinic-images');
  for (const fileEntry of manifest.storage.files) {
    const localFile = path.join(storageRoot, fileEntry.path);
    if (!fs.existsSync(localFile)) {
      throw new Error(`Missing backup media file: ${localFile}`);
    }
    const actualSha = crypto.createHash('sha256').update(fs.readFileSync(localFile)).digest('hex');
    if (actualSha !== fileEntry.sha256) {
      throw new Error(`SHA-256 mismatch on backup media file ${fileEntry.path}`);
    }
  }

  return { manifest, tables, users, storageRoot };
}

interface MediaPlanItem {
  path: string;
  assetId: string;
  contentType: string;
  size: number;
  sha256: string;
  base64: string;
  dataUrl: string;
  storeInline: boolean;
  totalChunks: number;
}

export function buildMediaMigrationPlan(
  manifest: BackupManifest,
  tables: Record<MigratedCollection, Record<string, unknown>[]>,
  storageRoot: string
): {
  planByPath: Map<string, MediaPlanItem>;
  mediaValueMap: Record<string, string>;
} {
  // Discover which collections reference each backed-up media file
  const referencingCollections = new Map<string, Set<MigratedCollection>>();
  for (const col of COLLECTION_ORDER) {
    for (const row of tables[col]) {
      for (const candidate of [
        row.image,
        row.media_url,
        row.image_url,
        row.cover_image,
        row.before_media_url,
        row.before_image,
        row.after_media_url,
        row.after_image,
      ]) {
        const sp = extractSupabaseStoragePath(candidate);
        if (sp) {
          if (!referencingCollections.has(sp)) referencingCollections.set(sp, new Set());
          referencingCollections.get(sp)!.add(col);
        }
      }
    }
  }

  const planByPath = new Map<string, MediaPlanItem>();
  const mediaValueMap: Record<string, string> = {};

  for (const fileEntry of manifest.storage.files) {
    const localFile = path.join(storageRoot, fileEntry.path);
    const buf = fs.readFileSync(localFile);
    const base64 = buf.toString('base64');
    const dataUrl = `data:${fileEntry.contentType};base64,${base64}`;
    const assetId = toMediaAssetId(fileEntry.path);

    const refs = referencingCollections.get(fileEntry.path);
    const isReferenced = Boolean(refs && refs.size > 0);
    const inlineLimit = refs?.has('prepost')
      ? PREPOST_INLINE_DATA_URL_LIMIT_CHARS
      : INLINE_DATA_URL_LIMIT_CHARS;

    // Inline directly inside the parent document if referenced and safely within Firestore's 1 MiB cap;
    // otherwise store losslessly as chunks inside Firestore `media_assets/{assetId}/chunks/*`.
    const storeInline = isReferenced && dataUrl.length <= inlineLimit;
    const chunks = storeInline ? [] : splitStringIntoChunks(base64, FIRESTORE_CHUNK_SIZE_CHARS);

    planByPath.set(fileEntry.path, {
      path: fileEntry.path,
      assetId,
      contentType: fileEntry.contentType,
      size: fileEntry.size,
      sha256: fileEntry.sha256,
      base64,
      dataUrl,
      storeInline,
      totalChunks: chunks.length,
    });

    mediaValueMap[fileEntry.path] = storeInline
      ? dataUrl
      : `${FIRESTORE_MEDIA_PREFIX}${assetId}`;
  }

  return { planByPath, mediaValueMap };
}

async function main() {
  const opts = parseArgs();

  if (opts.emulator) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
  }

  console.log('=== Supabase -> Cloud Firestore Migration (Firestore-Only Media Strings) ===');
  console.log(
    `Mode: ${
      opts.validateOnly
        ? 'VALIDATE-ONLY'
        : opts.dryRun
        ? 'DRY-RUN'
        : opts.emulator
        ? 'EMULATOR'
        : 'LIVE-IMPORT'
    }`
  );

  const { manifest, tables, users, storageRoot } = loadBackupData(opts.backupDir);
  const { planByPath, mediaValueMap } = buildMediaMigrationPlan(manifest, tables, storageRoot);

  const inlineMediaItems = Array.from(planByPath.values()).filter((m) => m.storeInline);
  const chunkedMediaItems = Array.from(planByPath.values()).filter((m) => !m.storeInline);
  const totalChunkDocs = chunkedMediaItems.reduce((acc, m) => acc + m.totalChunks, 0);
  const totalEntityRows = COLLECTION_ORDER.reduce((acc, col) => acc + tables[col].length, 0);
  const totalFirestoreWrites = totalEntityRows + chunkedMediaItems.length + totalChunkDocs;
  const totalBase64MB =
    Array.from(planByPath.values()).reduce((acc, m) => acc + m.base64.length, 0) / (1024 * 1024);

  console.log('\n--- Source Snapshot & Resource Estimate (Spark Free Tier Compatible) ---');
  console.log(`  Source snapshot timestamp : ${manifest.createdAt}`);
  console.log(`  Inline string media files : ${inlineMediaItems.length} file(s) embedded directly in entity docs`);
  console.log(`  Chunked Firestore assets  : ${chunkedMediaItems.length} asset(s) across ${totalChunkDocs} chunk doc(s)`);
  console.log(`  Total Firestore writes    : ~${totalFirestoreWrites} doc writes (Spark free tier: 20,000/day)`);
  console.log(`  Estimated Firestore size  : ~${totalBase64MB.toFixed(2)} MB (Spark free tier: 1,024 MB)`);
  console.log(`  Total Auth imports        : ${users.length} user(s)`);
  console.log(`  Firebase Storage required : 0 bytes (DISABLED — 100% Cloud Firestore)`);

  // Transform & validate all entity documents
  const validationErrors: string[] = [];
  for (const col of COLLECTION_ORDER) {
    for (const row of tables[col]) {
      const transformed = transformSupabaseRow(col, row, mediaValueMap);
      const errs = validateTransformedDoc(col, transformed);
      if (errs.length > 0) {
        validationErrors.push(`${col}/${row.id}: ${errs.join('; ')}`);
      }
    }
  }

  if (validationErrors.length > 0) {
    console.error('\nValidation failed:');
    validationErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(
    `  Preflight validation      : PASSED (${totalEntityRows} entity docs, ${planByPath.size} media files converted to strings)`
  );

  if (opts.validateOnly || opts.dryRun) {
    console.log('\nDry-run / validation completed without writing to Firebase.');
    return;
  }

  const { auth, db, projectId, isEmulator } = initializeFirebaseAdmin();
  console.log(
    `\nConnected via Firebase Admin SDK -> project="${projectId}", emulator=${isEmulator}`
  );

  const checkpointFile = isEmulator
    ? path.resolve(process.cwd(), 'migration-archive', 'migration-checkpoint.emulator.json')
    : path.resolve(process.cwd(), 'migration-archive', 'migration-checkpoint.json');

  let checkpoint: CheckpointState = {
    updatedAt: new Date().toISOString(),
    projectId,
    isEmulator,
    mediaAssetsWritten: {},
    authImported: [],
    firestoreWritten: {},
  };

  if (opts.resume && fs.existsSync(checkpointFile)) {
    checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf8')) as CheckpointState;
    console.log(`Resuming from checkpoint (${checkpoint.updatedAt})`);
  }

  const saveCheckpoint = () => {
    checkpoint.updatedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(checkpointFile), { recursive: true });
    fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2), 'utf8');
  };

  // -------------------------------------------------------------------------
  // STEP 1: Write Chunked Media Assets into Cloud Firestore (`media_assets`)
  // -------------------------------------------------------------------------
  console.log(
    `\n[1/3] Saving ${chunkedMediaItems.length} large/archived media asset(s) as Firestore Base64 string chunks...`
  );
  let mediaWritten = 0;
  let mediaSkipped = 0;

  for (const item of chunkedMediaItems) {
    const cached = checkpoint.mediaAssetsWritten[item.assetId];
    if (
      !opts.overwrite &&
      cached &&
      cached.sha256 === item.sha256 &&
      cached.totalChunks === item.totalChunks
    ) {
      const existingAsset = await db.collection('media_assets').doc(item.assetId).get();
      if (existingAsset.exists) {
        mediaSkipped++;
        continue;
      }
    }

    if (!opts.overwrite) {
      const existingAsset = await db.collection('media_assets').doc(item.assetId).get();
      if (
        existingAsset.exists &&
        existingAsset.data()?.sha256 === item.sha256 &&
        existingAsset.data()?.totalChunks === item.totalChunks
      ) {
        checkpoint.mediaAssetsWritten[item.assetId] = {
          sha256: item.sha256,
          totalChunks: item.totalChunks,
        };
        mediaSkipped++;
        continue;
      }
    }

    const now = Timestamp.now();
    const assetRef = db.collection('media_assets').doc(item.assetId);
    const chunks = splitStringIntoChunks(item.base64, FIRESTORE_CHUNK_SIZE_CHARS);

    await withRetry(`media_asset:meta:${item.assetId}`, () =>
      assetRef.set(
        {
          id: item.assetId,
          sourcePath: item.path,
          contentType: item.contentType,
          encoding: 'base64',
          totalChunks: chunks.length,
          totalBytes: item.size,
          sha256: item.sha256,
          isPublic: true,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      )
    );

    // Keep each batch safely below gRPC 4 MiB & Firestore 10 MiB request limits (3 * 700KB = ~2.1MB)
    const CHUNKS_PER_BATCH = 3;
    for (let i = 0; i < chunks.length; i += CHUNKS_PER_BATCH) {
      const batch = db.batch();
      const slice = chunks.slice(i, i + CHUNKS_PER_BATCH);
      slice.forEach((chunkStr, offset) => {
        const index = i + offset;
        const chunkId = String(index).padStart(4, '0');
        batch.set(assetRef.collection('chunks').doc(chunkId), {
          index,
          data: chunkStr,
        });
      });
      await withRetry(`media_asset:chunks:${item.assetId}:${i}`, () => batch.commit());
    }

    checkpoint.mediaAssetsWritten[item.assetId] = {
      sha256: item.sha256,
      totalChunks: chunks.length,
    };
    mediaWritten++;
    saveCheckpoint();
  }

  console.log(
    `  Firestore media assets complete: inline=${inlineMediaItems.length}, chunked_written=${mediaWritten}, chunked_skipped=${mediaSkipped}`
  );

  // -------------------------------------------------------------------------
  // STEP 2: Migrate Firebase Authentication users
  // -------------------------------------------------------------------------
  console.log(`\n[2/3] Migrating ${users.length} Auth user(s)...`);
  const profileAdminIds = new Set(
    tables.profiles.filter((p) => Boolean(p.is_admin)).map((p) => String(p.id))
  );

  let authMigrated = 0;
  let authSkippedOrUpdated = 0;
  let authFailed = 0;
  let passwordHashesMigrated = 0;

  for (const u of users) {
    const uid = String(u.id);
    const email = typeof u.email === 'string' ? u.email : undefined;
    const emailVerified = Boolean(u.email_confirmed_at);
    const disabled = Boolean(u.banned_until);
    const encryptedPassword =
      typeof u.encrypted_password === 'string' && u.encrypted_password.startsWith('$2')
        ? u.encrypted_password
        : undefined;
    const isAdmin =
      Boolean((u.app_metadata as Record<string, unknown> | undefined)?.is_admin) ||
      profileAdminIds.has(uid);

    try {
      let existingUser = null;
      try {
        existingUser = await withRetry(`auth:get:${uid}`, () => auth.getUser(uid));
      } catch (lookupErr: any) {
        if (lookupErr?.code !== 'auth/user-not-found') {
          throw lookupErr;
        }
      }

      if (existingUser) {
        if (
          opts.overwrite ||
          existingUser.email !== email ||
          existingUser.emailVerified !== emailVerified ||
          existingUser.disabled !== disabled
        ) {
          await withRetry(`auth:update:${uid}`, () =>
            auth.updateUser(uid, { email, emailVerified, disabled })
          );
        }
        authSkippedOrUpdated++;
      } else {
        const importRecord: any = { uid, email, emailVerified, disabled };
        if (encryptedPassword) {
          importRecord.passwordHash = Buffer.from(encryptedPassword, 'utf8');
          passwordHashesMigrated++;
        }

        const importOptions = encryptedPassword
          ? { hash: { algorithm: 'BCRYPT' as const } }
          : undefined;

        const result = await withRetry(`auth:import:${uid}`, () =>
          auth.importUsers([importRecord], importOptions)
        );
        if (result.failureCount > 0) {
          throw new Error(result.errors.map((e) => e.error.message).join('; '));
        }
        authMigrated++;
      }

      if (isAdmin) {
        await withRetry(`auth:claims:${uid}`, () =>
          auth.setCustomUserClaims(uid, { is_admin: true })
        );
      }

      if (!checkpoint.authImported.includes(uid)) {
        checkpoint.authImported.push(uid);
      }
      saveCheckpoint();
    } catch (err) {
      authFailed++;
      console.error(
        `  Auth migration failed for uid=${uid}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }
  console.log(
    `  Auth complete: imported=${authMigrated}, existing_updated=${authSkippedOrUpdated}, passwordHashesImported=${passwordHashesMigrated}, failed=${authFailed}`
  );
  if (passwordHashesMigrated < users.length) {
    console.log(
      '  Note: Supabase REST Admin API does not export bcrypt password hashes; migrated users should use Firebase Password Reset ("Forgot or migrating password? Send reset email") on first login.'
    );
  }
  if (authFailed > 0) process.exit(1);

  // -------------------------------------------------------------------------
  // STEP 3: Migrate all 9 Cloud Firestore entity collections via BulkWriter
  // -------------------------------------------------------------------------
  console.log(
    `\n[3/3] Migrating ${totalEntityRows} Firestore document(s) across ${COLLECTION_ORDER.length} collections...`
  );
  const bulkWriter = db.bulkWriter();
  const failedDocs: Array<{ collection: string; id: string; error: string }> = [];

  bulkWriter.onWriteError((error) => {
    if (error.failedAttempts < 4) return true;
    failedDocs.push({
      collection: error.documentRef.parent.id,
      id: error.documentRef.id,
      error: error.message,
    });
    return false;
  });

  const summary: Record<string, { source: number; written: number; skipped: number }> = {};

  for (const col of COLLECTION_ORDER) {
    const rows = tables[col];
    checkpoint.firestoreWritten[col] ||= {};
    let written = 0;
    let skipped = 0;

    for (const row of rows) {
      const transformed = transformSupabaseRow(col, row, mediaValueMap);
      const docId = String(transformed.id);
      const checksum = computeDocumentChecksum(transformed);

      if (!opts.overwrite && checkpoint.firestoreWritten[col][docId] === checksum) {
        const snap = await db.collection(col).doc(docId).get();
        if (snap.exists) {
          skipped++;
          continue;
        }
      }

      bulkWriter
        .set(db.collection(col).doc(docId), transformed, { merge: true })
        .then(() => {
          checkpoint.firestoreWritten[col][docId] = checksum;
        })
        .catch(() => {});
      written++;
    }

    summary[col] = { source: rows.length, written, skipped };
  }

  await bulkWriter.close();
  saveCheckpoint();

  console.log('\n--- Firestore Import Summary ---');
  for (const col of COLLECTION_ORDER) {
    const s = summary[col];
    console.log(`  - ${col}: source=${s.source}, written=${s.written}, skipped=${s.skipped}`);
  }

  if (failedDocs.length > 0) {
    console.error('\nFailed Firestore records:', failedDocs);
    process.exit(1);
  }

  console.log('\nMigration finished cleanly (100% Cloud Firestore — zero Firebase Storage required)!');
}

main().catch((err) => {
  console.error('\nMigration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
