import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { ok, created, paginate } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';

export async function listAssessments(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { companyId, representativeId, status, from, to } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (companyId) where['companyId'] = companyId;
    if (representativeId) where['representativeId'] = representativeId;
    if (status) where['status'] = status;
    if (from || to) {
      where['createdAt'] = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [total, assessments] = await prisma.$transaction([
      prisma.assessment.count({ where }),
      prisma.assessment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          representative: { select: { id: true, fullName: true } },
          _count: { select: { respondents: true } },
        },
      }),
    ]);

    paginate(res, assessments, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        company: true,
        representative: true,
        respondents: {
          include: { answers: true },
        },
        report: true,
      },
    });

    if (!assessment) throw new AppError(404, 'Assessment not found');
    ok(res, assessment);
  } catch (err) {
    next(err);
  }
}

export async function createAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId, representativeId, projectName, roiSettings } = req.body;

    const company = await prisma.company.findFirst({ where: { id: companyId, deletedAt: null } });
    if (!company) throw new AppError(404, 'Company not found');

    const assessment = await prisma.assessment.create({
      data: {
        companyId,
        representativeId: representativeId ?? null,
        projectName: projectName ?? null,
        roiSettings,
        status: 'draft',
      },
      include: { company: true, representative: true },
    });

    created(res, assessment);
  } catch (err) {
    next(err);
  }
}

export async function updateAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Assessment not found');

    const { status, projectName, roiSettings, representativeId } = req.body;

    const data: Record<string, unknown> = {};
    if (status !== undefined) data['status'] = status;
    if (projectName !== undefined) data['projectName'] = projectName;
    if (roiSettings !== undefined) data['roiSettings'] = roiSettings;
    if (representativeId !== undefined) data['representativeId'] = representativeId;
    if (status === 'completed') data['completedAt'] = new Date();

    const updated = await prisma.assessment.update({
      where: { id: req.params.id },
      data,
      include: { company: true, representative: true },
    });

    ok(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Assessment not found');
    if (existing.status !== 'draft') throw new AppError(400, 'Only draft assessments can be deleted');

    await prisma.assessment.delete({ where: { id: req.params.id } });
    ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
