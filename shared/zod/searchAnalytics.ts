import { createInsertSchema } from 'drizzle-zod';
import { searchAnalytics } from '../schema';

export const insertSearchAnalyticsSchema = createInsertSchema(searchAnalytics);
