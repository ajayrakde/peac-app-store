import { pgTable, serial, varchar, text, jsonb, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const searchAnalytics = pgTable('search_analytics', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  searchType: varchar('search_type').notNull(),
  query: text('query').notNull(),
  filters: jsonb('filters'),
  resultCount: integer('result_count').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  cached: boolean('cached').notNull().default(false),
});
