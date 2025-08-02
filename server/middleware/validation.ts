import { type Request, type Response, type NextFunction } from 'express';
import { type AnyZodObject, ZodError } from 'zod';

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateBody = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation failed',
          errors: error.errors
        });
      } else {
        next(error);
      }
    }
  };

/**
 * Middleware to validate request query parameters against a Zod schema
 */
export const validateQuery = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Invalid query parameters',
          errors: error.errors
        });
      } else {
        next(error);
      }
    }
  };

/**
 * Middleware to validate request parameters against a Zod schema
 */
export const validateParams = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Invalid parameters',
          errors: error.errors
        });
      } else {
        next(error);
      }
    }
  };
