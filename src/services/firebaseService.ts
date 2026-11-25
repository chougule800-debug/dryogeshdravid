import {
  User,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  DocumentData,
  DocumentSnapshot,
  QueryConstraint,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy as firestoreOrderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  FIRESTORE_CHUNK_SIZE_CHARS,
  FIRESTORE_MEDIA_PREFIX,
  INLINE_DATA_URL_LIMIT_CHARS,
  MAX_FIRESTORE_DOC_SAFE_BYTES,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  PREPOST_INLINE_DATA_URL_LIMIT_CHARS,
  base64ToBytes,
  bytesToBase64,
  estimatePayloadBytes,
  extractFirestoreMediaId,
  fromFirestoreDoc,
  isFirestoreMediaPointer,
  parseDataUrl,
  splitStringIntoChunks,
  toFirestorePayload,
  validateMediaFile,
} from './firestoreTransforms';

export {
  FIRESTORE_MEDIA_PREFIX,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  fromFirestoreDoc,
  isFirestoreMediaPointer,
  toFirestorePayload,
  validateMediaFile,
};

export enum FirebaseOp {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  AUTH = 'auth',
  MEDIA = 'media',
}

export type Unsubscribe = () => void;

export interface CollectionOrderBy {
  field?: string;
  /** Legacy alias kept only for backward compatibility with older call sites. */
  column?: string;
  ascending?: boolean;
}

export interface CollectionQueryOptions {
  orderBy?: CollectionOrderBy;
  limitCount?: number;
}

export interface PaginatedPage<T> {
  items: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export const DEFAULT_COLLECTION_LIMIT = 100;

export function handleFirebaseError(
  error: unknown,
  operationType: FirebaseOp,
  path: string | null
) {
  if (error && typeof error === 'object' && 'message' in error) {
    const err = error as { message?: string; code?: string };
    console.error(
      `Firebase [${operationType}] at "${path}":`,
      err.message,
      err.code ? `\nCode: ${err.code}` : ''
    );
  } else {
    console.warn(`Firebase [${operationType}] at "${path}":`, error);
  }
}

function resolveOrderField(orderBy?: CollectionOrderBy): {
  field: string;
  direction: 'asc' | 'desc';
} | null {
  if (!orderBy) return null;
  const rawField = orderBy.field || orderBy.column;
  if (!rawField) return null;
  const field =
    rawField === 'created_at'
      ? 'createdAt'
      : rawField === 'updated_at'
      ? 'updatedAt'
      : rawField;
  return {
    field,
    direction: orderBy.ascending ? 'asc' : 'desc',
  };
}

function buildCollectionQuery(
  collectionName: string,
  options?: CollectionQueryOptions
) {
  const constraints: QueryConstraint[] = [];
  const order = resolveOrderField(options?.orderBy);
  if (order) {
    constraints.push(firestoreOrderBy(order.field, order.direction));
  }
  const limitCount = options?.limitCount ?? DEFAULT_COLLECTION_LIMIT;
  if (limitCount > 0) {
    constraints.push(limit(limitCount));
  }
  return query(collection(db, collectionName), ...constraints);
}

// ---------------------------------------------------------------------------
// COLLECTION READS (Deduplicated & Cursor-Paginated)
// ---------------------------------------------------------------------------

const inFlightCollectionFetches = new Map<string, Promise<unknown[]>>();

export async function fetchFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  options?: CollectionQueryOptions
): Promise<T[]> {
  const order = resolveOrderField(options?.orderBy);
  const cacheKey = `${collectionName}:${order?.field ?? 'none'}:${order?.direction ?? 'desc'}:${options?.limitCount ?? DEFAULT_COLLECTION_LIMIT}`;

  const existing = inFlightCollectionFetches.get(cacheKey);
  if (existing) {
    return existing as Promise<T[]>;
  }

  const promise = (async () => {
    try {
      const q = buildCollectionQuery(collectionName, options);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) =>
        fromFirestoreDoc<T>(collectionName, d.id, d.data())
      );
    } catch (error) {
      handleFirebaseError(error, FirebaseOp.LIST, collectionName);
      return [];
    } finally {
      inFlightCollectionFetches.delete(cacheKey);
    }
  })();

  inFlightCollectionFetches.set(cacheKey, promise);
  return promise;
}

/** Cursor-based pagination helper for scalable bounded reads. */
export async function fetchFirestorePage<T extends { id: string }>(
  collectionName: string,
  options: {
    orderBy?: CollectionOrderBy;
    pageSize?: number;
    cursorDoc?: DocumentSnapshot<DocumentData> | null;
  } = {}
): Promise<PaginatedPage<T>> {
  const pageSize = options.pageSize ?? 20;
  const constraints: QueryConstraint[] = [];
  const order = resolveOrderField(options.orderBy) ?? {
    field: 'createdAt',
    direction: 'desc' as const,
  };

  constraints.push(firestoreOrderBy(order.field, order.direction));
  if (options.cursorDoc) {
    constraints.push(startAfter(options.cursorDoc));
  }
  constraints.push(limit(pageSize + 1));

  const snapshot = await getDocs(query(collection(db, collectionName), ...constraints));
  const hasMore = snapshot.docs.length > pageSize;
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
  const items = pageDocs.map((d) =>
    fromFirestoreDoc<T>(collectionName, d.id, d.data())
  );

  return {
    items,
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  };
}

export function subscribeFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  onData: (data: T[]) => void,
  onError?: (message: string) => void,
  options?: CollectionQueryOptions | CollectionOrderBy
): Unsubscribe {
  const normalizedOptions: CollectionQueryOptions =
    options && ('orderBy' in options || 'limitCount' in options)
      ? (options as CollectionQueryOptions)
      : { orderBy: options as CollectionOrderBy | undefined };

  const q = buildCollectionQuery(collectionName, normalizedOptions);

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        fromFirestoreDoc<T>(collectionName, d.id, d.data())
      );
      onData(items);
    },
    (error) => {
      handleFirebaseError(error, FirebaseOp.LIST, collectionName);
      onError?.(error.message || `Failed to load ${collectionName}`);
    }
  );
}

// ---------------------------------------------------------------------------
// FIRESTORE-ONLY MEDIA STRING STORAGE & RESOLUTION (No Firebase Storage)
// ---------------------------------------------------------------------------

const MEDIA_CACHE_NAME = 'drdravid-firestore-media-v1';
const inMemoryMediaUrlCache = new Map<string, string>();
const inFlightMediaResolutions = new Map<string, Promise<string>>();

async function saveChunkedBase64ToFirestore(
  base64Data: string,
  contentType: string,
  folder: string,
  originalName: string,
  totalBytes: number
): Promise<string> {
  const assetId = `${folder}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const chunks = splitStringIntoChunks(base64Data, FIRESTORE_CHUNK_SIZE_CHARS);

  const assetRef = doc(db, 'media_assets', assetId);
  const metadataBatch = writeBatch(db);
  metadataBatch.set(assetRef, {
    id: assetId,
    folder,
    originalName,
    contentType,
    encoding: 'base64',
    totalChunks: chunks.length,
    totalBytes,
    isPublic: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await metadataBatch.commit();

  // Write chunks in batches safely under gRPC 4 MiB & Firestore 10 MiB limits (3 * 700KB = ~2.1MB)
  const OPS_PER_BATCH = 3;
  for (let i = 0; i < chunks.length; i += OPS_PER_BATCH) {
    const batch = writeBatch(db);
    const slice = chunks.slice(i, i + OPS_PER_BATCH);
    slice.forEach((chunkStr, offset) => {
      const index = i + offset;
      const chunkId = String(index).padStart(4, '0');
      batch.set(doc(db, 'media_assets', assetId, 'chunks', chunkId), {
        index,
        data: chunkStr,
      });
    });
    await batch.commit();
  }

  // Warm local object URL cache so admin preview renders immediately with zero extra reads
  if (typeof URL !== 'undefined' && typeof Blob !== 'undefined') {
    const bytes = base64ToBytes(base64Data);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: contentType });
    const objectUrl = URL.createObjectURL(blob);
    inMemoryMediaUrlCache.set(assetId, objectUrl);
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(MEDIA_CACHE_NAME);
        await cache.put(
          `https://firestore-media.local/${encodeURIComponent(assetId)}`,
          new Response(blob, { headers: { 'Content-Type': contentType } })
        );
      } catch {
        // Ignore storage quota errors in private/restricted browsers
      }
    }
  }

  return `${FIRESTORE_MEDIA_PREFIX}${assetId}`;
}

/**
 * Convert a File into a string stored exclusively in Cloud Firestore:
 *  - Fits inline when the Data URL fits comfortably inside the target document (< 700KB, or < 340KB per prepost side)
 *  - Automatically chunks into Firestore `media_assets/{assetId}/chunks/{index}` when larger (large photos/videos),
 *    returning a `firestore-media://{assetId}` reference string.
 */
export async function uploadMediaToFirestore(
  file: File,
  folder: 'gallery' | 'blog' | 'doctors' | 'prepost' | 'cases' = 'gallery',
  _subfolder?: 'images' | 'videos'
): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const base64 = bytesToBase64(bytes);
    const contentType = file.type || 'application/octet-stream';
    const dataUrl = `data:${contentType};base64,${base64}`;

    const inlineLimit =
      folder === 'prepost'
        ? PREPOST_INLINE_DATA_URL_LIMIT_CHARS
        : INLINE_DATA_URL_LIMIT_CHARS;

    if (dataUrl.length <= inlineLimit) {
      return dataUrl;
    }

    return await saveChunkedBase64ToFirestore(
      base64,
      contentType,
      folder,
      file.name,
      bytes.byteLength
    );
  } catch (error) {
    handleFirebaseError(error, FirebaseOp.MEDIA, folder);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to save media to Cloud Firestore'
    );
  }
}

/** Backwards-compatible alias pointing to Firestore-only media persistence. */
export const uploadFileToStorage = uploadMediaToFirestore;

/** Synchronous cache lookup for `firestore-media://` URLs (returns raw URL for inline/HTTP paths). */
export function getCachedMediaUrlSync(url: string | undefined | null): string {
  if (!url) return '';
  if (!isFirestoreMediaPointer(url)) return url;
  const assetId = extractFirestoreMediaId(url);
  return inMemoryMediaUrlCache.get(assetId) || '';
}

/**
 * Resolve a media URL string for browser rendering (`<img>` / `<video>`).
 * Passes through inline `data:` Data URLs, `http(s):` URLs, and `/images/...` paths directly;
 * reassembles `firestore-media://{assetId}` strings from Firestore chunks and caches them as Blob URLs.
 */
export async function resolveFirestoreMediaUrl(url: string): Promise<string> {
  if (!url || !isFirestoreMediaPointer(url)) return url;

  const assetId = extractFirestoreMediaId(url);
  const memCached = inMemoryMediaUrlCache.get(assetId);
  if (memCached) return memCached;

  const inFlight = inFlightMediaResolutions.get(assetId);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const cacheKeyUrl = `https://firestore-media.local/${encodeURIComponent(assetId)}`;

      // Check persistent Browser Cache API first (zero Firestore reads on repeat visits)
      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(MEDIA_CACHE_NAME);
          const cachedResp = await cache.match(cacheKeyUrl);
          if (cachedResp) {
            const blob = await cachedResp.blob();
            const objUrl = URL.createObjectURL(blob);
            inMemoryMediaUrlCache.set(assetId, objUrl);
            return objUrl;
          }
        } catch {
          // Proceed to Firestore read if Cache API is unavailable
        }
      }

      const assetSnap = await getDoc(doc(db, 'media_assets', assetId));
      if (!assetSnap.exists()) {
        throw new Error(`Media asset "${assetId}" not found in Firestore.`);
      }
      const meta = assetSnap.data();
      const contentType = String(meta.contentType || 'application/octet-stream');

      const chunksSnap = await getDocs(
        query(
          collection(db, 'media_assets', assetId, 'chunks'),
          firestoreOrderBy('index', 'asc')
        )
      );

      let combined = chunksSnap.docs.map((d) => String(d.data().data || '')).join('');
      const parsedDataUrl = parseDataUrl(combined);
      if (parsedDataUrl) {
        combined = parsedDataUrl.base64;
      }

      const bytes = base64ToBytes(combined);
      if (typeof URL !== 'undefined' && typeof Blob !== 'undefined') {
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: contentType });
        const objUrl = URL.createObjectURL(blob);
        inMemoryMediaUrlCache.set(assetId, objUrl);

        if (typeof caches !== 'undefined') {
          try {
            const cache = await caches.open(MEDIA_CACHE_NAME);
            await cache.put(
              cacheKeyUrl,
              new Response(blob, { headers: { 'Content-Type': contentType } })
            );
          } catch {
            // Ignore cache storage quota failures
          }
        }
        return objUrl;
      }

      const fallbackDataUrl = `data:${contentType};base64,${combined}`;
      inMemoryMediaUrlCache.set(assetId, fallbackDataUrl);
      return fallbackDataUrl;
    } finally {
      inFlightMediaResolutions.delete(assetId);
    }
  })();

  inFlightMediaResolutions.set(assetId, promise);
  return promise;
}

/**
 * Safety net: if a document payload exceeds Firestore's 1 MiB limit because of large inline
 * `data:` strings (e.g., two large images in a `prepost` doc or pasted Data URLs),
 * automatically offload oversized `data:` strings to `media_assets` chunks.
 */
async function offloadOversizedDataUrlsIfNeeded(
  collectionName: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (estimatePayloadBytes(payload) <= MAX_FIRESTORE_DOC_SAFE_BYTES) {
    return payload;
  }

  const next = { ...payload };
  const candidateFields = ['image', 'mediaUrl', 'beforeMediaUrl', 'afterMediaUrl'];
  for (const field of candidateFields) {
    const val = next[field];
    if (typeof val === 'string' && val.startsWith('data:') && val.length > 300_000) {
      const parsed = parseDataUrl(val);
      if (parsed) {
        const bytes = base64ToBytes(parsed.base64);
        next[field] = await saveChunkedBase64ToFirestore(
          parsed.base64,
          parsed.contentType,
          collectionName,
          `${String(next.id || 'item')}_${field}`,
          bytes.byteLength
        );
      }
      if (estimatePayloadBytes(next) <= MAX_FIRESTORE_DOC_SAFE_BYTES) break;
    }
  }
  return next;
}

// ---------------------------------------------------------------------------
// WRITE OPERATIONS (Transactional Timestamp Preservation & Batched Restore)
// ---------------------------------------------------------------------------

export async function saveDocumentToFirestore<T extends { id: string }>(
  collectionName: string,
  data: T
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, data.id);
    const rawPayload = toFirestorePayload(collectionName, data);
    const payload = await offloadOversizedDataUrlsIfNeeded(collectionName, rawPayload);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      const existingCreatedAt = snap.exists() ? snap.data()?.createdAt : undefined;
      tx.set(
        docRef,
        {
          ...payload,
          createdAt: existingCreatedAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    return true;
  } catch (error) {
    handleFirebaseError(error, FirebaseOp.WRITE, `${collectionName}/${data.id}`);
    return false;
  }
}

export async function deleteDocumentFromFirestore(
  collectionName: string,
  id: string
): Promise<boolean> {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    handleFirebaseError(error, FirebaseOp.DELETE, `${collectionName}/${id}`);
    return false;
  }
}

export interface RestorePayload {
  doctors?: Array<{ id: string } & Record<string, unknown>>;
  prePostCases?: Array<{ id: string } & Record<string, unknown>>;
  galleryItems?: Array<{ id: string } & Record<string, unknown>>;
  blogPosts?: Array<{ id: string } & Record<string, unknown>>;
  clinics?: Array<{ id: string } & Record<string, unknown>>;
  services?: Array<{ id: string } & Record<string, unknown>>;
  testimonials?: Array<{ id: string } & Record<string, unknown>>;
}

/** Restore multiple collections atomically via Firestore batched writes (500-op chunks). */
export async function restoreClinicDataToFirestore(data: RestorePayload): Promise<void> {
  const entries: Array<{ col: string; item: { id: string } & Record<string, unknown> }> = [];
  if (Array.isArray(data.doctors)) data.doctors.forEach((item) => entries.push({ col: 'doctors', item }));
  if (Array.isArray(data.prePostCases)) data.prePostCases.forEach((item) => entries.push({ col: 'prepost', item }));
  if (Array.isArray(data.galleryItems)) data.galleryItems.forEach((item) => entries.push({ col: 'gallery', item }));
  if (Array.isArray(data.blogPosts)) data.blogPosts.forEach((item) => entries.push({ col: 'blog', item }));
  if (Array.isArray(data.clinics)) data.clinics.forEach((item) => entries.push({ col: 'clinics', item }));
  if (Array.isArray(data.services)) data.services.forEach((item) => entries.push({ col: 'services', item }));
  if (Array.isArray(data.testimonials)) data.testimonials.forEach((item) => entries.push({ col: 'testimonials', item }));

  if (entries.length === 0) return;

  const CHUNK_SIZE = 450;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const { col, item } of chunk) {
      if (!item?.id) continue;
      const docRef = doc(db, col, String(item.id));
      const payload = await offloadOversizedDataUrlsIfNeeded(
        col,
        toFirestorePayload(col, item)
      );
      const existingSnap = await getDoc(docRef);
      const createdAt =
        existingSnap.exists() && existingSnap.data()?.createdAt
          ? existingSnap.data()!.createdAt
          : typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt))
          ? Timestamp.fromDate(new Date(item.createdAt))
          : serverTimestamp();

      batch.set(
        docRef,
        {
          ...payload,
          createdAt,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
  }
}

// ---------------------------------------------------------------------------
// FIREBASE AUTHENTICATION & ADMIN AUTHORIZATION
// ---------------------------------------------------------------------------

/** Verify whether the authenticated Firebase user holds administrator privileges. */
export async function checkUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  try {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims?.is_admin === true) {
      return true;
    }
    const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
    return profileSnap.exists() && profileSnap.data()?.isAdmin === true;
  } catch (error) {
    handleFirebaseError(error, FirebaseOp.AUTH, `profiles/${user.uid}`);
    return false;
  }
}

export async function signInAdmin(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  await credential.user.getIdTokenResult(true);
  const isAdmin = await checkUserIsAdmin(credential.user);
  if (!isAdmin) {
    await signOut(auth);
    throw new Error('You are not authorized as an administrator.');
  }
  return credential.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export async function sendAdminPasswordReset(email: string): Promise<void> {
  if (!email.trim()) {
    throw new Error('Please enter your administrator email address first.');
  }
  await sendPasswordResetEmail(auth, email.trim());
}

export function subscribeAdminAuth(
  onChange: (state: { user: User | null; isAdmin: boolean }) => void
): Unsubscribe {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onChange({ user: null, isAdmin: false });
      return;
    }
    const isAdmin = await checkUserIsAdmin(user);
    if (!isAdmin) {
      await signOut(auth).catch(() => {});
      onChange({ user: null, isAdmin: false });
      return;
    }
    onChange({ user, isAdmin: true });
  });
}
