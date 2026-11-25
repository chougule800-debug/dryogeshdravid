import * as dns from 'dns';
import * as fs from 'fs';
import * as path from 'path';
import { App, cert, getApp, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

dns.setDefaultResultOrder('ipv4first');

export const EXPECTED_FIREBASE_PROJECT_ID = 'drdravid-f4b42';

export class MissingFirebaseAdminCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingFirebaseAdminCredentialsError';
  }
}

export interface FirebaseAdminContext {
  app: App;
  auth: Auth;
  db: Firestore;
  projectId: string;
  isEmulator: boolean;
}

export function isEmulatorEnvironment(): boolean {
  return Boolean(
    process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST
  );
}

function loadServiceAccountFromEnv(): ServiceAccount | null {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const resolved = path.isAbsolute(credPath)
      ? credPath
      : path.resolve(process.cwd(), credPath);
    if (!fs.existsSync(resolved)) {
      throw new MissingFirebaseAdminCredentialsError(
        `GOOGLE_APPLICATION_CREDENTIALS file not found at: ${resolved}`
      );
    }
    const raw = JSON.parse(fs.readFileSync(resolved, 'utf8')) as Record<string, string>;
    if (!raw.project_id || !raw.client_email || !raw.private_key) {
      throw new MissingFirebaseAdminCredentialsError(
        `Invalid service account JSON at ${resolved}: missing project_id, client_email, or private_key.`
      );
    }
    return {
      projectId: raw.project_id,
      clientEmail: raw.client_email,
      privateKey: raw.private_key,
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

export function initializeFirebaseAdmin(options?: {
  allowProjectMismatch?: boolean;
}): FirebaseAdminContext {
  const isEmulator = isEmulatorEnvironment();
  const configuredProjectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    EXPECTED_FIREBASE_PROJECT_ID;

  let serviceAccount: ServiceAccount | null = null;
  if (!isEmulator) {
    serviceAccount = loadServiceAccountFromEnv();
    if (!serviceAccount) {
      throw new MissingFirebaseAdminCredentialsError(
        [
          'Missing Firebase Admin SDK credentials for live project access.',
          'Provide either:',
          '  1. GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json',
          '  2. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env / shell.',
          'Or run against local emulators by setting FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST.',
        ].join('\n')
      );
    }
  }

  const targetProjectId = serviceAccount?.projectId || configuredProjectId;
  if (!options?.allowProjectMismatch && targetProjectId !== EXPECTED_FIREBASE_PROJECT_ID) {
    throw new Error(
      `Refusing to connect to unexpected Firebase project "${targetProjectId}". Expected "${EXPECTED_FIREBASE_PROJECT_ID}".`
    );
  }

  let app: App;
  if (getApps().length > 0) {
    app = getApp();
  } else if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: targetProjectId,
    });
  } else {
    app = initializeApp({
      projectId: targetProjectId,
    });
  }

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    projectId: targetProjectId,
    isEmulator,
  };
}
