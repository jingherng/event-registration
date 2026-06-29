import { Request, Response, NextFunction } from 'express';
import { ValidationError, ClientError } from '../utils/errors';
import logger from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(421).json({ error: err.message });
    return;
  }
  if (err instanceof ClientError) {
    res.status(400).json({ error: err.message });
    return;
  }
  logger.error('Unexpected server error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
}
