import { cacheConfig } from '../config/cache';
import { env } from '../config/env';
import Redis from 'ioredis';
import { createHash } from 'crypto';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : 6379,
      password: env.REDIS_PASSWORD,
      lazyConnect: true,
    });
  }
  return redis;
}

interface CacheOptions {
  type?: 'candidate' | 'employer' | 'job';
}

function isEnabled(options?: CacheOptions): boolean {
  if (!cacheConfig.enabled) return false;
  if (!options?.type) return true;
  if (options.type === 'candidate') return cacheConfig.candidates.enabled;
  if (options.type === 'employer') return cacheConfig.employers.enabled;
  if (options.type === 'job') return cacheConfig.jobs.enabled;
  return true;
}

function getTTL(options?: CacheOptions): number {
  if (!options?.type) return cacheConfig.ttl;
  if (options.type === 'candidate') return cacheConfig.candidates.ttl;
  if (options.type === 'employer') return cacheConfig.employers.ttl;
  if (options.type === 'job') return cacheConfig.jobs.ttl;
  return cacheConfig.ttl;
}

export async function setCachedData(key: string, data: any, options?: CacheOptions): Promise<void> {
  if (!isEnabled(options)) return;
  const client = getRedis();
  const ttl = getTTL(options);
  try {
    await client.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (err) {
    console.error('Failed to set cache', err);
  }
}

export async function getCachedData<T>(key: string, options?: CacheOptions): Promise<T | null> {
  if (!isEnabled(options)) return null;
  const client = getRedis();
  try {
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error('Failed to get cache', err);
    return null;
  }
}

export function generateCacheKey(params: Record<string, any>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, any>>((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  const hash = createHash('sha1').update(JSON.stringify(sorted)).digest('hex');
  return `cache:${hash}`;
}
