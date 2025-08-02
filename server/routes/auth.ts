import { Router } from 'express';
import { registerUserSchema } from '@shared/zod';
import type { InsertUser } from '@shared/types';
import { authenticateUser } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validation';
import { UserRepository, CandidateRepository, EmployerRepository } from '../repositories';

export const authRouter = Router();

authRouter.post('/register',
  validateBody(registerUserSchema),
  asyncHandler(async (req, res) => {
    const { password, ...userData } = req.body as any;
    
    const existingUserByUid = await UserRepository.findByFirebaseUid(userData.firebaseUid);
    if (existingUserByUid) {
      return res.json(existingUserByUid);
    }
    
    const existingUserByEmail = await UserRepository.findByEmail(userData.email);
    if (existingUserByEmail) {
      return res.status(409).json({ 
        message: 'Email already registered', 
        code: 'EMAIL_EXISTS' 
      });
    }
    
    const user = await UserRepository.create(userData);
    res.status(201).json(user);
  }));

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile with role-specific data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       404:
 *         description: User not found
 */
authRouter.get('/profile', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await UserRepository.findByFirebaseUid(req.user.uid);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  let profileData: any = { ...user };
  
  if (user.role === 'candidate') {
    const candidate = await CandidateRepository.findByUserId(user.id);
    profileData.candidate = candidate;
  } else if (user.role === 'employer') {
    const employer = await EmployerRepository.findByUserId(user.id);
    profileData.employer = employer;
  }
  
  res.json(profileData);
}));
