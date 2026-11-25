import * as fs from 'fs';
import { createRequire } from 'module';
import * as path from 'path';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing') as typeof import('@firebase/rules-unit-testing');

const PROJECT_ID = 'drdravid-f4b42';
const hasEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe.skipIf(!hasEmulators)('Firestore Security Rules (Firestore-Only Architecture)', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const [fsHost, fsPort] = process.env.FIRESTORE_EMULATOR_HOST!.split(':');

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: fsHost,
        port: Number(fsPort),
        rules: fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.collection('doctors').doc('doc-1').set({
        id: 'doc-1',
        name: 'Dr. Yogesh Dravid',
        image: 'data:image/jpeg;base64,TEST',
      });
      await db.collection('appointments').doc('appt-1').set({
        id: 'appt-1',
        patientName: 'Confidential Patient',
        status: 'Confirmed',
      });
      await db.collection('profiles').doc('user-regular').set({
        id: 'user-regular',
        email: 'user@example.com',
        isAdmin: false,
      });
      await db.collection('profiles').doc('admin-by-profile').set({
        id: 'admin-by-profile',
        email: 'admin2@example.com',
        isAdmin: true,
      });
      await db.collection('media_assets').doc('public-asset').set({
        id: 'public-asset',
        contentType: 'image/jpeg',
        totalChunks: 1,
        isPublic: true,
      });
      await db
        .collection('media_assets')
        .doc('public-asset')
        .collection('chunks')
        .doc('0000')
        .set({ index: 0, data: 'AAAA' });

      await db.collection('media_assets').doc('private-asset').set({
        id: 'private-asset',
        contentType: 'image/jpeg',
        totalChunks: 1,
        isPublic: false,
      });
      await db
        .collection('media_assets')
        .doc('private-asset')
        .collection('chunks')
        .doc('0000')
        .set({ index: 0, data: 'SECRET' });
    });
  });

  afterAll(async () => {
    await testEnv?.clearFirestore();
    await testEnv?.cleanup();
  });

  it('allows unauthenticated public reads on clinic content and public media_assets, while denying writes and PII', async () => {
    const unauth = testEnv.unauthenticatedContext();
    const db = unauth.firestore();

    await assertSucceeds(db.collection('doctors').doc('doc-1').get());
    await assertSucceeds(db.collection('media_assets').doc('public-asset').get());
    await assertSucceeds(
      db.collection('media_assets').doc('public-asset').collection('chunks').doc('0000').get()
    );

    // Private media assets & PII blocked
    await assertFails(db.collection('media_assets').doc('private-asset').get());
    await assertFails(
      db.collection('media_assets').doc('private-asset').collection('chunks').doc('0000').get()
    );
    await assertFails(db.collection('appointments').doc('appt-1').get());
    await assertFails(db.collection('profiles').doc('user-regular').get());

    // Writes strictly denied
    await assertFails(
      db.collection('doctors').doc('doc-2').set({ id: 'doc-2', name: 'Unauthorized' })
    );
    await assertFails(
      db.collection('media_assets').doc('unauth-asset').set({
        id: 'unauth-asset',
        totalChunks: 1,
        contentType: 'image/jpeg',
      })
    );

    // Unknown collection default deny
    await assertFails(db.collection('secrets').doc('any').get());
    await assertFails(db.collection('secrets').doc('any').set({ x: 1 }));
  });

  it('prevents non-admin authenticated users from escalating privileges or writing content/media', async () => {
    const regularCtx = testEnv.authenticatedContext('user-regular', {
      email: 'user@example.com',
    });
    const db = regularCtx.firestore();

    await assertSucceeds(db.collection('profiles').doc('user-regular').get());
    await assertFails(db.collection('profiles').doc('admin-by-profile').get());
    await assertFails(db.collection('profiles').doc('user-regular').update({ isAdmin: true }));

    const newUserCtx = testEnv.authenticatedContext('user-new', { email: 'new@example.com' });
    await assertFails(
      newUserCtx.firestore().collection('profiles').doc('user-new').set({
        id: 'user-new',
        email: 'new@example.com',
        isAdmin: true,
      })
    );
    await assertSucceeds(
      newUserCtx.firestore().collection('profiles').doc('user-new').set({
        id: 'user-new',
        email: 'new@example.com',
        isAdmin: false,
      })
    );

    await assertFails(
      db.collection('services').doc('srv-x').set({ id: 'srv-x', title: 'Blocked' })
    );
    await assertFails(
      db
        .collection('media_assets')
        .doc('public-asset')
        .collection('chunks')
        .doc('0001')
        .set({ index: 1, data: 'HACK' })
    );
    await assertFails(db.collection('appointments').doc('appt-1').get());
  });

  it('allows admins full authorized CRUD on collections and media_assets while enforcing schema/size guards', async () => {
    const claimAdminDb = testEnv
      .authenticatedContext('admin-claim', { is_admin: true })
      .firestore();

    await assertSucceeds(
      claimAdminDb.collection('doctors').doc('doc-new').set({
        id: 'doc-new',
        name: 'Dr. Prachi Dravid',
      })
    );
    await assertSucceeds(claimAdminDb.collection('appointments').doc('appt-1').get());
    await assertSucceeds(
      claimAdminDb.collection('media_assets').doc('admin-asset').set({
        id: 'admin-asset',
        contentType: 'image/png',
        totalChunks: 1,
        isPublic: true,
      })
    );
    await assertSucceeds(
      claimAdminDb
        .collection('media_assets')
        .doc('admin-asset')
        .collection('chunks')
        .doc('0000')
        .set({ index: 0, data: 'VALID_CHUNK' })
    );
    await assertSucceeds(claimAdminDb.collection('doctors').doc('doc-new').delete());

    // Profile-based admin also authorized
    const profileAdminDb = testEnv.authenticatedContext('admin-by-profile').firestore();
    await assertSucceeds(
      profileAdminDb.collection('services').doc('srv-new').set({
        id: 'srv-new',
        title: 'Constitutional Care',
      })
    );

    // Malformed writes rejected even for admin
    await assertFails(
      claimAdminDb.collection('doctors').doc('doc-mismatch').set({
        id: 'different-id',
        name: 'Mismatch',
      })
    );
    await assertFails(
      claimAdminDb.collection('testimonials').doc('rev-bad').set({
        id: 'rev-bad',
        patientName: 'P',
        comment: 'Good',
        rating: 99,
      })
    );
    // Chunk larger than 750,000 chars rejected
    await assertFails(
      claimAdminDb
        .collection('media_assets')
        .doc('admin-asset')
        .collection('chunks')
        .doc('0001')
        .set({ index: 1, data: 'A'.repeat(750_001) })
    );
  });
});
