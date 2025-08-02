import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  adminInviteCodes,
  users,
  candidates,
  employers,
  jobPosts,
  applications
} from '@shared/schema';
import type { InsertAdminInviteCode } from '@shared/types';

/**
 * Repository for handling admin-related database operations
 */
export class AdminRepository {
  /**
   * Create a new admin invite code
   */
  static async createInviteCode(data: InsertAdminInviteCode) {
    const [invite] = await db
      .insert(adminInviteCodes)
      .values(data)
      .returning();
    
    return invite;
  }

  /**
   * Verify and use an admin invite code
   */
  static async useInviteCode(code: string, userId: number) {
    const [invite] = await db
      .select()
      .from(adminInviteCodes)
      .where(
        and(
          eq(adminInviteCodes.code, code),
          eq(adminInviteCodes.used, false)
        )
      )
      .limit(1);

    if (!invite) {
      throw new Error('Invalid or used invite code');
    }

    const [usedInvite] = await db
      .update(adminInviteCodes)
      .set({ 
        used: true,
        usedBy: userId,
        usedAt: new Date()
      })
      .where(eq(adminInviteCodes.id, invite.id))
      .returning();

    return usedInvite;
  }

  /**
   * Get admin dashboard statistics
   */
  static async getStats() {
    const stats = await db.transaction(async (tx: any) => {
      const [userStats] = await tx
        .select({
          totalUsers: sql<number>`count(*)`,
          totalCandidates: sql<number>`sum(case when role = 'candidate' then 1 else 0 end)`,
          totalEmployers: sql<number>`sum(case when role = 'employer' then 1 else 0 end)`
        })
        .from(users);

      const [verificationStats] = await tx
        .select({
          pendingCandidates: sql<number>`count(*)`,
        })
        .from(candidates)
        .where(eq(candidates.profileStatus, 'pending'));

      const [employerStats] = await tx
        .select({
          pendingEmployers: sql<number>`count(*)`
        })
        .from(employers)
        .where(eq(employers.profileStatus, 'pending'));

      const [jobStats] = await tx
        .select({
          totalJobs: sql<number>`count(*)`,
          activeJobs: sql<number>`sum(case when job_status = 'ACTIVE' then 1 else 0 end)`
        })
        .from(jobPosts)
        .where(eq(jobPosts.deleted, false));

      return {
        users: userStats,
        verifications: {
          pendingCandidates: verificationStats.pendingCandidates,
          pendingEmployers: employerStats.pendingEmployers
        },
        jobs: jobStats
      };
    });

    return stats;
  }

  /**
   * Search across all entities (candidates, employers, jobs)
   */
  static async search(query: string, type?: 'candidate' | 'employer' | 'job'): Promise<any> {
    // Implementation depends on your search requirements
    // This is a basic example
    if (type === 'candidate') {
      const results = await db
        .select()
        .from(candidates)
        .innerJoin(users, eq(users.id, candidates.userId))
        .where(sql`to_tsvector('english', ${users.name}) @@ plainto_tsquery('english', ${query})`);

      return results.map((r: any) => ({ ...r, type: 'candidate' }));
    }

    if (type === 'employer') {
      const results = await db
        .select()
        .from(employers)
        .where(sql`to_tsvector('english', organization_name) @@ plainto_tsquery('english', ${query})`);

      return results.map((r: any) => ({ ...r, type: 'employer' }));
    }

    if (type === 'job') {
      const results = await db
        .select()
        .from(jobPosts)
        .where(
          and(
            sql`to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', ${query})`,
            eq(jobPosts.deleted, false)
          )
        );

      return results.map((r: any) => ({ ...r, type: 'job' }));
    }

    // Search all by default
    const results: any[] = await Promise.all([
      this.search(query, 'candidate'),
      this.search(query, 'employer'),
      this.search(query, 'job')
    ]);

    return {
      candidates: results[0],
      employers: results[1],
      jobs: results[2]
    };
  }
}
