import { Response } from 'express';
import { ApiResponse } from '../types';

export function ok<T>(res: Response, data: T, meta?: ApiResponse['meta'], status = 200) {
  const body: ApiResponse<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return res.status(status).json(body);
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, undefined, 201);
}

export function paginate<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return ok(res, data, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
