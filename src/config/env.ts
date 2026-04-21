import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  FRONTEND_URL: z.string().default('http://localhost:5173').transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)).pipe(z.array(z.string().url()).min(1)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  ADMIN_EMAIL: z.string().email().default('admin@infraai.sa'),
  ADMIN_PASSWORD: z.string().min(8).default('TempPassword@123'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
