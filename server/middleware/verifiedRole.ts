import { RequestHandler } from 'express';
import { authenticateUser } from './authenticate';
import { requireRole, ensureProfileVerified } from './authorization';

export function requireVerifiedRole(role: 'candidate' | 'employer'): RequestHandler[] {
  return [authenticateUser, requireRole(role), ensureProfileVerified(role)];
}
