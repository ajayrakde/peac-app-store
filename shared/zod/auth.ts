import { z } from 'zod';
import { insertUserSchema } from './users';

export const registerUserSchema = insertUserSchema.extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  email: z.string().email('Invalid email address'),
});
