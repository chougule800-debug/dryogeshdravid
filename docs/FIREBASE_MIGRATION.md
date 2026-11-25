# Supabase to Cloud Firestore Migration Guide (Firestore-Only, Zero Firebase Storage)

This document records the target **100% Cloud Firestore + Firebase Authentication** architecture, PostgreSQL-to-Firestore schema mapping, Base64 string media persistence, security rules, migration execution workflow, usage/cost estimates, deployment steps, and rollback procedures for **Dr. Dravid's Homoeopathic Clinic**.

---

## 1. Final Firebase Architecture (Zero Storage / Zero Blaze Requirement)

| Previous Supabase Component | Firebase Replacement | Implementation File(s) |
|---|---|---|
| Supabase PostgreSQL | Firebase Cloud Firestore (with IndexedDB multi-tab persistence) | [src/lib/firebase.ts](../src/lib/firebase.ts), [src/services/firebaseService.ts](../src/services/firebaseService.ts) |
| Supabase Auth | Firebase Authentication (`browserLocalPersistence`, email/password + reset flow) | [src/services/firebaseService.ts](../src/services/firebaseService.ts), [src/components/AdminPanel.tsx](../src/components/AdminPanel.tsx) |
| Supabase Storage (`clinic-images`) | **Cloud Firestore Strings** (inline Base64 Data URLs + chunked `media_assets/{id}/chunks/*` for files > 700 KB) | [src/services/firebaseService.ts](../src/services/firebaseService.ts), [src/hooks/useResolvedMediaUrl.ts](../src/hooks/useResolvedMediaUrl.ts) |
| Supabase Realtime (`postgres_changes`) | Firestore `onSnapshot()` listeners (bounded, cleaned up on unmount) | [src/hooks/useFirestoreCollection.ts](../src/hooks/useFirestoreCollection.ts) |
| Supabase RLS + `public.is_admin()` | Firestore Security Rules (`is_admin` claim + `profiles/{uid}.isAdmin`) | [firestore.rules](../firestore.rules) |
| Supabase Service-Role Scripts | Firebase Admin SDK migration, verification, and seed scripts | [scripts/lib/firebaseAdmin.ts](../scripts/lib/firebaseAdmin.ts), [scripts/migrate-to-firebase.ts](../scripts/migrate-to-firebase.ts) |

---

## 2. Firestore Collection Architecture & PostgreSQL Schema Mapping

### Collections

```text
Firestore (project: drdravid-f4b42)
├── profiles/{uid}               # Admin / user role lookup (private: self-read, admin write)
├── doctors/{doctorId}           # Public clinic doctors & faculty profiles (inline/pointer media string)
├── clinics/{clinicId}           # Public clinic branches ('belgaum', 'goa')
├── services/{serviceId}         # Public clinical specialties & conditions treated
├── gallery/{galleryId}          # Public photo & video gallery items (inline/pointer media string)
├── blog/{postId}                # Public clinical articles & educational guides
├── prepost/{caseId}             # Public pre/post treatment comparison cases
├── testimonials/{testimonialId} # Public patient testimonials
├── media_assets/{assetId}       # Metadata for large photos/videos stored as Firestore Base64 chunks
│   └── chunks/{0000..N}         # Ordered <=700KB Base64 string slices under 1 MiB document limit
└── appointments/{appointmentId} # Historical appointment records (strictly Admin-only PII)
```

### How Photos & Videos Are Stored as Strings in Firestore

Cloud Firestore enforces a hard **1 MiB (1,048,576 byte)** limit per document. To preserve **100% lossless quality** for every photo and video without needing Firebase Cloud Storage:

1. **Inline Data URL Strings**: Media whose `data:<mime>;base64,...` string fits safely inside the document (`<= 700,000` chars for `doctors`/`gallery`/`blog`, or `<= 340,000` chars per side for `prepost`) is stored **directly inline** on the entity document field (`doctors.image`, `gallery.mediaUrl`, `blog.mediaUrl`, `prepost.beforeMediaUrl`, `prepost.afterMediaUrl`).
2. **Chunked Base64 Strings (`media_assets/{assetId}/chunks`)**: Larger photos (> ~510 KB raw) and videos (up to 50 MB) are split losslessly into `700,000`-char Base64 string slices under `media_assets/{assetId}/chunks/{0000..N}`, and the entity document holds the pointer string `firestore-media://{assetId}`.
3. **Transparent Resolution & Caching**: [`useResolvedMediaUrl`](../src/hooks/useResolvedMediaUrl.ts) and [`MediaRenderer`](../src/components/MediaRenderer.tsx) pass inline `data:` / `http(s):` strings through synchronously, and reassemble `firestore-media://` strings into `Blob` Object URLs cached in memory and the Browser `Cache` API (`drdravid-firestore-media-v1`) so repeat visits use **0 extra Firestore reads**.

### Type & Column Mapping

| PostgreSQL Type / Column | Firestore Field / Type | Notes |
|---|---|---|
| `id text` / `uuid` | Document ID + `id: string` | Preserves original primary keys (`dr-yogesh-dravid`, `belgaum`, `ed2cee0e-...`, etc.) |
| `TIMESTAMPTZ` (`created_at`, `updated_at`) | Firestore `Timestamp` (`createdAt`, `updatedAt`) | Preserves exact UTC timestamps; `saveDocumentToFirestore` uses transactions to preserve `createdAt` on updates |
| `INTEGER` | `number` (integer) | `experienceYears`, `teachingExperienceYears`, `rating`, `patientAge` |
| `BOOLEAN` | `boolean` | `isAdmin`, `isSpecialSchedule`, `emailReminderSent` |
| `TEXT[]` | `string[]` | `specializations`, `timings`, `features`, `conditions`, `tags` |
| Legacy `image_url`, `cover_image`, `before_image`, `after_image` | Canonical `mediaUrl`, `beforeMediaUrl`, `afterMediaUrl` | Migration backfills canonical fields when Supabase `media_url` was `null`, and converts `supabase.co/storage/...` images/videos into Firestore strings |

---

## 3. Authentication Migration & Password Handling

- User UID (`ed2cee0e-01e3-4fc4-8922-205aa7443b19`), `email`, and `emailVerified` status are preserved via `auth.importUsers(...)`.
- Admin privileges are applied both via Firebase Auth custom claims (`{ is_admin: true }`) and the migrated `profiles/{uid}` document (`{ isAdmin: true }`).
- **Password Hash Note**: Supabase GoTrue Admin REST API does not export `auth.users.encrypted_password` bcrypt hashes. Migrated users can click **"Forgot or migrating password? Send reset email"** inside [`AdminPanel`](../src/components/AdminPanel.tsx) (or set a password in Firebase Console -> Authentication) before first sign-in.

---

## 4. Migration Scripts & Commands

```bash
# Optional: refresh read-only snapshot from Supabase before final cutover
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run migrate:extract

# Validate snapshot & print Spark free-tier resource estimate (zero writes)
npm run migrate:validate
npm run migrate:dry-run

# Deploy Firestore rules & composite indexes (no Storage required!)
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes

# Run idempotent migration (Auth + inline/chunked Firestore media + 9 collections)
npm run migrate:firebase

# Cryptographically verify every record, Auth user, and all 38 Base64 media files
npm run migrate:verify
```

---

## 5. Firebase Usage & Cost Estimation (Spark Free Tier Compatible)

Based on the verified source snapshot:

- **Entity Documents**: 34 documents across 9 collections.
- **Media Assets Converted to Base64 Strings**:
  - 6 media files stored inline inside `doctors`, `gallery`, `blog`, and `prepost`.
  - 32 larger photos, videos, and archived assets stored in `media_assets` across **232** chunk documents (~143.16 MB total Base64 size).
- **Total Migration Writes**: **~298 Firestore document writes** (Spark Free Tier allows **20,000 writes/day**).
- **Total Firestore Storage**: **~143.16 MB** (Spark Free Tier allows **1,024 MB / 1 GiB**).
- **Firebase Cloud Storage**: **0 bytes (not used — no Blaze plan required)**.
- **Firebase Authentication**: 1 admin account (Spark Free Tier allows 50,000 MAU).

---

## 6. Deployment & Rollback

### Deployment

```bash
npm run lint && npm test && npm run build
npx firebase deploy --only firestore:rules,firestore:indexes,hosting
```

### Rollback

1. The original Supabase project (`uhlsjevfzcbgllprfxdt`) is untouched during migration.
2. Complete extracted JSON tables, Auth metadata, SQL schema, and all 38 original media files remain archived locally in `migration-archive/supabase-backup/` (gitignored) along with `migration-archive/.env.supabase.backup`.
3. To roll back, restore the pre-migration commit (`45d1f38eb8f4e5e1d5336bfe620f165738644894`) and redeploy with the original Supabase environment variables, or re-run `npm run migrate:firebase -- --overwrite` to re-sync Firestore.
