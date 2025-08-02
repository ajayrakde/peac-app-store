import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { jobPosts } from '../schema';

export const insertJobPostSchema = createInsertSchema(jobPosts).omit({
  id: true,
  applicationsCount: true,
  deleted: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  jobStatus: z.enum(['PENDING', 'ON_HOLD', 'ACTIVE', 'FULFILLED', 'DORMANT']),
});

export const jobPostValidationSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters'),
  minQualification: z.string()
    .min(1, 'Minimum qualification is required'),
  experienceRequired: z.string()
    .min(1, 'Experience requirement is required'),
  skills: z.string()
    .min(1, 'Skills are required'),
  responsibilities: z.string()
    .min(1, 'Responsibilities are required'),
  vacancy: z.number()
    .int()
    .positive('Number of vacancies must be positive'),
  location: z.string()
    .min(1, 'Location is required'),
  salaryRange: z.string()
    .min(1, 'Salary range is required'),
  jobCode: z.string().optional(),
  employerId: z.number()
    .int()
    .positive('Invalid employer ID'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const jobPostSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.string().optional(),
  employerId: z.number().optional(),
  sortBy: z.enum(['latest', 'salary', 'relevance']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});
