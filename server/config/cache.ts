import { env } from './env';

interface CacheConfig {
  enabled: boolean;
  ttl: number; // in seconds
  minimumRecords: number; // minimum number of records before caching kicks in
}

interface SearchCacheConfig extends CacheConfig {
  candidates: CacheConfig;
  employers: CacheConfig;
  jobs: CacheConfig;
}

export const cacheConfig: SearchCacheConfig = {
  enabled: env.CACHE_ENABLED === 'true',
  ttl: parseInt(env.CACHE_TTL || '900'), // 15 minutes default
  minimumRecords: parseInt(env.CACHE_MIN_RECORDS || '1000'),
  
  // Type-specific configurations
  candidates: {
    enabled: env.CACHE_CANDIDATES_ENABLED === 'true',
    ttl: parseInt(env.CACHE_CANDIDATES_TTL || '900'),
    minimumRecords: parseInt(env.CACHE_CANDIDATES_MIN_RECORDS || '1000'),
  },
  employers: {
    enabled: env.CACHE_EMPLOYERS_ENABLED === 'true',
    ttl: parseInt(env.CACHE_EMPLOYERS_TTL || '900'),
    minimumRecords: parseInt(env.CACHE_EMPLOYERS_MIN_RECORDS || '500'),
  },
  jobs: {
    enabled: env.CACHE_JOBS_ENABLED === 'true',
    ttl: parseInt(env.CACHE_JOBS_TTL || '900'),
    minimumRecords: parseInt(env.CACHE_JOBS_MIN_RECORDS || '1000'),
  },
};
