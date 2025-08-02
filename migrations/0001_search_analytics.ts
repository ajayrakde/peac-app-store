import { pgTable, serial, varchar, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const searchAnalytics = pgTable('search_analytics', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  searchType: varchar('search_type').notNull(),
  query: text('query').notNull(),
  filters: jsonb('filters'),
  resultCount: integer('result_count').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  cached: boolean('cached').notNull().default(false),
  
  // Add indexes inline with the schema
  // This is more maintainable than separate SQL files
}, (table) => {
  return {
    userIdx: index('idx_search_analytics_user').on(table.userId),
    typeIdx: index('idx_search_analytics_type').on(table.searchType),
    timestampIdx: index('idx_search_analytics_timestamp').on(table.timestamp),
    // Full-text search index
    queryIdx: index('idx_search_analytics_query').on(sql`to_tsvector('english', ${table.query})`).using('gin')
  }
});
