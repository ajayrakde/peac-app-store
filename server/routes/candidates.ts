import { Router } from 'express';
import { insertCandidateSchema } from '@shared/zod';
import type { InsertCandidate } from '@shared/types';
import { requireVerifiedRole } from '../middleware/verifiedRole';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validation';
import { CandidateRepository } from '../repositories';
import { storage } from '../storage';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { fileStorage } from '../fileStorage';
import { env } from '../config/env';

export const candidatesRouter = Router();

candidatesRouter.get(
  '/profile',
  authenticateUser,
  requireRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const user = req.dbUser;
    const candidate = await storage.getCandidateByUserId(user.id);
    if (!candidate || candidate.deleted) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    res.json(candidate);
  })
);

candidatesRouter.patch(
  '/:id',
  authenticateUser,
  requireRole('candidate'),
  validateBody(insertCandidateSchema.partial()),
  asyncHandler(async (req: any, res) => {
    const user = req.dbUser;
    const candidate = await CandidateRepository.findByUserId(user.id);
    if (!candidate || candidate.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (candidate.profileStatus === 'pending') {
      return res.status(403).json({ message: 'Profile is pending review and cannot be edited' });
    }
    const updates = { ...req.body };
    if (candidate.profileStatus === 'verified') {
      (updates as any).profileStatus = 'pending';
    }
    const updatedCandidate = await CandidateRepository.update(candidate.id, updates);
    res.json(updatedCandidate);
  })
);

candidatesRouter.post(
  '/',
  authenticateUser,
  requireRole('candidate'),
  validateBody(insertCandidateSchema),
  asyncHandler(async (req: any, res) => {
    const user = req.dbUser;
    const candidateData: InsertCandidate = {
      ...req.body,
      userId: user.id,
    } as InsertCandidate;
    const candidate = await storage.createCandidate(candidateData);
    res.json(candidate);
  })
);

candidatesRouter.get(
  '/stats',
  ...requireVerifiedRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const candidate = req.candidate;
    const stats = await storage.getCandidateStats(candidate.id);
    res.json(stats);
  })
);

candidatesRouter.get(
  '/recommended-jobs',
  ...requireVerifiedRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const candidate = req.candidate;
    const jobs = await storage.getRecommendedJobs(candidate.id);
    res.json(jobs);
  })
);

candidatesRouter.get(
  '/applications',
  ...requireVerifiedRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const candidate = req.candidate;
    const applications = await storage.getCandidateApplications(candidate.id);
    res.json(applications);
  })
);

// Public job listings
candidatesRouter.get(
  '/jobs',
  asyncHandler(async (_req, res) => {
    const jobs = await storage.getPublicJobPosts();
    const sanitizedJobs = jobs.map(({ employerId, ...rest }: any) => rest);
    res.json(sanitizedJobs);
  })
);

// Candidate view of a job detail (without employer info or vacancy)
candidatesRouter.get(
  '/jobs/:id',
  ...requireVerifiedRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || job.deleted || job.jobStatus !== 'ACTIVE') {
      return res.status(404).json({ message: 'Job not found' });
    }
    const { employerId, vacancy, ...rest } = job as any;
    res.json(rest);
  })
);

// Submit application for a job
candidatesRouter.post(
  '/jobs/:id/apply',
  ...requireVerifiedRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const jobId = parseInt(req.params.id);
    const candidate = req.candidate;
    const existing = await storage.getApplicationForCandidateJob(
      candidate.id,
      jobId
    );
    if (existing) {
      return res.status(400).json({ message: 'Already applied' });
    }

    const application = await storage.createApplication({
      jobPostId: jobId,
      candidateId: candidate.id,
    });
    res.json(application);
  })
);

// ----- Document management -----
const upload = multer({ limits: { fileSize: (parseInt(env.MAX_FILE_SIZE_MB || '5') * 1024 * 1024) } });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

const allowedDocs = ['aadhar', 'pan', 'resume', 'certificates'];

candidatesRouter.post(
  '/documents/certificates',
  authenticateUser,
  requireRole('candidate'),
  uploadLimiter,
  upload.array('files'),
  asyncHandler(async (req: any, res) => {
    const user = req.user;
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
    if (files.some(f => !f.mimetype.startsWith('image/') && f.mimetype !== 'application/pdf')) {
      return res.status(400).json({ message: 'Unsupported file type' });
    }
    const results = await fileStorage.uploadMultiple!('candidate', user.uid, 'certificates', files.map(f => ({ buffer: f.buffer, mimetype: f.mimetype, originalname: f.originalname })));
    res.json({ success: true, documents: results.map(r => ({ filename: r.filename, uploadedAt: r.uploadedAt })) });
  })
);

candidatesRouter.post(
  '/documents/:type',
  authenticateUser,
  requireRole('candidate'),
  uploadLimiter,
  upload.single('file'),
  asyncHandler(async (req: any, res) => {
    const { type } = req.params;
    if (!allowedDocs.includes(type)) return res.status(400).json({ message: 'Invalid document type' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!req.file.mimetype.startsWith('image/') && req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Unsupported file type' });
    }
    if (type === 'certificates') return res.status(400).json({ message: 'Use certificates endpoint' });
    const result = await fileStorage.uploadDocument('candidate', req.user.uid, type, req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json({ success: true, document: result });
  })
);

candidatesRouter.get(
  '/documents',
  authenticateUser,
  requireRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const docs = await fileStorage.listDocuments('candidate', req.user.uid);
    res.json({ documents: docs });
  })
);

candidatesRouter.get(
  '/documents/:type',
  authenticateUser,
  requireRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const { type } = req.params;
    const filename = req.query.filename as string | undefined;
    const docs = await fileStorage.listDocuments('candidate', req.user.uid);
    const doc = docs.find(d => d.type === type && (!filename || d.filename === filename));
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    const file = await fileStorage.downloadDocument('candidate', req.user.uid, type, doc.filename);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.send(file.data);
  })
);
