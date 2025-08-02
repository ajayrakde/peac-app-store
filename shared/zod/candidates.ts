import { createInsertSchema } from 'drizzle-zod';
import { candidates } from '../schema';

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  userId: true,
  profileStatus: true,
  deleted: true,
  createdAt: true,
  updatedAt: true,
});
