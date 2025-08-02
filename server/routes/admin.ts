import { Router } from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { asyncHandler } from '../utils/asyncHandler';
import { validateQuery } from '../middleware/validation';
import { z } from 'zod';
import { AdminRepository } from '../repositories';
import { JobRepository } from '../repositories/JobRepository';
import { generateJobCode } from '../utils/jobCodeGenerator';
import { calculateMatchScore } from '../utils/matchingEngine';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { storage } from '../storage';
import { insertShortlistSchema, insertJobPostSchema } from '@shared/zod';
import type { InsertJobPost } from '@shared/types';
import { verifyFirebaseToken } from '../utils/firebase-admin';
import { isValidTransition, canPerformAction } from '@shared/utils/jobStatus';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { fileStorage } from '../fileStorage';
import { env } from '../config/env';

// Validation schemas
const searchQuerySchema = z.object({
  type: z.enum(['candidate', 'employer', 'job']).optional(),
  q: z.string().optional(),
  sort: z.enum(['latest', 'relevance']).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

const upload = multer({ limits: { fileSize: (parseInt(env.MAX_FILE_SIZE_MB || '5') * 1024 * 1024) } });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

export const adminRouter = Router();

/**
 * @swagger
 * /api/admin/search:
 *   get:
 *     summary: Search across candidates, employers, and jobs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
adminRouter.get(
  '/search',
  authenticateUser,
  requireRole('admin'),
  validateQuery(searchQuerySchema),
  asyncHandler(async (req, res) => {
    const { type, q = '', sort = 'latest', page = 1, limit = 20 } = req.query;
    const results = await AdminRepository.search(
      q as string,
      type as 'candidate' | 'employer' | 'job' | undefined
    );
    res.json(results);
  })
);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
adminRouter.get(
  '/stats',
  authenticateUser,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const stats = await AdminRepository.getStats();
    res.json(stats);
  })
);

adminRouter.get('/jobs', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobs = await storage.getActiveJobPosts();
  res.json(jobs);
}));

adminRouter.post('/jobs', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobData = insertJobPostSchema.parse({
    ...req.body,
    jobCode: generateJobCode(),
    jobStatus: req.body.jobStatus ?? 'PENDING',
  }) as InsertJobPost;
  const employer = await storage.getEmployer(jobData.employerId);
  if (!employer || employer.profileStatus !== 'verified') {
    return res.status(400).json({ message: 'Employer not verified' });
  }
  const jobPost = await JobRepository.createJobPost(jobData);
  res.status(201).json(jobPost);
}));

/**
 * @swagger
 * /api/admin/jobs/{id}:
 *   get:
 *     summary: Get a job post by id
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Job post retrieved
 *       404:
 *         description: Job not found
 */
adminRouter.get('/jobs/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.id);
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  res.json(job);
}));

adminRouter.put('/jobs/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.id);
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (!canPerformAction('admin', job.jobStatus as any, 'edit', job.deleted)) {
    return res.status(400).json({ message: 'Cannot edit a deleted job post' });
  }
  const updateData = insertJobPostSchema.partial().parse(req.body) as Partial<InsertJobPost>;
  const updatedJob = await storage.updateJobPost(jobId, updateData);
  res.json(updatedJob);
}));

adminRouter.patch('/jobs/:id/fulfill', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.id);
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (!canPerformAction('admin', job.jobStatus as any, 'fulfill', job.deleted)) {
    return res.status(400).json({ message: 'Invalid status transition' });
  }
  if (!isValidTransition(job.jobStatus as any, 'FULFILLED', job.deleted)) {
    return res.status(400).json({ message: 'Invalid status transition' });
  }
  const fulfilledJob = await storage.markJobAsFulfilled(jobId);
  res.json(fulfilledJob);
}));

adminRouter.post('/jobs/:id/clone', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.id);
  const { employerId } = req.body;
  if (!employerId) {
    return res.status(400).json({ message: 'Missing employerId' });
  }
  const employer = await storage.getEmployer(employerId);
  if (!employer || employer.profileStatus !== 'verified') {
    return res.status(400).json({ message: 'Employer not verified' });
  }
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (!canPerformAction('admin', job.jobStatus as any, 'clone', job.deleted)) {
    return res.status(400).json({ message: 'Cannot clone deleted job' });
  }
  const jobCode = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const cloneData = { ...job, title: `Copy of ${job.title}`, employerId: employer.id, jobCode, jobStatus: 'PENDING' } as InsertJobPost;
  const clonedJob = await JobRepository.createJobPost(cloneData);
  res.json(clonedJob);
}));

/**
 * @swagger
 * /api/admin/jobs/{id}/applications:
 *   get:
 *     summary: Get applications for a job post
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of applications
 *       404:
 *         description: Job not found
 */
adminRouter.get('/jobs/:id/applications', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.id);
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  const applications = await storage.getApplicationsByJob(jobId);
  res.json(applications);
}));

adminRouter.get('/unverified-employers', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employers = await storage.getUnverifiedEmployers();
  res.json(employers);
}));

adminRouter.get('/employers/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.getEmployer(id);
  if (!employer) {
    return res.status(404).json({ message: 'Employer not found' });
  }
  res.json(employer);
}));

adminRouter.get('/employers/:id/documents/:docKey', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const key = req.params.docKey;
  const employer = await storage.getEmployer(id);
  if (!employer) {
    return res.status(404).json({ message: 'Employer not found' });
  }

  const empUser = await storage.getUser(employer.userId);
  if (!empUser?.firebaseUid) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const filename = req.query.filename as string | undefined;
  const docs = await fileStorage.listDocuments('employer', empUser.firebaseUid);
  const doc = docs.find(d => d.type === key && (!filename || d.filename === filename));
  if (!doc) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const file = await fileStorage.downloadDocument('employer', empUser.firebaseUid, key, doc.filename);
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
  res.send(file.data);
}));

adminRouter.get('/unverified-candidates', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidates = await storage.getUnverifiedCandidates();
  res.json(candidates);
}));

// Handler reused by verification endpoints
const verificationHandler = asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const type = req.params.type;
  if (type === 'candidate') {
    return res.json(await storage.getUnverifiedCandidates());
  }
  if (type === 'employer') {
    return res.json(await storage.getUnverifiedEmployers());
  }
  if (type === 'job') {
    return res.json(await storage.getInactiveJobPosts());
  }
  res.status(400).json({ message: 'Invalid type' });
});

// Static routes for each verification type
adminRouter.get(
  '/verifications/candidate',
  authenticateUser,
  (req, _res, next) => {
    req.params.type = 'candidate';
    next();
  },
  verificationHandler
);

adminRouter.get(
  '/verifications/employer',
  authenticateUser,
  (req, _res, next) => {
    req.params.type = 'employer';
    next();
  },
  verificationHandler
);

adminRouter.get(
  '/verifications/job',
  authenticateUser,
  (req, _res, next) => {
    req.params.type = 'job';
    next();
  },
  verificationHandler
);

// Unified endpoint for admin verifications (kept for backward compatibility)
adminRouter.get('/verifications/:type', authenticateUser, verificationHandler);

adminRouter.patch('/employers/:id/verify', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.verifyEmployer(id);
  res.json(employer);
}));

adminRouter.patch('/employers/:id/approve', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.verifyEmployer(id);
  res.json(employer);
}));

adminRouter.patch('/employers/:id/reject', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.rejectEmployer(id);
  res.json(employer);
}));

adminRouter.patch('/employers/:id/hold', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.holdEmployer(id);
  res.json(employer);
}));

adminRouter.patch('/candidates/:id/verify', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.verifyCandidate(id);
  res.json(candidate);
}));

adminRouter.patch('/candidates/:id/approve', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.verifyCandidate(id);
  res.json(candidate);
}));

adminRouter.patch('/candidates/:id/reject', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.rejectCandidate(id);
  res.json(candidate);
}));

adminRouter.patch('/candidates/:id/hold', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.holdCandidate(id);
  res.json(candidate);
}));

adminRouter.delete('/employers/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.softDeleteEmployer(id);
  res.json(employer);
}));

adminRouter.delete('/candidates/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.softDeleteCandidate(id);
  res.json(candidate);
}));

adminRouter.delete('/jobs/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const job = await storage.getJobPost(id);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.deleted) {
    return res.status(400).json({ message: 'Cannot edit a deleted job post' });
  }
  const deletedJob = await storage.softDeleteJobPost(id);
  res.json(deletedJob);
}));

adminRouter.patch('/jobs/:id/approve', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const job = await storage.getJobPost(id);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (!canPerformAction('admin', job.jobStatus as any, 'activate', job.deleted)) {
    return res.status(400).json({ message: 'Invalid status transition' });
  }
  if (!isValidTransition(job.jobStatus as any, 'ACTIVE', job.deleted)) {
    return res.status(400).json({ message: 'Invalid status transition' });
  }
  const updated = await storage.approveJob(id);
  res.json(updated);
}));

adminRouter.patch('/jobs/:id/reject', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const job = await storage.getJobPost(id);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (!canPerformAction('admin', job.jobStatus as any, 'delete', job.deleted)) {
    return res.status(400).json({ message: 'Invalid status transition' });
  }
  if (!isValidTransition(job.jobStatus as any, 'PENDING', job.deleted)) {
    return res.status(400).json({ message: 'Invalid status transition' });
  }
  const deleted = await storage.softDeleteJobPost(id);
  res.json(deleted);
}));

adminRouter.patch('/jobs/:id/hold', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const job = await storage.getJobPost(id);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (!canPerformAction('admin', job.jobStatus as any, 'hold', job.deleted)) {
    return res.status(400).json({ message: 'Invalid status transition' });
  }
  if (!isValidTransition(job.jobStatus as any, 'ON_HOLD', job.deleted)) {
    return res.status(400).json({ message: 'Invalid status transition' });
  }
  const updated = await storage.holdJob(id);
  res.json(updated);
}));

adminRouter.get('/candidates', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidates = await storage.getAllCandidates();
  res.json(candidates);
}));

adminRouter.get('/active-candidates', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidates = await storage.getMostActiveCandidates(10);
  res.json(candidates);
}));

adminRouter.get('/candidates/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.getCandidate(id);
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }
  res.json(candidate);
}));

adminRouter.get('/candidates/:id/documents/:docKey', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const key = req.params.docKey;
  const candidate = await storage.getCandidate(id);
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  const candUser = await storage.getUser(candidate.userId);
  if (!candUser?.firebaseUid) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const filename = req.query.filename as string | undefined;
  const docs = await fileStorage.listDocuments('candidate', candUser.firebaseUid);
  const doc = docs.find(d => d.type === key && (!filename || d.filename === filename));
  if (!doc) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const file = await fileStorage.downloadDocument('candidate', candUser.firebaseUid, key, doc.filename);
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
  res.send(file.data);
}));

adminRouter.get('/jobs/:jobId/matches', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.jobId);
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  const candidates = await storage.getAllCandidates();
  const matches = candidates.map(candidate => ({
      candidateId: candidate.id,
      candidate,
      score: calculateMatchScore(job, candidate),
      skillsMatch: Array.isArray(candidate.skills)
        ? (candidate.skills as string[]).map(skill => ({
            name: skill,
            matches: Array.isArray(job.skills) ? (job.skills as string[]).includes(skill) : false,
          }))
        : [],
      experienceMatch: true,
      salaryMatch: true,
    })).sort((a, b) => b.score - a.score).slice(0, 10);
  res.json(matches);
}));

adminRouter.get('/candidates/:candidateId/matches', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidateId = parseInt(req.params.candidateId);
  const candidate = await storage.getCandidate(candidateId);
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }
  const jobs = await storage.getAllJobPosts();
  const matches = jobs.map(job => ({
    jobId: job.id,
    job,
    score: calculateMatchScore(job, candidate),
  })).sort((a, b) => b.score - a.score).slice(0, 10);
  res.json(matches);
}));

adminRouter.post('/shortlist', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const shortlistData = insertShortlistSchema.parse({ ...req.body, shortlistedBy: user.id });
  const shortlist = await storage.createShortlist(shortlistData);
  res.json(shortlist);
}));

adminRouter.get('/export/excel', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const data = await storage.getExportData();
  const buffer = await exportToExcel(data);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=lokaltalent-data.xlsx');
  res.send(buffer);
}));

adminRouter.get('/export/pdf', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const data = await storage.getExportData();
  const buffer = await exportToPDF(data);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=lokaltalent-report.pdf');
  res.send(buffer);
}));

adminRouter.post('/login', asyncHandler(async (req, res) => {
  const { firebaseToken } = req.body;
  if (!firebaseToken) {
    return res.status(400).json({ message: 'Missing Firebase token' });
  }
  const decodedToken = await verifyFirebaseToken(firebaseToken);
  const user = await storage.getUserByFirebaseUid(decodedToken.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: not an admin' });
  }
  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}));

// ----- Document management -----
adminRouter.post(
  '/candidates/:uid/documents/:type',
  authenticateUser,
  requireRole('admin'),
  uploadLimiter,
  upload.single('file'),
  asyncHandler(async (req: any, res) => {
    const { uid, type } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Unsupported file type' });
    }
    const result = await fileStorage.uploadDocument('candidate', uid, type, file.buffer, file.mimetype, file.originalname);
    res.json({ success: true, document: result });
  })
);

adminRouter.get(
  '/candidates/:uid/documents/:type',
  authenticateUser,
  requireRole('admin'),
  asyncHandler(async (req: any, res) => {
    const { uid, type } = req.params;
    const docs = await fileStorage.listDocuments('candidate', uid);
    const doc = docs.find(d => d.type === type);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    const file = await fileStorage.downloadDocument('candidate', uid, type, doc.filename);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.send(file.data);
  })
);

adminRouter.get(
  '/candidates/:uid/documents',
  authenticateUser,
  requireRole('admin'),
  asyncHandler(async (req: any, res) => {
    const docs = await fileStorage.listDocuments('candidate', req.params.uid);
    res.json({ documents: docs });
  })
);

adminRouter.post(
  '/employers/:uid/documents/:type',
  authenticateUser,
  requireRole('admin'),
  uploadLimiter,
  upload.single('file'),
  asyncHandler(async (req: any, res) => {
    const { uid, type } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!req.file.mimetype.startsWith('image/') && req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Unsupported file type' });
    }
    const result = await fileStorage.uploadDocument('employer', uid, type, req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json({ success: true, document: result });
  })
);

adminRouter.get(
  '/employers/:uid/documents/:type',
  authenticateUser,
  requireRole('admin'),
  asyncHandler(async (req: any, res) => {
    const { uid, type } = req.params;
    const docs = await fileStorage.listDocuments('employer', uid);
    const doc = docs.find(d => d.type === type);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    const file = await fileStorage.downloadDocument('employer', uid, type, doc.filename);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.send(file.data);
  })
);

adminRouter.get(
  '/employers/:uid/documents',
  authenticateUser,
  requireRole('admin'),
  asyncHandler(async (req: any, res) => {
    const docs = await fileStorage.listDocuments('employer', req.params.uid);
    res.json({ documents: docs });
  })
);
