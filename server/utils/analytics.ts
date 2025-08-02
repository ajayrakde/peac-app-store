import { db } from '../db';
import { searchAnalytics } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getCachedData, setCachedData } from './cache';

interface SearchAnalyticsData {
  userId: string;
  searchType: string;
  query: string;
  filters: Record<string, any>;
  resultCount: number;
  timestamp: Date;
}

export async function trackSearchQuery(data: SearchAnalyticsData): Promise<void> {
  try {
    await db.insert(searchAnalytics).values({
      userId: data.userId,
      searchType: data.searchType,
      query: data.query,
      filters: JSON.stringify(data.filters),
      resultCount: data.resultCount,
      timestamp: data.timestamp
    });

    // Update popular searches cache every 100 searches
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(searchAnalytics)
      .where(eq(searchAnalytics.searchType, data.searchType));

    if (count % 100 === 0) {
      await updatePopularSearchesCache(data.searchType);
    }
  } catch (error) {
    console.error('Failed to track search analytics:', error);
  }
}

export async function updatePopularSearchesCache(searchType: string): Promise<void> {
  const popularSearches = await db.query.searchAnalytics.findMany({
    where: eq(searchAnalytics.searchType, searchType),
    orderBy: desc(searchAnalytics.timestamp),
    limit: 100
  });

  // Group and count queries
  const queryGroups = popularSearches.reduce((acc: Record<string, number>, search: (typeof popularSearches)[number]) => {
    acc[search.query] = (acc[search.query] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort by frequency
  const sortedQueries = Object.entries(queryGroups)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([query]) => query);

  await setCachedData(`popular_searches:${searchType}`, sortedQueries);
}

export async function getPopularSearches(searchType: string): Promise<string[]> {
  const cached = await getCachedData<string[]>(`popular_searches:${searchType}`);
  if (cached) return cached;

  await updatePopularSearchesCache(searchType);
  return await getCachedData<string[]>(`popular_searches:${searchType}`) || [];
}
