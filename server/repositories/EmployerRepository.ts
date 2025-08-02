import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { employers, users, jobPosts, applications } from '@shared/schema';
import type { InsertEmployer } from '@shared/types';

/**
 * Repository for handling employer-related database operations
 */
export class EmployerRepository {
  /**
   * Find an employer by their user ID
   */
  static async findByUserId(userId: number) {
    const [employer] = await db
      .select()
      .from(employers)
      .where(
        and(
          eq(employers.userId, userId),
          eq(employers.deleted, false)
        )
      )
      .limit(1);
    
    return employer;
  }

  /**
   * Create a new employer profile
   */
  static async create(data: InsertEmployer) {
    const [employer] = await db
      .insert(employers)
      .values({ ...data, profileStatus: 'pending' } as any)
      .returning();
    
    return employer;
  }

  /**
   * Update an employer's profile
   */
  static async update(id: number, data: Partial<InsertEmployer>) {
    const [updated] = await db
      .update(employers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employers.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Find all unverified employers with user details
   */
  static async findUnverified() {
    const result = await db
      .select({
        employer: employers,
        user: {
          name: users.name,
          email: users.email
        }
      })
      .from(employers)
      .innerJoin(users, eq(users.id, employers.userId))
      .where(
        and(
          eq(employers.profileStatus, 'pending'),
          eq(employers.deleted, false)
        )
      );
    
    return result;
  }

  /**
   * Verify an employer's profile
   */
  static async verify(id: number) {
    const [updated] = await db
      .update(employers)
      .set({ 
        profileStatus: 'verified',
        updatedAt: new Date()
      })
      .where(eq(employers.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Reject an employer's profile
   */
  static async reject(id: number) {
    const [updated] = await db
      .update(employers)
      .set({
        profileStatus: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(employers.id, id))
      .returning();

    return updated;
  }

  /**
   * Put an employer's profile back to pending
   */
  static async hold(id: number) {
    const [updated] = await db
      .update(employers)
      .set({
        profileStatus: 'pending',
        updatedAt: new Date()
      })
      .where(eq(employers.id, id))
      .returning();

    return updated;
  }

  /**
   * Get employer statistics
   */
  static async getEmployerStats(employerId: number) {
    const stats = await db.transaction(async (tx: any) => {
      const [activeJobsCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(jobPosts)
        .where(
          and(
            eq(jobPosts.employerId, employerId),
            eq(jobPosts.jobStatus, 'ACTIVE'),
            eq(jobPosts.deleted, false)
          )
        );

      const [fulfilledJobsCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(jobPosts)
        .where(
          and(
            eq(jobPosts.employerId, employerId),
            eq(jobPosts.jobStatus, 'FULFILLED'),
            eq(jobPosts.deleted, false)
          )
        );

      const [applicationsCount] = await tx
        .select({ count: sql<number>`count(${applications.id})` })
        .from(applications)
        .innerJoin(jobPosts, eq(applications.jobPostId, jobPosts.id))
        .where(
          and(
            eq(jobPosts.employerId, employerId),
            eq(jobPosts.deleted, false)
          )
        );

      return {
        activeJobs: activeJobsCount.count,
        fulfilledJobs: fulfilledJobsCount.count,
        totalApplications: applicationsCount.count
      };
    });

    return stats;
  }

  /**
   * Soft delete an employer's profile
   */
  static async delete(id: number) {
    const [deleted] = await db
      .update(employers)
      .set({
        deleted: true,
        updatedAt: new Date()
      })
      .where(eq(employers.id, id))
      .returning();

    return deleted;
  }

  /** Retrieve employer by ID */
  static async getEmployer(id: number) {
    const [employer] = await db
      .select()
      .from(employers)
      .where(eq(employers.id, id))
      .limit(1);
    return employer;
  }

  /** Retrieve employer by user ID */
  static async getEmployerByUserId(userId: number) {
    return this.findByUserId(userId);
  }

  /** Alias for create */
  static async createEmployer(data: InsertEmployer) {
    return this.create(data);
  }

  /** Alias for update */
  static async updateEmployer(id: number, data: Partial<InsertEmployer>) {
    return this.update(id, data);
  }

  /** Get all unverified employers */
  static async getUnverifiedEmployers() {
    return this.findUnverified();
  }

  /** Alias for verify */
  static async verifyEmployer(id: number) {
    return this.verify(id);
  }

  /** Hold employer via alias */
  static async holdEmployer(id: number) {
    return this.hold(id);
  }

  /** Alias for delete */
  static async softDeleteEmployer(id: number) {
    return this.delete(id);
  }

  /** Retrieve fulfilled jobs for employer */
  static async getFulfilledJobsByEmployer(employerId: number) {
    return db
      .select()
      .from(jobPosts)
      .where(
        and(
          eq(jobPosts.employerId, employerId),
          eq(jobPosts.jobStatus, 'FULFILLED'),
          eq(jobPosts.deleted, false)
        )
      )
      .orderBy(desc(jobPosts.createdAt));
  }

  /** Retrieve active, unfulfilled jobs for employer */
  static async getActiveUnfulfilledJobsByEmployer(employerId: number) {
    return db
      .select()
      .from(jobPosts)
      .where(
        and(
          eq(jobPosts.employerId, employerId),
          eq(jobPosts.jobStatus, 'ACTIVE'),
          eq(jobPosts.deleted, false)
        )
      )
      .orderBy(desc(jobPosts.createdAt));
  }

  /** Retrieve applications across all jobs for employer */
  static async getApplicationsByEmployer(employerId: number) {
    return db
      .select({
        id: applications.id,
        jobPostId: applications.jobPostId,
        candidateId: applications.candidateId,
        status: applications.status,
        appliedAt: applications.appliedAt,
        jobTitle: jobPosts.title,
      })
      .from(applications)
      .innerJoin(jobPosts, eq(jobPosts.id, applications.jobPostId))
      .where(eq(jobPosts.employerId, employerId))
      .orderBy(desc(applications.appliedAt));
  }

  /** Retrieve applications for a specific job without personal details */
  static async getApplicationsByJobForEmployer(jobPostId: number) {
    return db
      .select({
        id: applications.id,
        jobPostId: applications.jobPostId,
        candidateId: applications.candidateId,
        status: applications.status,
        appliedAt: applications.appliedAt,
      })
      .from(applications)
      .where(eq(applications.jobPostId, jobPostId))
      .orderBy(desc(applications.appliedAt));
  }
}
