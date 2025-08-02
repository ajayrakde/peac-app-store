import { pgTable, serial, integer, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  maritalStatus: text('marital_status'),
  dependents: integer('dependents').default(0),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  qualifications: jsonb('qualifications'),
  experience: jsonb('experience'),
  skills: jsonb('skills'),
  languages: jsonb('languages'),
  expectedSalary: integer('expected_salary'),
  jobCodes: jsonb('job_codes'),
  documents: jsonb('documents'),
  profileStatus: text('profile_status').default('incomplete').notNull(),
  deleted: boolean('deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
