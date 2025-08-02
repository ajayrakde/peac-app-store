import {
  users,
  candidates,
  employers,
  jobPosts,
  applications,
  shortlists,
  matchScores
} from '@shared/schema';
import type {
  User,
  InsertUser,
  Candidate,
  InsertCandidate,
  Employer,
  InsertEmployer,
  JobPost,
  InsertJobPost,
  Application,
  InsertApplication,
  Shortlist,
  InsertShortlist,
  MatchScore
} from '@shared/types';
import { db } from "./db";
import { eq, ne, desc, and, gte, sql } from "drizzle-orm";
import { CandidateRepository } from './repositories/CandidateRepository';
import { EmployerRepository } from './repositories/EmployerRepository';
import { JobRepository } from './repositories/JobRepository';
import { ApplicationRepository } from './repositories/ApplicationRepository';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Candidate operations
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidateByUserId(userId: number): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate>;
  getAllCandidates(): Promise<Candidate[]>;
  getUnverifiedCandidates(): Promise<Candidate[]>;
  verifyCandidate(id: number): Promise<Candidate>;
  holdCandidate(id: number): Promise<Candidate>;
  rejectCandidate(id: number): Promise<Candidate>;
  softDeleteCandidate(id: number): Promise<Candidate>;
  getCandidateStats(candidateId: number): Promise<any>;
  getRecommendedJobs(candidateId: number): Promise<any[]>;
  getCandidateApplications(candidateId: number): Promise<any[]>;

  // Employer operations
  getEmployer(id: number): Promise<Employer | undefined>;
  getEmployerByUserId(userId: number): Promise<Employer | undefined>;
  createEmployer(employer: InsertEmployer): Promise<Employer>;
  updateEmployer(id: number, updates: Partial<Employer>): Promise<Employer>;
  getUnverifiedEmployers(): Promise<Employer[]>;
  verifyEmployer(id: number): Promise<Employer>;
  holdEmployer(id: number): Promise<Employer>;
  rejectEmployer(id: number): Promise<Employer>;
  softDeleteEmployer(id: number): Promise<Employer>;

  // Job post operations

  getJobPost(id: number): Promise<(JobPost & { status: string }) | undefined>;
  getJobPostIncludingDeleted(id: number): Promise<(JobPost & { status: string }) | undefined>;
  createJobPost(jobPost: InsertJobPost): Promise<JobPost & { status: string }>;
  updateJobPost(id: number, updates: Partial<JobPost>): Promise<JobPost & { status: string }>;
  getJobPostsByEmployer(employerId: number): Promise<(JobPost & { status: string })[]>;
  getAllJobPosts(): Promise<(JobPost & { status: string })[]>;
  getActiveJobPosts(): Promise<(JobPost & { status: string })[]>;
  getInactiveJobPosts(): Promise<(JobPost & { status: string })[]>;
  softDeleteJobPost(id: number): Promise<JobPost & { status: string }>;
  getEmployerStats(employerId: number): Promise<any>;
  markJobAsFulfilled(jobId: number): Promise<JobPost & { status: string }>;
  activateJob(jobId: number): Promise<JobPost & { status: string }>;
  deactivateJob(jobId: number): Promise<JobPost & { status: string }>;
  approveJob(jobId: number): Promise<JobPost & { status: string }>;
  holdJob(jobId: number): Promise<JobPost & { status: string }>;
  getFulfilledJobsByEmployer(employerId: number): Promise<JobPost[]>;
  getActiveUnfulfilledJobsByEmployer(employerId: number): Promise<JobPost[]>;

  // Application operations
  createApplication(application: InsertApplication): Promise<Application>;
  getApplicationsByCandidate(candidateId: number): Promise<Application[]>;
  getApplicationsByJob(jobPostId: number): Promise<Application[]>;
  getApplicationsByEmployer(employerId: number): Promise<any[]>;
  getApplicationsByJobForEmployer(jobPostId: number): Promise<any[]>;
  getApplicationForCandidateJob(
    candidateId: number,
    jobPostId: number
  ): Promise<Application | undefined>;

  // Shortlist operations
  createShortlist(shortlist: InsertShortlist): Promise<Shortlist>;
  getShortlistsByJob(jobPostId: number): Promise<Shortlist[]>;

  // Match score operations
  saveMatchScore(jobPostId: number, candidateId: number, score: number, factors: any): Promise<MatchScore>;
  getMatchScore(jobPostId: number, candidateId: number): Promise<MatchScore | undefined>;

  // Admin operations
  getAdminStats(): Promise<any>;
  getExportData(): Promise<any>;
  getMostActiveCandidates(limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // Candidate operations
  async getCandidate(id: number): Promise<Candidate | undefined> {
    return CandidateRepository.getCandidate(id);
  }

  async getCandidateByUserId(userId: number): Promise<Candidate | undefined> {
    return CandidateRepository.getCandidateByUserId(userId);
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    return CandidateRepository.createCandidate(insertCandidate);
  }

  async updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate> {
    return CandidateRepository.updateCandidate(id, updates);
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return CandidateRepository.getAllCandidates();
  }

  async getUnverifiedCandidates(): Promise<Candidate[]> {
    return CandidateRepository.getUnverifiedCandidates();
  }

  async verifyCandidate(id: number): Promise<Candidate> {
    return CandidateRepository.verifyCandidate(id);
  }

  async holdCandidate(id: number): Promise<Candidate> {
    return CandidateRepository.holdCandidate(id);
  }

  async rejectCandidate(id: number): Promise<Candidate> {
    return CandidateRepository.reject(id);
  }

  async softDeleteCandidate(id: number): Promise<Candidate> {
    return CandidateRepository.softDeleteCandidate(id);
  }

  async getCandidateStats(candidateId: number): Promise<any> {
    return CandidateRepository.getCandidateStats(candidateId);
  }

  async getRecommendedJobs(candidateId: number): Promise<any[]> {
    return CandidateRepository.getRecommendedJobs(candidateId);
  }

  async getCandidateApplications(candidateId: number): Promise<any[]> {
    return CandidateRepository.getCandidateApplications(candidateId);
  }

  // Employer operations
  async getEmployer(id: number): Promise<Employer | undefined> {
    return EmployerRepository.getEmployer(id);
  }

  async getEmployerByUserId(userId: number): Promise<Employer | undefined> {
    return EmployerRepository.getEmployerByUserId(userId);
  }

  async createEmployer(insertEmployer: InsertEmployer): Promise<Employer> {
    return EmployerRepository.createEmployer(insertEmployer);
  }

  async updateEmployer(id: number, updates: Partial<Employer>): Promise<Employer> {
    return EmployerRepository.updateEmployer(id, updates);
  }

  async getUnverifiedEmployers(): Promise<Employer[]> {
    return EmployerRepository.getUnverifiedEmployers();
  }

  async verifyEmployer(id: number): Promise<Employer> {
    return EmployerRepository.verifyEmployer(id);
  }

  async holdEmployer(id: number): Promise<Employer> {
    return EmployerRepository.holdEmployer(id);
  }

  async rejectEmployer(id: number): Promise<Employer> {
    return EmployerRepository.reject(id);
  }

  async softDeleteEmployer(id: number): Promise<Employer> {
    return EmployerRepository.softDeleteEmployer(id);
  }

  // Job post operations
  async getJobPost(id: number): Promise<(JobPost & { status: string }) | undefined> {
    return JobRepository.getJobPost(id);
  }

  async getJobPostIncludingDeleted(id: number): Promise<(JobPost & { status: string }) | undefined> {
    return JobRepository.getJobPostIncludingDeleted(id);
  }

  async createJobPost(insertJobPost: InsertJobPost): Promise<JobPost & { status: string }> {
    return JobRepository.createJobPost(insertJobPost);
  }

  async updateJobPost(id: number, updates: Partial<JobPost>): Promise<JobPost & { status: string }> {
    return JobRepository.updateJobPost(id, updates);
  }

  async getJobPostsByEmployer(employerId: number): Promise<(JobPost & { status: string })[]> {
    return JobRepository.getJobPostsByEmployer(employerId);
  }

  async getAllJobPosts(): Promise<(JobPost & { status: string })[]> {
    const jobs = await JobRepository.getAllJobPosts();
    return jobs.filter(job => !job.deleted);
  }

  async getActiveJobPosts(): Promise<(JobPost & { status: string })[]> {
    const jobs = await JobRepository.getActiveJobPosts();
    return jobs.filter(job => !job.deleted);
  }

  async getInactiveJobPosts(): Promise<(JobPost & { status: string })[]> {
    return JobRepository.getInactiveJobs();
  }

  async getPublicJobPosts(): Promise<JobPost[]> {
    return JobRepository.getPublicJobs();
  }

  async getEmployerStats(employerId: number): Promise<any> {
    return EmployerRepository.getEmployerStats(employerId);
  }

  async markJobAsFulfilled(jobId: number): Promise<JobPost & { status: string }> {
    return JobRepository.markJobAsFulfilled(jobId);
  }

  async activateJob(jobId: number): Promise<JobPost & { status: string }> {
    return JobRepository.activateJob(jobId);
  }

  async deactivateJob(jobId: number): Promise<JobPost & { status: string }> {
    return JobRepository.deactivateJob(jobId);
  }

  async approveJob(jobId: number): Promise<JobPost & { status: string }> {
    return JobRepository.approveJob(jobId);
  }

  async holdJob(jobId: number): Promise<JobPost & { status: string }> {
    return JobRepository.holdJob(jobId);
  }

  async softDeleteJobPost(jobId: number): Promise<JobPost & { status: string }> {
    return JobRepository.softDeleteJobPost(jobId);
  }

  async getFulfilledJobsByEmployer(employerId: number): Promise<JobPost[]> {
    return EmployerRepository.getFulfilledJobsByEmployer(employerId);
  }

  async getActiveUnfulfilledJobsByEmployer(employerId: number): Promise<JobPost[]> {
    return EmployerRepository.getActiveUnfulfilledJobsByEmployer(employerId);
  }

  // Application operations
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    // ensure candidate is verified and not deleted
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, insertApplication.candidateId));
    if (!candidate || candidate.deleted || candidate.profileStatus !== 'verified') {
      throw new Error("Candidate not eligible to apply");
    }

    const job = await JobRepository.getJobPost(insertApplication.jobPostId);
    if (!job || job.jobStatus !== 'ACTIVE') {
      throw new Error('Job is not accepting applications');
    }

    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    
    // Update job post application count
    const [jobPost] = await db.select().from(jobPosts).where(eq(jobPosts.id, application.jobPostId));
    if (jobPost) {
      await db
        .update(jobPosts)
        .set({ applicationsCount: (jobPost.applicationsCount || 0) + 1 })
        .where(eq(jobPosts.id, jobPost.id));
    }
    
    return application;
  }

  async getApplicationsByCandidate(candidateId: number): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.candidateId, candidateId));
  }

  async getApplicationsByJob(jobPostId: number): Promise<any[]> {
    const result = await db
      .select({
        id: applications.id,
        jobPostId: applications.jobPostId,
        candidateId: applications.candidateId,
        status: applications.status,
        appliedAt: applications.appliedAt,
        candidateName: users.name,
        candidateEmail: users.email,
        candidatePhone: users.phone,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(users, eq(candidates.userId, users.id))
      .where(eq(applications.jobPostId, jobPostId))
      .orderBy(desc(applications.appliedAt));

    return result;
  }

  async getApplicationsByEmployer(employerId: number): Promise<any[]> {
    return EmployerRepository.getApplicationsByEmployer(employerId);
  }

  async getApplicationsByJobForEmployer(jobPostId: number): Promise<any[]> {
    return EmployerRepository.getApplicationsByJobForEmployer(jobPostId);
  }

  async getApplicationForCandidateJob(
    candidateId: number,
    jobPostId: number
  ): Promise<Application | undefined> {
    return ApplicationRepository.findByCandidateAndJob(candidateId, jobPostId);
  }

  // Shortlist operations
  async createShortlist(insertShortlist: InsertShortlist): Promise<Shortlist> {
    const [shortlist] = await db
      .insert(shortlists)
      .values(insertShortlist)
      .returning();
    return shortlist;
  }

  async getShortlistsByJob(jobPostId: number): Promise<Shortlist[]> {
    return await db.select().from(shortlists).where(eq(shortlists.jobPostId, jobPostId));
  }

  // Match score operations
  async saveMatchScore(jobPostId: number, candidateId: number, score: number, factors: any): Promise<MatchScore> {
    const [matchScore] = await db
      .insert(matchScores)
      .values({
        jobPostId,
        candidateId,
        score,
        factors,
      })
      .returning();
    return matchScore;
  }

  async getMatchScore(jobPostId: number, candidateId: number): Promise<MatchScore | undefined> {
    const [matchScore] = await db
      .select()
      .from(matchScores)
      .where(and(eq(matchScores.jobPostId, jobPostId), eq(matchScores.candidateId, candidateId)));
    return matchScore || undefined;
  }

  // Admin operations
  async getAdminStats(): Promise<any> {
    const allCandidates = await db.select().from(candidates);
    const activeJobs = await db
      .select()
      .from(jobPosts)
      .where(and(eq(jobPosts.jobStatus, 'ACTIVE'), eq(jobPosts.deleted, false)));
    const allShortlists = await db.select().from(shortlists);
    const matchRate = allCandidates.length > 0 ? Math.floor((allShortlists.length / allCandidates.length) * 100) : 0;
    
    return {
      candidates: allCandidates.length,
      jobs: activeJobs.length,
      matches: allShortlists.length,
      matchRate,
    };
  }

  async getExportData(): Promise<any> {
    const [allCandidates, allEmployers, allJobPosts, allApplications, allShortlists] = await Promise.all([
      db.select().from(candidates),
      db.select().from(employers),
      db.select().from(jobPosts),
      db.select().from(applications),
      db.select().from(shortlists),
    ]);
    
    return {
      candidates: allCandidates,
      employers: allEmployers,
      jobPosts: allJobPosts,
      applications: allApplications,
      shortlists: allShortlists,
    };
  }

  async getMostActiveCandidates(limit = 10): Promise<any[]> {
    return CandidateRepository.getMostActiveCandidates(limit);
  }
}

export const storage = new DatabaseStorage();
