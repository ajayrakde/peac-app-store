import { Request, Response, NextFunction } from 'express';

export function responseWrapper(req: Request, res: Response, next: NextFunction) {
  // Ensure JSON content type for all responses
  res.setHeader('Content-Type', 'application/json');
  
  // Wrap the original json method to ensure consistent response format
  const originalJson = res.json;
  res.json = function(body: any) {
    if (res.statusCode >= 400) {
      return originalJson.call(this, {
        success: false,
        error: body.error || 'Unknown Error',
        message: body.message,
        details: body.details
      });
    }
    
    return originalJson.call(this, {
      success: true,
      data: body
    });
  };
  
  next();
}
