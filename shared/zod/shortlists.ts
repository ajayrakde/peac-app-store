import { createInsertSchema } from 'drizzle-zod';
import { shortlists } from '../schema';

export const insertShortlistSchema = createInsertSchema(shortlists).omit({
  id: true,
  shortlistedAt: true,
});
