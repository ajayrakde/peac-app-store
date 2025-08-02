import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export function requireRole(role: string) {
  return async (req: Request & { user?: any; dbUser?: any }, res: Response, next: NextFunction) => {
    try {
      const firebaseUser = (req as any).user;
      if (!firebaseUser) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const dbUser = await storage.getUserByFirebaseUid(firebaseUser.uid);
      if (!dbUser || dbUser.role !== role) {
        return res.status(403).json({ message: 'Access denied' });
      }
      (req as any).dbUser = dbUser;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Failed to verify user role' });
    }
  };
}

export function ensureProfileVerified(type: 'candidate' | 'employer') {
  return async (
    req: Request & { dbUser?: any; candidate?: any; employer?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = (req as any).dbUser;
      if (!user) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (type === 'candidate') {
        const candidate = await storage.getCandidateByUserId(user.id);
        if (!candidate || candidate.deleted) {
          return res.status(404).json({ message: 'Candidate profile not found' });
        }
        if (candidate.profileStatus === 'incomplete') {
          return res.status(403).json({ message: 'Candidate profile incomplete' });
        }
        (req as any).candidate = candidate;
      } else {
        const employer = await storage.getEmployerByUserId(user.id);
        if (!employer || employer.deleted) {
          return res.status(404).json({ message: 'Employer profile not found' });
        }
        if (employer.profileStatus === 'incomplete') {
          return res.status(403).json({ message: 'Employer not verified' });
        }
        (req as any).employer = employer;
      }
      next();
    } catch (error) {
      console.error('Profile verification error:', error);
      res.status(500).json({ message: 'Failed to verify profile' });
    }
  };
}
