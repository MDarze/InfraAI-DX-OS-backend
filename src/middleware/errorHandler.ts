import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    const body: ApiResponse = {
      success: false,
      error: 'Validation error',
      data: err.flatten().fieldErrors,
    };
    return res.status(400).json(body);
  }

  if (err instanceof AppError) {
    const body: ApiResponse = { success: false, error: err.message };
    return res.status(err.statusCode).json(body);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${requestId}]`, err);
  }

  const body: ApiResponse = { success: false, error: 'Internal server error' };
  return res.status(500).json(body);
}
