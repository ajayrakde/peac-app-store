import { sql } from 'drizzle-orm';
import { pgTable, index } from 'drizzle-orm/pg-core';
import { 
  candidates,
  employers,
  jobPosts,
  users,
  candidateProfiles,
  employerProfiles 
} from '../shared/schema';

export async function up(db: any) {
  // Candidates search indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_candidates_search ON ${candidates} (
      is_verified,
      created_at DESC,
      id DESC
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_candidates_full_text ON ${candidates} USING GIN (
      to_tsvector('english',
        COALESCE((${users.firstName})::text, '') || ' ' ||
        COALESCE((${users.lastName})::text, '') || ' ' ||
        COALESCE((${candidateProfiles.title})::text, '')
      )
    )
  `);

  // Employers search indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_employers_search ON ${employers} (
      is_verified,
      created_at DESC,
      id DESC
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_employers_full_text ON ${employers} USING GIN (
      to_tsvector('english',
        COALESCE((${employerProfiles.companyName})::text, '') || ' ' ||
        COALESCE((${employerProfiles.industry})::text, '') || ' ' ||
        COALESCE((${employerProfiles.city})::text, '')
      )
    )
  `);

  // Job posts search indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_jobs_search ON ${jobPosts} (
      is_active,
      created_at DESC,
      id DESC
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_jobs_full_text ON ${jobPosts} USING GIN (
      to_tsvector('english',
        COALESCE((${jobPosts.title})::text, '') || ' ' ||
        COALESCE((${jobPosts.description})::text, '') || ' ' ||
        COALESCE((${jobPosts.location})::text, '')
      )
    )
  `);

  // Foreign key indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON ${candidates} (user_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_employers_user_id ON ${employers} (user_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON ${jobPosts} (employer_id)
  `);
}

export async function down(db: any) {
  // Remove indexes in reverse order
  await db.execute(sql`DROP INDEX IF EXISTS idx_jobs_employer_id`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_employers_user_id`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_candidates_user_id`);
  
  await db.execute(sql`DROP INDEX IF EXISTS idx_jobs_full_text`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_jobs_search`);
  
  await db.execute(sql`DROP INDEX IF EXISTS idx_employers_full_text`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_employers_search`);
  
  await db.execute(sql`DROP INDEX IF EXISTS idx_candidates_full_text`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_candidates_search`);
}
