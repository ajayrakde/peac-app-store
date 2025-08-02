import { pgTable, serial, integer, timestamp } from 'drizzle-orm/pg-core';
import { jobPosts } from './jobPosts';
import { candidates } from './candidates';
import { users } from './users';

export const shortlists = pgTable('shortlists', {
  id: serial('id').primaryKey(),
  jobPostId: integer('job_post_id').references(() => jobPosts.id).notNull(),
  candidateId: integer('candidate_id').references(() => candidates.id).notNull(),
  matchScore: integer('match_score'),
  shortlistedBy: integer('shortlisted_by').references(() => users.id).notNull(),
  shortlistedAt: timestamp('shortlisted_at').defaultNow(),
});
