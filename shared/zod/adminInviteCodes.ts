import { createInsertSchema } from 'drizzle-zod';
import { adminInviteCodes } from '../schema';

export const insertAdminInviteCodeSchema = createInsertSchema(adminInviteCodes);
