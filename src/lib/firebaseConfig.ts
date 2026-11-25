import type { FirebaseOptions } from 'firebase/app';

const REQUIRED_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export function validateFirebaseEnv(env: Record<string, string | undefined>): FirebaseOptions {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !env[key] || !String(env[key]).trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missing.join(', ')}. Configure them in .env (see .env.example).`
    );
  }

  const options: FirebaseOptions = {
    apiKey: env.VITE_FIREBASE_API_KEY!,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN!,
    projectId: env.VITE_FIREBASE_PROJECT_ID!,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
    appId: env.VITE_FIREBASE_APP_ID!,
  };

  if (env.VITE_FIREBASE_STORAGE_BUCKET) {
    options.storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET;
  }

  if (env.VITE_FIREBASE_MEASUREMENT_ID) {
    options.measurementId = env.VITE_FIREBASE_MEASUREMENT_ID;
  }

  return options;
}
