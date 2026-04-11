import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { ok } from '../../utils/response';
import { QUESTIONS } from '../../data/questions';

export async function listAnswers(req: Request, res: Response, next: NextFunction) {
  try {
    const { respondentId } = req.params;
    const answers = await prisma.answer.findMany({
      where: { respondentId },
      orderBy: { createdAt: 'asc' },
    });
    ok(res, answers);
  } catch (err) {
    next(err);
  }
}

export async function submitAnswers(req: Request, res: Response, next: NextFunction) {
  try {
    const { respondentId } = req.params;
    const { answers } = req.body as {
      answers: Array<{
        questionId: string;
        value: string | string[] | number | null;
        evidenceNote?: string;
        evidenceRef?: string;
        skipped?: boolean;
      }>;
    };

    const respondent = await prisma.respondent.findUnique({ where: { id: respondentId } });
    if (!respondent) throw new AppError(404, 'Respondent not found');

    // Validate question IDs
    const validIds = new Set(QUESTIONS.map(q => q.id));
    const invalid = answers.filter(a => !validIds.has(a.questionId));
    if (invalid.length > 0) {
      throw new AppError(400, `Unknown question IDs: ${invalid.map(a => a.questionId).join(', ')}`);
    }

    // Upsert all answers
    await prisma.$transaction(
      answers.map(a =>
        prisma.answer.upsert({
          where: { respondentId_questionId: { respondentId, questionId: a.questionId } },
          create: {
            respondentId,
            questionId: a.questionId,
            value: a.value === null ? undefined : (a.value as string),
            evidenceNote: a.evidenceNote,
            evidenceRef: a.evidenceRef,
          },
          update: {
            value: a.value === null ? undefined : (a.value as string),
            evidenceNote: a.evidenceNote,
            evidenceRef: a.evidenceRef,
          },
        }),
      ),
    );

    const allAnswers = await prisma.answer.findMany({ where: { respondentId } });
    ok(res, { saved: allAnswers.length, answers: allAnswers });
  } catch (err) {
    next(err);
  }
}
