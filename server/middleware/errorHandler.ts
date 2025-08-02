import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  // Ensure we don't send HTML for errors
  res.setHeader('Content-Type', 'application/json');

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }

  // Default error response
  const env = process.env.NODE_ENV?.toLowerCase();
  res.status(500).json({
    error: 'Internal Server Error',
    message: env === 'development' ? err.message : 'An unexpected error occurred'
  });
}
