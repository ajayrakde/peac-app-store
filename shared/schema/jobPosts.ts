import { pgTable, serial, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { employers } from './employers';

export const jobPosts = pgTable('job_posts', {
  id: serial('id').primaryKey(),
  employerId: integer('employer_id').references(() => employers.id).notNull(),
  jobCode: text('job_code').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  minQualification: text('min_qualification').notNull(),
  experienceRequired: text('experience_required'),
  skills: text('skills').notNull(),
  responsibilities: text('responsibilities').notNull(),
  salaryRange: text('salary_range').notNull(),
  location: text('location').notNull(),
  vacancy: integer('vacancy').default(1),
  deleted: boolean('deleted').default(false),
  onHold: boolean('on_hold').default(false),
  jobStatus: text('job_status').default('PENDING').notNull(),
  applicationsCount: integer('applications_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
