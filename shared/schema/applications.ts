import { pgTable, serial, integer, timestamp, text } from 'drizzle-orm/pg-core';
import { candidates } from './candidates';
import { jobPosts } from './jobPosts';

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id').references(() => candidates.id).notNull(),
  jobPostId: integer('job_post_id').references(() => jobPosts.id).notNull(),
  status: text('status').default('applied'),
  appliedAt: timestamp('applied_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
