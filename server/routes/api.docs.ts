import { Router } from 'express';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *         - role
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [candidate, employer, admin]
 *     
 *     JobPost:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         location:
 *           type: string
 *     
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         code:
 *           type: string
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 *   - name: Jobs
 *     description: Job posting related endpoints
 *   - name: Candidates
 *     description: Candidate related endpoints
 *   - name: Employers
 *     description: Employer related endpoints
 *   - name: Admin
 *     description: Admin only endpoints
 */

export const apiRouter = Router();
