import { z } from 'zod';

// ─── Shared ───────────────────────────────────────────────────────────────────

export const roiSettingsSchema = z.object({
  engineersCount: z.number().min(1),
  workingDaysPerWeek: z.number().min(1).max(7),
  savingRate: z.number().min(0).max(1),
  hourlyCost: z.number().min(0),
  overheadMultiplier: z.number().min(1),
  currency: z.literal('SAR'),
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Company ──────────────────────────────────────────────────────────────────

export const createCompanySchema = z.object({
  name: z.string().min(1),
  emirateRegistration: z.string().min(1),
  industry: z.string().min(1),
  companySize: z.enum(['<50', '50-200', '200+']),
  city: z.string().min(1),
  notes: z.string().optional(),
  contact: z.object({
    name: z.string().min(1),
    jobTitle: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    whatsapp: z.string().optional(),
    preferredContactMethod: z.enum(['EMAIL', 'PHONE', 'WHATSAPP']).default('EMAIL'),
    linkedinUrl: z.string().url().optional(),
  }).optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

// ─── Assessment ───────────────────────────────────────────────────────────────

export const createAssessmentSchema = z.object({
  companyId: z.string().uuid(),
  representativeId: z.string().uuid().optional(),
  projectName: z.string().optional(),
  roiSettings: roiSettingsSchema.default({
    engineersCount: 5,
    workingDaysPerWeek: 5,
    savingRate: 0.35,
    hourlyCost: 75,
    overheadMultiplier: 1.3,
    currency: 'SAR',
  }),
});

export const updateAssessmentSchema = z.object({
  status: z.enum(['draft', 'completed']).optional(),
  projectName: z.string().optional(),
  roiSettings: roiSettingsSchema.optional(),
  representativeId: z.string().uuid().optional(),
});

// ─── Respondent ───────────────────────────────────────────────────────────────

export const createRespondentSchema = z.object({
  role: z.enum(['Manager', 'Engineer', 'Finance', 'Operations']),
  name: z.string().min(1),
});

export const updateRespondentSchema = z.object({
  name: z.string().min(1).optional(),
  completedAt: z.string().datetime().optional(),
});

// ─── Answer ───────────────────────────────────────────────────────────────────

const answerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
  z.null(),
]);

export const answerItemSchema = z.object({
  questionId: z.string().min(1),
  value: answerValueSchema,
  evidenceNote: z.string().optional(),
  evidenceRef: z.string().optional(),
  skipped: z.boolean().optional(),
});

export const submitAnswersSchema = z.object({
  answers: z.array(answerItemSchema).min(1),
});

// ─── Representative ───────────────────────────────────────────────────────────

export const createRepSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  role: z.string().min(1),
});

export const updateRepSchema = createRepSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ─── Meeting ──────────────────────────────────────────────────────────────────

export const createMeetingSchema = z.object({
  companyId: z.string().uuid(),
  representativeId: z.string().uuid(),
  meetingDate: z.string().datetime(),
  meetingType: z.enum(['DISCOVERY', 'ASSESSMENT', 'FOLLOWUP', 'PRESENTATION']),
  attendees: z.array(z.string()),
  notes: z.string().min(1),
  nextSteps: z.string().min(1),
});

// ─── Client registration ──────────────────────────────────────────────────────

export const clientRegisterSchema = z.object({
  name: z.string().min(1),
  companySize: z.enum(['<50', '50-200', '200+']),
  city: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  emirateRegistration: z.string().min(1),
  industry: z.string().default('Construction'),
});

export const clientSubmitSchema = z.object({
  respondents: z.array(z.object({
    role: z.enum(['Manager', 'Engineer', 'Finance', 'Operations']),
    name: z.string().min(1),
    answers: z.array(answerItemSchema),
    completedAt: z.string().datetime().optional(),
  })),
  roiSettings: roiSettingsSchema,
});
