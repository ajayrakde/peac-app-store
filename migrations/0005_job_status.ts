import { sql } from 'drizzle-orm';
import { jobPosts } from '../shared/schema';

export async function up(db: any): Promise<void> {
  await db.execute(sql`ALTER TABLE ${jobPosts} ADD COLUMN job_status text DEFAULT 'PENDING' NOT NULL`);
  await db.execute(sql`
    UPDATE ${jobPosts}
    SET job_status = CASE
      WHEN deleted = true THEN 'PENDING'
      WHEN fulfilled = true THEN 'FULFILLED'
      WHEN on_hold = true THEN 'ON_HOLD'
      WHEN is_active = true THEN 'ACTIVE'
      WHEN is_active = false AND fulfilled = false AND created_at <= now() - interval '90 days' THEN 'DORMANT'
      ELSE 'PENDING'
    END`);
}

export async function down(db: any): Promise<void> {
  await db.execute(sql`ALTER TABLE ${jobPosts} DROP COLUMN job_status`);
}
