import { createInsertSchema } from 'drizzle-zod';
import { users } from '../schema';

export const insertUserSchema = createInsertSchema(users).pick({
  firebaseUid: true,
  email: true,
  phone: true,
  role: true,
  name: true,
});
