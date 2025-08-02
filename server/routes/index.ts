import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { authRouter } from './auth';
import { candidatesRouter } from './candidates';
import { employersRouter } from './employers';
import { adminRouter } from './admin';

export async function registerRoutes(app: Express): Promise<Server> {
  // JSON body parsing is already handled in the main server
  // so no need to register it here again. Avoid setting a
  // global Content-Type header to prevent static assets from
  // being served with the wrong MIME type.

  app.use('/api/auth', authRouter);
  app.use('/api/candidates', candidatesRouter);
  app.use('/api/employers', employersRouter);
  app.use('/api/admin', adminRouter);

  const httpServer = createServer(app);
  return httpServer;
}
