import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { candidates, users, applications, jobPosts } from '@shared/schema';
import type { InsertCandidate } from '@shared/types';

/**
 * Repository for handling candidate-related database operations
 */
export class CandidateRepository {
  /**
   * Find a candidate by their user ID with profile details
   */
  static async findByUserId(userId: number) {
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.userId, userId),
          eq(candidates.deleted, false)
        )
      )
      .limit(1);
    
    return candidate;
  }

  /**
   * Create a new candidate profile
   */
  static async create(data: InsertCandidate) {
    const [candidate] = await db
      .insert(candidates)
      .values({ ...data, profileStatus: 'pending' } as any)
      .returning() as any;
    
    return candidate;
  }

  /**
   * Update a candidate's profile
   */
  static async update(id: number, data: Partial<InsertCandidate>) {
    const [updated] = await db
      .update(candidates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Get all unverified candidates
   */
  static async findUnverified() {
    const result = await db
      .select({
        candidate: candidates,
        user: {
          name: users.name,
          email: users.email
        }
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .where(
        and(
          eq(candidates.profileStatus, 'pending'),
          eq(candidates.deleted, false)
        )
      );
    
    return result;
  }

  /**
   * Verify a candidate's profile
   */
  static async verify(id: number) {
    const [updated] = await db
      .update(candidates)
      .set({ 
        profileStatus: 'verified',
        updatedAt: new Date()
      })
      .where(eq(candidates.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Reject a candidate's profile
   */
  static async reject(id: number) {
    const [updated] = await db
      .update(candidates)
      .set({
        profileStatus: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(candidates.id, id))
      .returning();

    return updated;
  }

  /**
   * Put a candidate profile back to pending status
   */
  static async hold(id: number) {
    const [updated] = await db
      .update(candidates)
      .set({
        profileStatus: 'pending',
        updatedAt: new Date()
      })
      .where(eq(candidates.id, id))
      .returning();

    return updated;
  }

  /**
   * Soft delete a candidate's profile
   */
  static async delete(id: number) {
    const [deleted] = await db
      .update(candidates)
      .set({
        deleted: true,
        updatedAt: new Date()
      })
      .where(eq(candidates.id, id))
      .returning();

    return deleted;
  }

  /** Retrieve candidate by ID */
  static async getCandidate(id: number) {
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, id))
      .limit(1);
    return candidate;
  }

  /** Retrieve candidate by user ID */
  static async getCandidateByUserId(userId: number) {
    return this.findByUserId(userId);
  }

  /** Create candidate via alias */
  static async createCandidate(data: InsertCandidate) {
    return this.create(data);
  }

  /** Update candidate via alias */
  static async updateCandidate(id: number, data: Partial<InsertCandidate>) {
    return this.update(id, data);
  }

  /** Get all candidates */
  static async getAllCandidates() {
    return db.select().from(candidates).where(eq(candidates.deleted, false));
  }

  /** Get unverified candidates */
  static async getUnverifiedCandidates() {
    return this.findUnverified();
  }

  /** Verify candidate via alias */
  static async verifyCandidate(id: number) {
    return this.verify(id);
  }

  /** Hold candidate via alias */
  static async holdCandidate(id: number) {
    return this.hold(id);
  }

  /** Soft delete candidate via alias */
  static async softDeleteCandidate(id: number) {
    return this.delete(id);
  }

  /**
   * Basic candidate statistics - total applications count
   */
  static async getCandidateStats(candidateId: number) {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(eq(applications.candidateId, candidateId));
    return { applications: countRow.count };
  }

  /**
   * Fetch candidate job applications
   */
  static async getCandidateApplications(candidateId: number) {
    return db
      .select({
        id: applications.id,
        jobPostId: applications.jobPostId,
        status: applications.status,
        appliedAt: applications.appliedAt,
        jobTitle: jobPosts.title,
        location: jobPosts.location,
        salaryRange: jobPosts.salaryRange,
        jobCode: jobPosts.jobCode,
      })
      .from(applications)
      .innerJoin(jobPosts, eq(jobPosts.id, applications.jobPostId))
      .where(eq(applications.candidateId, candidateId))
      .orderBy(desc(applications.appliedAt));
  }

  /**
   * Retrieve the most active candidates based on application count
   */
  static async getMostActiveCandidates(limit = 10) {
    return db
      .select({
        candidate: candidates,
        user: {
          name: users.name,
          email: users.email,
        },
        applications: sql<number>`count(${applications.id})`.as('applications'),
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .leftJoin(applications, eq(applications.candidateId, candidates.id))
      .where(and(eq(candidates.deleted, false), eq(candidates.profileStatus, 'verified')))
      .groupBy(candidates.id, users.id)
      .orderBy(desc(sql`count(${applications.id})`))
      .limit(limit);
  }

  /**
   * Placeholder for recommended jobs
   */
  static async getRecommendedJobs(_candidateId: number) {
    // Recommendation logic is not implemented yet
    return [] as any[];
  }
}
