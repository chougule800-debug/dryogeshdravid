import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
} from 'firebase/auth';
import {
  Firestore,
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { validateFirebaseEnv } from './firebaseConfig';

export { validateFirebaseEnv };

/**
 * Firebase single source of truth (client SDK — Auth + Cloud Firestore only).
 *
 * Uses only public Firebase Web App configuration from VITE_FIREBASE_* environment
 * variables — never any Admin SDK or service account private key.
 * All application records and media strings are stored exclusively in Cloud Firestore.
 */
export const firebaseConfig: FirebaseOptions = validateFirebaseEnv(
  import.meta.env as unknown as Record<string, string | undefined>
);

// Prevent duplicate Firebase initialization across Vite HMR reloads.
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const globalScope = globalThis as typeof globalThis & {
  __drDravidFirestore?: Firestore;
  __drDravidEmulatorsConnected?: boolean;
};

function createFirestoreInstance(firebaseApp: FirebaseApp): Firestore {
  if (globalScope.__drDravidFirestore) {
    return globalScope.__drDravidFirestore;
  }

  if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
    try {
      // Enable persistent IndexedDB cache with multi-tab support to minimize
      // Firestore document reads and preserve offline browsing resilience.
      const instance = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
      globalScope.__drDravidFirestore = instance;
      return instance;
    } catch {
      // Fallback if Firestore was already initialized in the current runtime.
    }
  }

  const existing = getFirestore(firebaseApp);
  globalScope.__drDravidFirestore = existing;
  return existing;
}

export const db: Firestore = createFirestoreInstance(app);
export const auth: Auth = getAuth(app);

// Persist Firebase Auth sessions across browser refreshes & tabs.
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Could not enforce browserLocalPersistence for Firebase Auth:', err);
  });
}

// Optional local Firebase Emulator Suite connection (never enabled in production builds unless explicitly set).
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && !globalScope.__drDravidEmulatorsConnected) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  globalScope.__drDravidEmulatorsConnected = true;
}
