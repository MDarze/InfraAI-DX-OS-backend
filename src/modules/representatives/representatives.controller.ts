import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { ok, created } from '../../utils/response';

export async function listReps(req: Request, res: Response, next: NextFunction) {
  try {
    const reps = await prisma.representative.findMany({
      orderBy: { fullName: 'asc' },
      include: { _count: { select: { assessments: true } } },
    });
    ok(res, reps);
  } catch (err) {
    next(err);
  }
}

export async function createRep(req: Request, res: Response, next: NextFunction) {
  try {
    const rep = await prisma.representative.create({ data: req.body });
    created(res, rep);
  } catch (err) {
    next(err);
  }
}

export async function updateRep(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.representative.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Representative not found');

    const updated = await prisma.representative.update({
      where: { id: req.params.id },
      data: req.body,
    });
    ok(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deactivateRep(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.representative.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Representative not found');

    const updated = await prisma.representative.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    ok(res, updated);
  } catch (err) {
    next(err);
  }
}
