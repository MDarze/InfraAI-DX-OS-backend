import 'dotenv/config';
import { env } from './config/env';
import app from './app';
import { prisma } from './config/db';

async function main() {
  await prisma.$connect();
  console.log('✅  Database connected');

  app.listen(env.PORT, () => {
    console.log(`🚀  InfraAI DX-OS backend running on http://localhost:${env.PORT}`);
    console.log(`    ENV: ${env.NODE_ENV}`);
  });
}

main().catch(err => {
  console.error('❌  Startup error:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
