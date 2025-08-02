import cron from 'node-cron';
import { db } from '../db';
import { jobPosts } from '@shared/schema';
import { and, eq, lt } from 'drizzle-orm';

export function scheduleDeactivateOldPostsJob() {
  cron.schedule('0 0 * * *', async () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await db
      .update(jobPosts)
      .set({ jobStatus: 'DORMANT', updatedAt: new Date() })
      .where(
        and(
          lt(jobPosts.createdAt, ninetyDaysAgo),
          eq(jobPosts.jobStatus, 'ACTIVE'),
          eq(jobPosts.deleted, false)
        )
      );
  });
}
