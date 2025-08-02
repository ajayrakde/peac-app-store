import { z } from 'zod';
import { jobPostValidationSchema, jobPostSearchSchema } from '../zod';

export type JobPostValidation = z.infer<typeof jobPostValidationSchema>;
export type CreateJobPostInput = Omit<
  JobPostValidation,
  'id' | 'jobCode' | 'createdAt' | 'updatedAt'
>;
export type UpdateJobPostInput = Partial<CreateJobPostInput>;
export type JobPostSearchParams = z.infer<typeof jobPostSearchSchema>;

export interface JobPostResponse {
  id: number;
  jobCode: string;
  employer: {
    id: number;
    name: string;
    logo?: string;
  };
  title: string;
  location: string;
  jobStatus: string;
  deleted: boolean;
  createdAt: Date;
}

export interface JobPostDetailResponse extends JobPostResponse {
  description: string;
  minQualification: string;
  experienceRequired: string;
  skills: string;
  responsibilities: string;
  vacancy: number;
  salaryRange: string;
  updatedAt: Date;
}
