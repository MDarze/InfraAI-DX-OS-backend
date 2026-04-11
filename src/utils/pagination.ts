import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export function getPaginationParams(query: Record<string, unknown>) {
  const { page, limit } = paginationSchema.parse(query);
  return { page, limit, skip: (page - 1) * limit };
}
