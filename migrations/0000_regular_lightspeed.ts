import { sql } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  text, 
  boolean, 
  integer, 
  timestamp, 
  jsonb,
  uniqueIndex
} from 'drizzle-orm/pg-core';

export const adminInviteCodes = pgTable('admin_invite_codes', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  used: boolean('used').notNull().default(false),
  usedBy: integer('used_by'),
  createdAt: timestamp('created_at').defaultNow(),
  usedAt: timestamp('used_at')
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id').notNull(),
  jobPostId: integer('job_post_id').notNull(),
  status: text('status').default('applied'),
  appliedAt: timestamp('applied_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
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
  profileStatus: text('profile_status').notNull().default('pending'),
  deleted: boolean('deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const employers = pgTable('employers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  organizationName: text('organization_name').notNull(),
  registrationNumber: text('registration_number').notNull(),
  businessType: text('business_type').notNull(),
  address: text('address').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone').notNull()
}, (table) => {
  return {
    organizationNameIdx: uniqueIndex('employers_organization_name_idx').on(table.organizationName)
  };
});

export async function up(db: any) {
  await db.schema.createTable(adminInviteCodes);
  await db.schema.createTable(applications);
  await db.schema.createTable(candidates);
  await db.schema.createTable(employers);
}

export async function down(db: any) {
  await db.schema.dropTable(employers);
  await db.schema.dropTable(candidates);
  await db.schema.dropTable(applications);
  await db.schema.dropTable(adminInviteCodes);
}
