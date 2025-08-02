import { pgTable, serial, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { jobPosts } from './jobPosts';
import { candidates } from './candidates';

export const matchScores = pgTable('match_scores', {
  id: serial('id').primaryKey(),
  jobPostId: integer('job_post_id').references(() => jobPosts.id).notNull(),
  candidateId: integer('candidate_id').references(() => candidates.id).notNull(),
  score: integer('score').notNull(),
  factors: jsonb('factors'),
  calculatedAt: timestamp('calculated_at').defaultNow(),
});
