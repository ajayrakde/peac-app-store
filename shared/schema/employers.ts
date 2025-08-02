import { pgTable, serial, integer, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const employers = pgTable('employers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  organizationName: text('organization_name').notNull(),
  registrationNumber: text('registration_number').notNull(),
  businessType: text('business_type').notNull(),
  address: text('address').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone').notNull(),
  documents: jsonb('documents'),
  profileStatus: text('profile_status').default('incomplete').notNull(),
  deleted: boolean('deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
