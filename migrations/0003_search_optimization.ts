import { sql } from 'drizzle-orm';
import { candidates, employers, jobPosts } from '../schema';

export async function up(db: any) {
  // Full-text search indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_candidates_search 
    ON ${candidates} USING gin(
      to_tsvector('english', 
        coalesce(first_name, '') || ' ' || 
        coalesce(last_name, '') || ' ' || 
        coalesce(email, '')
      )
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_employers_search 
    ON ${employers} USING gin(
      to_tsvector('english', 
        coalesce(organization_name, '') || ' ' || 
        coalesce(business_type, '')
      )
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_jobs_search 
    ON ${jobPosts} USING gin(
      to_tsvector('english', 
        coalesce(title, '') || ' ' || 
        coalesce(description, '')
      )
    )
  `);

  // Cursor-based pagination indexes (compound indexes)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_candidates_cursor 
    ON ${candidates} (created_at DESC, id DESC)
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_employers_cursor 
    ON ${employers} (created_at DESC, id DESC)
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_jobs_cursor 
    ON ${jobPosts} (created_at DESC, id DESC)
  `);
}

export async function down(db: any) {
  // Drop in reverse order
  await db.execute(sql`DROP INDEX IF EXISTS idx_jobs_cursor`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_employers_cursor`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_candidates_cursor`);
  
  await db.execute(sql`DROP INDEX IF EXISTS idx_jobs_search`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_employers_search`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_candidates_search`);
}
