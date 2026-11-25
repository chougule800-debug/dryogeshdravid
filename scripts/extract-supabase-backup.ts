/**
 * Standalone read-only Supabase extractor (uses native Node fetch; zero @supabase/supabase-js dependency).
 * Useful for creating or refreshing a verified incremental snapshot before final Firebase cutover.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/extract-supabase-backup.ts
 */
import 'dotenv/config';
import * as crypto from 'crypto';
import * as dns from 'dns';
import * as fs from 'fs';
import * as path from 'path';

dns.setDefaultResultOrder('ipv4first');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BACKUP_DIR = path.resolve(process.cwd(), 'migration-archive', 'supabase-backup');
const TABLES_DIR = path.join(BACKUP_DIR, 'tables');
const AUTH_DIR = path.join(BACKUP_DIR, 'auth');
const SCHEMA_DIR = path.join(BACKUP_DIR, 'schema');
const STORAGE_DIR = path.join(BACKUP_DIR, 'storage', 'clinic-images');

const TABLES = [
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

function sha256(buf: Buffer | string): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(label: string, fn: () => Promise<T>, maxAttempts = 5): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.warn(
        `  [retry ${attempt}/${maxAttempts}] ${label}: ${
          err instanceof Error ? err.message : String(err)
        } (waiting ${delay}ms)`
      );
      await sleep(delay);
    }
  }
  throw new Error(
    `${label} failed after ${maxAttempts} attempts: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`
  );
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

async function fetchAllTableRows(table: string): Promise<Record<string, unknown>[]> {
  return withRetry(`table:${table}`, async () => {
    const pageSize = 1000;
    let offset = 0;
    const rows: Record<string, unknown>[] = [];
    while (true) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}?select=*`,
        {
          headers: authHeaders({
            Range: `${offset}-${offset + pageSize - 1}`,
            Prefer: 'count=exact',
          }),
        }
      );
      if (!res.ok) {
        throw new Error(`REST ${table} returned HTTP ${res.status}`);
      }
      const batch = (await res.json()) as Record<string, unknown>[];
      rows.push(...batch);
      if (batch.length < pageSize) break;
      offset += pageSize;
    }
    return rows;
  });
}

async function fetchAllAuthUsers(): Promise<Record<string, unknown>[]> {
  const users: Record<string, unknown>[] = [];
  let page = 1;
  while (true) {
    const batch = await withRetry(`auth:page:${page}`, async () => {
      const res = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=100`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error(`Auth Admin returned HTTP ${res.status}`);
      const json = (await res.json()) as { users?: Record<string, unknown>[] };
      return json.users || [];
    });
    users.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return users;
}

interface StorageListItem {
  name: string;
  id: string | null;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
  metadata?: { size?: number; mimetype?: string };
}

async function listBucketRecursive(bucket: string, prefix = ''): Promise<Array<{
  path: string;
  id: string | null;
  name: string;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
  metadata: { size?: number; mimetype?: string };
}>> {
  const items = await withRetry(`list:${bucket}/${prefix}`, async () => {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
    });
    if (!res.ok) throw new Error(`Storage list returned HTTP ${res.status}`);
    return (await res.json()) as StorageListItem[];
  });

  const out: Array<{
    path: string;
    id: string | null;
    name: string;
    created_at?: string;
    updated_at?: string;
    last_accessed_at?: string;
    metadata: { size?: number; mimetype?: string };
  }> = [];

  for (const item of items) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      const nested = await listBucketRecursive(bucket, fullPath);
      out.push(...nested);
    } else {
      out.push({
        path: fullPath,
        id: item.id,
        name: item.name,
        created_at: item.created_at,
        updated_at: item.updated_at,
        last_accessed_at: item.last_accessed_at,
        metadata: item.metadata || {},
      });
    }
  }
  return out;
}

async function downloadObjectWithRetry(
  bucket: string,
  objectPath: string,
  expectedSize: number | null,
  destFile: string
): Promise<Buffer> {
  if (fs.existsSync(destFile)) {
    const existing = fs.readFileSync(destFile);
    if (expectedSize === null || existing.length === expectedSize) {
      return existing;
    }
  }

  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  const url = `${SUPABASE_URL}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodedPath}`;

  return withRetry(`download:${objectPath}`, async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    try {
      const res = await fetch(url, {
        headers: authHeaders(),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (expectedSize !== null && buf.length !== expectedSize) {
        throw new Error(`Size mismatch: got ${buf.length}, expected ${expectedSize}`);
      }
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      const tmp = `${destFile}.tmp`;
      fs.writeFileSync(tmp, buf);
      fs.renameSync(tmp, destFile);
      return buf;
    } finally {
      clearTimeout(timeout);
    }
  });
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      'Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.\n' +
        'Pass them explicitly when extracting from Supabase (never commit them or add them to frontend .env).'
    );
    process.exit(1);
  }

  for (const dir of [BACKUP_DIR, TABLES_DIR, AUTH_DIR, SCHEMA_DIR, STORAGE_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log(`Extracting read-only Supabase backup to ${BACKUP_DIR}...`);

  const openApiText = await withRetry('openapi-schema', async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`OpenAPI schema returned HTTP ${res.status}`);
    return res.text();
  });
  fs.writeFileSync(path.join(SCHEMA_DIR, 'openapi-schema.json'), openApiText, 'utf8');

  const tableManifest: Record<string, { count: number; ids: string[]; sha256: string }> = {};
  for (const table of TABLES) {
    const rows = await fetchAllTableRows(table);
    const jsonStr = JSON.stringify(rows, null, 2);
    fs.writeFileSync(path.join(TABLES_DIR, `${table}.json`), jsonStr, 'utf8');
    tableManifest[table] = {
      count: rows.length,
      ids: rows.map((r) => String(r.id)),
      sha256: sha256(jsonStr),
    };
    console.log(`  [table] ${table}: ${rows.length} row(s)`);
  }

  const users = await fetchAllAuthUsers();
  const authJson = JSON.stringify(users, null, 2);
  fs.writeFileSync(path.join(AUTH_DIR, 'users.json'), authJson, 'utf8');
  const hasEncryptedPasswordField = users.some(
    (u) => 'encrypted_password' in u && Boolean(u.encrypted_password)
  );
  console.log(
    `  [auth] users: ${users.length}, encrypted_password_exported=${hasEncryptedPasswordField}`
  );

  const buckets = await withRetry('storage:buckets', async () => {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Bucket list returned HTTP ${res.status}`);
    return res.json();
  });
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'storage', 'buckets.json'),
    JSON.stringify(buckets, null, 2),
    'utf8'
  );

  const objects = await listBucketRecursive('clinic-images');
  const storageManifest: Array<{
    path: string;
    size: number;
    expectedSize: number | null;
    contentType: string;
    sha256: string;
  }> = [];

  const queue = [...objects];
  const workers = Array.from({ length: 2 }, async () => {
    while (queue.length > 0) {
      const obj = queue.shift()!;
      const expectedSize = typeof obj.metadata?.size === 'number' ? obj.metadata.size : null;
      const destFile = path.join(STORAGE_DIR, obj.path);
      const buf = await downloadObjectWithRetry('clinic-images', obj.path, expectedSize, destFile);
      storageManifest.push({
        path: obj.path,
        size: buf.length,
        expectedSize,
        contentType: obj.metadata?.mimetype || 'application/octet-stream',
        sha256: sha256(buf),
      });
    }
  });
  await Promise.all(workers);

  storageManifest.sort((a, b) => a.path.localeCompare(b.path));
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'storage', 'objects-metadata.json'),
    JSON.stringify({ objects, files: storageManifest }, null, 2),
    'utf8'
  );

  const totalBytes = storageManifest.reduce((acc, f) => acc + f.size, 0);
  const manifest = {
    createdAt: new Date().toISOString(),
    sourceSupabaseUrl: SUPABASE_URL,
    tables: tableManifest,
    auth: {
      userCount: users.length,
      userIds: users.map((u) => String(u.id)),
      hasEncryptedPasswordField,
      sha256: sha256(authJson),
    },
    storage: {
      bucket: 'clinic-images',
      objectCount: storageManifest.length,
      totalBytes,
      files: storageManifest,
    },
  };
  fs.writeFileSync(path.join(BACKUP_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(
    `  [storage] clinic-images: ${storageManifest.length} file(s), ${(
      totalBytes /
      (1024 * 1024)
    ).toFixed(2)} MB`
  );
  console.log('Extraction complete.');
}

main().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
