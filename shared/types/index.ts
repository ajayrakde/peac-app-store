import { z } from 'zod';
import {
  users,
  candidates,
  employers,
  jobPosts,
  applications,
  shortlists,
  matchScores,
  adminInviteCodes,
} from '../schema';
import {
  insertUserSchema,
  insertCandidateSchema,
  insertEmployerSchema,
  insertJobPostSchema,
  insertApplicationSchema,
  insertShortlistSchema,
  insertAdminInviteCodeSchema,
} from '../zod';

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Employer = typeof employers.$inferSelect;
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type JobPost = typeof jobPosts.$inferSelect;
export type InsertJobPost = z.infer<typeof insertJobPostSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Shortlist = typeof shortlists.$inferSelect;
export type InsertShortlist = z.infer<typeof insertShortlistSchema>;
export type MatchScore = typeof matchScores.$inferSelect;
export type AdminInviteCode = typeof adminInviteCodes.$inferSelect;
export type InsertAdminInviteCode = z.infer<typeof insertAdminInviteCodeSchema>;

export * from './jobPosts';
export * from './search';
