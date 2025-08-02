import { sql } from 'drizzle-orm';
import { jobPosts } from '../shared/schema';

export async function up(db: any): Promise<void> {
  await db.execute(sql`ALTER TABLE ${jobPosts} ADD COLUMN on_hold boolean DEFAULT false`);
}

export async function down(db: any): Promise<void> {
  await db.execute(sql`ALTER TABLE ${jobPosts} DROP COLUMN on_hold`);
}
