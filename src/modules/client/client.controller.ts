import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { ok, created } from '../../utils/response';
import { analyzeAssessment } from '../../engine/scoring';
import { QUESTIONS } from '../../data/questions';
import { ROISettings } from '../../types';

const DEFAULT_ROI: ROISettings = {
  engineersCount: 5,
  workingDaysPerWeek: 5,
  savingRate: 0.35,
  hourlyCost: 75,
  overheadMultiplier: 1.3,
  currency: 'SAR',
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      name,
      companySize,
      city,
      contactName,
      contactEmail,
      contactPhone,
      emirateRegistration,
      industry,
    } = req.body;

    // Create company + contact + blank assessment atomically
    const company = await prisma.company.create({
      data: {
        name,
        companySize,
        city,
        emirateRegistration,
        industry,
        contactPerson: {
          create: {
            name: contactName,
            jobTitle: 'Contact',
            email: contactEmail,
            phone: contactPhone,
            preferredContactMethod: 'EMAIL',
          },
        },
        assessments: {
          create: {
            status: 'draft',
            roiSettings: DEFAULT_ROI,
          },
        },
      },
      include: {
        assessments: { select: { id: true } },
      },
    });

    const assessmentId = company.assessments[0].id;

    created(res, { companyId: company.id, assessmentId });
  } catch (err) {
    next(err);
  }
}

export async function getAssessmentStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        company: { select: { id: true, name: true, companySize: true } },
        respondents: { include: { answers: true } },
      },
    });

    if (!assessment) throw new AppError(404, 'Assessment not found');

    ok(res, {
      assessment,
      questions: QUESTIONS,
      defaultRoiSettings: assessment.roiSettings ?? DEFAULT_ROI,
    });
  } catch (err) {
    next(err);
  }
}

export async function submitAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
    });

    if (!assessment) throw new AppError(404, 'Assessment not found');
    if (assessment.status === 'completed') {
      throw new AppError(400, 'Assessment already completed');
    }

    const { respondents, roiSettings } = req.body as {
      respondents: Array<{
        role: string;
        name: string;
        answers: Array<{
          questionId: string;
          value: string | string[] | number | null;
          evidenceNote?: string;
          evidenceRef?: string;
          skipped?: boolean;
        }>;
        completedAt?: string;
      }>;
      roiSettings: ROISettings;
    };

    // Persist respondents + answers
    await prisma.respondent.deleteMany({ where: { assessmentId: assessment.id } });

    for (const r of respondents) {
      const respondent = await prisma.respondent.create({
        data: {
          assessmentId: assessment.id,
          role: r.role,
          name: r.name,
          completedAt: r.completedAt ? new Date(r.completedAt) : null,
          answers: {
            create: r.answers.map(a => ({
              questionId: a.questionId,
              value: a.value as string,
              evidenceNote: a.evidenceNote,
              evidenceRef: a.evidenceRef,
            })),
          },
        },
      });
    }

    // Update ROI settings
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { roiSettings, status: 'completed', completedAt: new Date() },
    });

    // Generate report immediately
    const fullAssessment = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: { respondents: { include: { answers: true } } },
    });

    const result = analyzeAssessment({
      respondents: fullAssessment!.respondents.map(r => ({
        id: r.id,
        role: r.role,
        name: r.name,
        answers: r.answers.map(a => ({
          questionId: a.questionId,
          value: a.value as string | string[] | number | null,
        })),
      })),
      roiSettings,
    });

    await prisma.assessmentReport.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        axisScores: result.axisScores,
        aggregateScore: result.aggregateScore,
        painSignals: result.painSignals,
        roi: result.roi,
        risks: result.risks,
        backlog: result.backlog,
        quickWins: result.quickWins,
        quickWinsAR: result.quickWinsAR,
        aiOpportunities: result.aiOpportunities,
        aiOpportunitiesAR: result.aiOpportunitiesAR,
        dna: result.dna,
        generatedBy: 'client-submit',
      },
      update: {
        axisScores: result.axisScores,
        aggregateScore: result.aggregateScore,
        painSignals: result.painSignals,
        roi: result.roi,
        risks: result.risks,
        backlog: result.backlog,
        quickWins: result.quickWins,
        quickWinsAR: result.quickWinsAR,
        aiOpportunities: result.aiOpportunities,
        aiOpportunitiesAR: result.aiOpportunitiesAR,
        dna: result.dna,
        generatedBy: 'client-submit',
      },
    });

    ok(res, {
      assessmentId: assessment.id,
      reportUrl: `/api/admin/reports/${assessment.id}`,
      estimatedGenerationTime: 0,
      result,
    });
  } catch (err) {
    next(err);
  }
}
