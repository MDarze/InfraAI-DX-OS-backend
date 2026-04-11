import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { ok, paginate } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import { analyzeAssessment } from '../../engine/scoring';
import { ROISettings } from '../../types';

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [total, reports] = await prisma.$transaction([
      prisma.assessmentReport.count(),
      prisma.assessmentReport.findMany({
        skip,
        take: limit,
        orderBy: { generatedAt: 'desc' },
        include: {
          assessment: {
            include: { company: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    paginate(res, reports, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await prisma.assessmentReport.findUnique({
      where: { assessmentId: req.params.assessmentId },
      include: {
        assessment: {
          include: {
            company: true,
            representative: true,
          },
        },
      },
    });

    if (!report) throw new AppError(404, 'Report not found');
    ok(res, report);
  } catch (err) {
    next(err);
  }
}

export async function generateReport(req: Request, res: Response, next: NextFunction) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.assessmentId },
      include: {
        respondents: { include: { answers: true } },
        representative: true,
      },
    });

    if (!assessment) throw new AppError(404, 'Assessment not found');

    // Build scoring input from DB records
    const scoringInput = {
      respondents: assessment.respondents.map(r => ({
        id: r.id,
        role: r.role,
        name: r.name,
        answers: r.answers.map(a => ({
          questionId: a.questionId,
          value: a.value as string | string[] | number | null,
          evidenceNote: a.evidenceNote,
          evidenceRef: a.evidenceRef,
        })),
      })),
      roiSettings: assessment.roiSettings as ROISettings,
    };

    const result = analyzeAssessment(scoringInput);

    const generatedBy = assessment.representative?.fullName ?? req.user?.email ?? 'system';

    const report = await prisma.assessmentReport.upsert({
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
        generatedAt: new Date(),
        generatedBy,
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
        generatedAt: new Date(),
        generatedBy,
      },
    });

    // Mark assessment as completed
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: 'completed', completedAt: new Date() },
    });

    ok(res, report);
  } catch (err) {
    next(err);
  }
}
