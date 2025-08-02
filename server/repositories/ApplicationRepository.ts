import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { applications, jobPosts, candidates } from '@shared/schema';
import type { InsertApplication } from '@shared/types';

/**
 * Repository for handling job application-related database operations
 */
export class ApplicationRepository {
  /**
   * Create a new job application
   */
  static async create(data: InsertApplication) {
    const [application] = await db
      .insert(applications)
      .values(data)
      .returning();
    
    // Update the applications count for the job post
    await db
      .update(jobPosts)
      .set({ 
        applicationsCount: sql`applications_count + 1` 
      })
      .where(eq(jobPosts.id, data.jobPostId));
    
    return application;
  }

  /**
   * Find application by ID with details
   */
  static async findById(id: number) {
    const [application] = await db
      .select({
        application: applications,
        jobPost: {
          title: jobPosts.title,
          employerId: jobPosts.employerId
        },
        candidate: {
          name: candidates.name
        }
      })
      .from(applications)
      .innerJoin(jobPosts, eq(jobPosts.id, applications.jobPostId))
      .innerJoin(candidates, eq(candidates.id, applications.candidateId))
      .where(eq(applications.id, id))
      .limit(1);
    
    return application;
  }

  /**
   * Update application status
   */
  static async updateStatus(id: number, status: string) {
    const [updated] = await db
      .update(applications)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(applications.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Find applications for a job post
   */
  static async findByJobId(jobPostId: number) {
    const results = await db
      .select({
        application: applications,
        candidate: {
          name: candidates.name
        }
      })
      .from(applications)
      .innerJoin(candidates, eq(candidates.id, applications.candidateId))
      .where(eq(applications.jobPostId, jobPostId))
      .orderBy(desc(applications.appliedAt));
    
    return results;
  }

  /**
   * Find applications by candidate
   */
  static async findByCandidateId(candidateId: number) {
    const results = await db
      .select({
        application: applications,
        jobPost: {
          title: jobPosts.title,
          employerId: jobPosts.employerId
        }
      })
      .from(applications)
      .innerJoin(jobPosts, eq(jobPosts.id, applications.jobPostId))
      .where(eq(applications.candidateId, candidateId))
      .orderBy(desc(applications.appliedAt));

    return results;
  }

  /**
   * Find an application for a candidate and job
   */
  static async findByCandidateAndJob(candidateId: number, jobPostId: number) {
    const [result] = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.candidateId, candidateId),
          eq(applications.jobPostId, jobPostId)
        )
      )
      .limit(1);

    return result;
  }
}
