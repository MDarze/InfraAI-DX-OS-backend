import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { ok, created } from '../../utils/response';

export async function listRespondents(req: Request, res: Response, next: NextFunction) {
  try {
    const { assessmentId } = req.params;
    const respondents = await prisma.respondent.findMany({
      where: { assessmentId },
      include: { answers: true },
      orderBy: { createdAt: 'asc' },
    });
    ok(res, respondents);
  } catch (err) {
    next(err);
  }
}

export async function createRespondent(req: Request, res: Response, next: NextFunction) {
  try {
    const { assessmentId } = req.params;

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new AppError(404, 'Assessment not found');

    const respondent = await prisma.respondent.create({
      data: { assessmentId, ...req.body },
    });

    created(res, respondent);
  } catch (err) {
    next(err);
  }
}

export async function updateRespondent(req: Request, res: Response, next: NextFunction) {
  try {
    const { respondentId } = req.params;
    const existing = await prisma.respondent.findUnique({ where: { id: respondentId } });
    if (!existing) throw new AppError(404, 'Respondent not found');

    const updated = await prisma.respondent.update({
      where: { id: respondentId },
      data: req.body,
    });

    ok(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteRespondent(req: Request, res: Response, next: NextFunction) {
  try {
    const { respondentId } = req.params;
    const existing = await prisma.respondent.findUnique({ where: { id: respondentId } });
    if (!existing) throw new AppError(404, 'Respondent not found');

    await prisma.respondent.delete({ where: { id: respondentId } });
    ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
