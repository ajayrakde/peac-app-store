import { createInsertSchema } from 'drizzle-zod';
import { employers } from '../schema';

export const insertEmployerSchema = createInsertSchema(employers).omit({
  id: true,
  userId: true,
  profileStatus: true,
  deleted: true,
  createdAt: true,
  updatedAt: true,
});
