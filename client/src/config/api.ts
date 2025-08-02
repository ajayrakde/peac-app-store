/**
 * API Configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * API Endpoints
 */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
  },
  ADMIN: {
    SEARCH: '/api/admin/search',
    STATS: '/api/admin/stats',
    VERIFICATIONS: '/api/admin/verifications',
  },
  JOBS: {
    LIST: '/api/candidates/jobs',
    CREATE: '/api/employers/jobs',
    SEARCH: '/api/jobs/search',
  },
  EMPLOYERS: {
    PROFILE: '/api/employers/profile',
    JOBS: '/api/employers/jobs',
  },
  CANDIDATES: {
    PROFILE: '/api/candidates/profile',
    APPLICATIONS: '/api/candidates/applications',
  },
} as const;

/**
 * Default configuration options
 */
export const CONFIG = {
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const;
