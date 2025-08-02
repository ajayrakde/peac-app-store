import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../utils/firebase-admin';

export async function authenticateUser(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken.email_verified) {
      return res.status(403).json({ message: 'Email not verified' });
    }
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}
