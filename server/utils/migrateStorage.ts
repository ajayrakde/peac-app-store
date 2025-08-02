import { SupabaseStorageProvider } from '../storageProviders/SupabaseStorageProvider.js';
import { FirebaseStorageProvider } from '../storageProviders/FirebaseStorageProvider.js';
import { env } from '../config/env.js';
import { createClient } from '@supabase/supabase-js';

async function migrate() {
  const source = new SupabaseStorageProvider();
  const dest = new FirebaseStorageProvider();

  const client = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
  const buckets = ['candidates', 'employers'] as const;
  const summary = { copied: 0, skipped: 0, failed: 0 };

  for (const bucket of buckets) {
    const { data } = await client.storage.from(bucket).list('', {});
    for (const folder of data || []) {
      if (!folder.name) continue;
      const uid = folder.name.replace(/\/$/, '');
      const userType = bucket === 'candidates' ? 'candidate' : 'employer';
      const docs = await source.listDocuments(userType, uid);
      for (const doc of docs) {
        try {
          const file = await source.downloadDocument(userType, uid, doc.type, doc.filename);
          await dest.uploadDocument(userType, uid, doc.type, file.data, file.contentType, doc.filename);
          summary.copied++;
        } catch (e) {
          console.error('Failed to copy', uid, doc.filename, e);
          summary.failed++;
        }
      }
    }
  }

  console.log('Migration complete', summary);
}

migrate().catch(err => {
  console.error('Migration error', err);
});
