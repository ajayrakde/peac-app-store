import { createInsertSchema } from 'drizzle-zod';
import { applications } from '../schema';

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});
