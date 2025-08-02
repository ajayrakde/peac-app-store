import { sql } from 'drizzle-orm';
import { jobPosts } from '../shared/schema';

export async function up(db: any): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS idx_jobs_search`);
  await db.execute(sql`ALTER TABLE ${jobPosts} DROP COLUMN is_active`);
  await db.execute(sql`ALTER TABLE ${jobPosts} DROP COLUMN fulfilled`);
}

export async function down(db: any): Promise<void> {
  await db.execute(sql`ALTER TABLE ${jobPosts} ADD COLUMN is_active boolean DEFAULT true`);
  await db.execute(sql`ALTER TABLE ${jobPosts} ADD COLUMN fulfilled boolean DEFAULT false`);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_jobs_search ON ${jobPosts} (
      is_active,
      created_at DESC,
      id DESC
    )
  `);
}
