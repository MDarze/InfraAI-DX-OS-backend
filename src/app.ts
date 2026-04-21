import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { env } from './config/env';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';

import authRouter from './modules/auth/auth.router';
import companiesRouter from './modules/companies/companies.router';
import assessmentsRouter from './modules/assessments/assessments.router';
import respondentsRouter from './modules/respondents/respondents.router';
import answersRouter from './modules/answers/answers.router';
import reportsRouter from './modules/reports/reports.router';
import representativesRouter from './modules/representatives/representatives.router';
import meetingsRouter from './modules/meetings/meetings.router';
import dashboardRouter from './modules/dashboard/dashboard.router';
import clientRouter from './modules/client/client.router';

const app = express();
app.set('trust proxy', 1);
// ─── Security & parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(requestId);

// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms', {
      stream: { write: (msg: string) => process.stdout.write(msg) },
    }),
  );
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/admin/companies', companiesRouter);
app.use('/api/admin/assessments', assessmentsRouter);
app.use(
  '/api/admin/assessments/:assessmentId/respondents',
  respondentsRouter,
);
app.use(
  '/api/admin/respondents/:respondentId/answers',
  answersRouter,
);
app.use('/api/admin/reports', reportsRouter);
app.use('/api/admin/representatives', representativesRouter);
app.use('/api/admin/meetings', meetingsRouter);
app.use('/api/admin/dashboard', dashboardRouter);
app.use('/api/client', clientRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
