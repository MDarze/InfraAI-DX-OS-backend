# InfraAI DX-OS Backend

Production-ready Express.js + PostgreSQL + Prisma backend for the InfraAI Digital Transformation Assessment tool.

---

## Stack

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **Auth**: JWT (access + refresh tokens) + bcrypt
- **Validation**: Zod
- **API client**: Bruno collection included

---

## Quick Start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 16 (or use Docker Compose below)

### 2. Clone & install

```bash
cd InfraAI-DX-OS-backend
npm install
```

### 3. Environment

```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

### 4. Database (Docker option)

```bash
docker-compose up -d
# PostgreSQL on :5432, Adminer UI on :8080
```

Then update `.env`:
```
DATABASE_URL=postgresql://infraai:infraai_secret@localhost:5432/infraai
```

### 5. Run migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Seed data

```bash
npm run db:seed
```

Seeds:
- 3 admin users (SUPER_ADMIN, ADMIN, VIEWER)
- 3 representatives
- 3 companies (2 Construction, 1 Real Estate)
- 1 completed assessment with full report (Al-Bina Construction)
- 1 draft assessment (Najem Infrastructure)

### 7. Start dev server

```bash
npm run dev
# Runs on http://localhost:3001
```

---

## Login Credentials (after seed)

| Email | Password | Role |
|-------|----------|------|
| admin@infraai.sa | TempPassword@123 | SUPER_ADMIN |
| manager@infraai.sa | TempPassword@123 | ADMIN |
| viewer@infraai.sa | TempPassword@123 | VIEWER |

---

## API Reference

All responses use the envelope format:
```json
{ "success": true, "data": {}, "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 } }
```

All errors:
```json
{ "success": false, "error": "message" }
```

### Health Check

```
GET /health
```

---

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | — | Login with email + password → tokens |
| POST | `/refresh` | — | Rotate refresh token |
| POST | `/logout` | — | Invalidate refresh token |

**Login request:**
```json
{ "email": "admin@infraai.sa", "password": "TempPassword@123" }
```

**Login response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "uuid",
    "user": { "id": "...", "email": "...", "fullName": "...", "role": "SUPER_ADMIN" }
  }
}
```

Use `Authorization: Bearer <accessToken>` on all protected routes.

---

### Companies — `/api/admin/companies`

Requires JWT. All list endpoints support `?page=1&limit=20`.

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | VIEWER+ | List companies. Filters: `?search=`, `?city=`, `?companySize=` |
| GET | `/:id` | VIEWER+ | Company detail + last assessment + report |
| POST | `/` | ADMIN+ | Create company (+ optional contact person) |
| PATCH | `/:id` | ADMIN+ | Update company |
| DELETE | `/:id` | ADMIN+ | Soft delete |

**Create company body:**
```json
{
  "name": "Al-Bina Construction",
  "emirateRegistration": "SA-CON-001",
  "industry": "Construction",
  "companySize": "50-200",
  "city": "Riyadh",
  "contact": {
    "name": "Ahmed",
    "jobTitle": "Director",
    "email": "ahmed@albina.sa",
    "phone": "+966501234567",
    "preferredContactMethod": "EMAIL"
  }
}
```

---

### Assessments — `/api/admin/assessments`

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | VIEWER+ | List. Filters: `?companyId=`, `?status=`, `?from=`, `?to=` |
| GET | `/:id` | VIEWER+ | Full detail + respondents + answers + report |
| POST | `/` | ADMIN+ | Create blank assessment |
| PATCH | `/:id` | ADMIN+ | Update status / ROI settings |
| DELETE | `/:id` | ADMIN+ | Delete draft only |

---

### Respondents — `/api/admin/assessments/:assessmentId/respondents`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List respondents with answers |
| POST | `/` | Add respondent `{role, name}` |
| PATCH | `/:respondentId` | Update name / mark completed |
| DELETE | `/:respondentId` | Remove |

---

### Answers — `/api/admin/respondents/:respondentId/answers`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List answers for respondent |
| POST | `/` | Submit answer batch (upserts) |

**Submit answers body:**
```json
{
  "answers": [
    { "questionId": "p01", "value": "b", "evidenceNote": "Uses WhatsApp" },
    { "questionId": "d03", "value": 2 },
    { "questionId": "f06", "value": 25 }
  ]
}
```

---

### Reports — `/api/admin/reports`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all reports |
| GET | `/:assessmentId` | Get report for assessment |
| POST | `/:assessmentId/generate` | Run scoring engine → save report |

Report generation triggers the full scoring pipeline (axis scores, ROI, risks, backlog, quick wins, AI opportunities, DNA).

---

### Representatives — `/api/admin/representatives`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List reps + assessment count |
| POST | `/` | Create rep |
| PATCH | `/:id` | Update details |
| DELETE | `/:id` | Deactivate (SUPER_ADMIN only) |

---

### Meetings — `/api/admin/meetings`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Log meeting |
| GET | `/company/:companyId` | Meetings for company |
| GET | `/rep/:repId` | Meetings led by rep |

**Meeting types:** `DISCOVERY`, `ASSESSMENT`, `FOLLOWUP`, `PRESENTATION`

---

### Dashboard — `/api/admin/dashboard`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Aggregate stats: totals, avg score, by size/city, recent activity |

---

### Client (Public) — `/api/client`

No authentication required.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Self-register → returns `{companyId, assessmentId}` |
| GET | `/assessment/:id` | Get blank assessment + all questions |
| POST | `/assessment/:id/submit` | Submit completed assessment → generates report |

**Submit body:**
```json
{
  "respondents": [
    {
      "role": "Manager",
      "name": "Ahmed",
      "answers": [
        { "questionId": "p01", "value": "b" },
        { "questionId": "d03", "value": 2, "evidenceNote": "2 spreadsheets per day" }
      ],
      "completedAt": "2026-04-11T10:00:00Z"
    }
  ],
  "roiSettings": {
    "engineersCount": 5,
    "workingDaysPerWeek": 5,
    "savingRate": 0.35,
    "hourlyCost": 75,
    "overheadMultiplier": 1.3,
    "currency": "SAR"
  }
}
```

---

## Scoring Engine

Located in `src/engine/scoring.ts`. Ported from the frontend `scoring.ts` with identical logic.

**Input**: respondents + their answers + ROI settings
**Output** (matches frontend `AnalysisResult` interface):
- `axisScores[]` — weighted score per axis (0–5)
- `aggregateScore` — mean of all axis scores
- `painSignals[]` — 5 quantified inefficiency metrics
- `roi` — weekly/monthly/yearly savings
- `risks[]` — up to 6 risk items with probability/impact/mitigation
- `backlog[]` — 8 implementation epics
- `quickWins[]` / `quickWinsAR[]` — bilingual
- `aiOpportunities[]` / `aiOpportunitiesAR[]` — bilingual
- `dna` — decision / data / financial / governance maturity labels

---

## Project Structure

```
src/
  config/           db.ts, env.ts
  middleware/       auth.ts, errorHandler.ts, requestId.ts, validate.ts
  modules/
    auth/
    companies/
    assessments/
    respondents/
    answers/
    reports/
    representatives/
    meetings/
    dashboard/
    client/
  data/             questions.ts (copied from frontend)
  engine/           scoring.ts
  types/            index.ts (shared types), schemas.ts (Zod)
  utils/            response.ts, pagination.ts
  app.ts
  server.ts
prisma/
  schema.prisma
  seed.ts
bruno/              API collection
docker-compose.yml
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token secret (min 16 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `FRONTEND_URL` | CORS allowed origin (default: `http://localhost:5173`) |
| `PORT` | Server port (default: 3001) |
| `NODE_ENV` | `development` / `production` |
| `ADMIN_EMAIL` | Default super admin email |
| `ADMIN_PASSWORD` | Default super admin password |
