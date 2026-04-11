import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { ok, created } from '../../utils/response';

export async function createMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await prisma.meetingRecord.create({
      data: {
        ...req.body,
        meetingDate: new Date(req.body.meetingDate),
      },
      include: {
        company: { select: { id: true, name: true } },
        representative: { select: { id: true, fullName: true } },
      },
    });
    created(res, meeting);
  } catch (err) {
    next(err);
  }
}

export async function meetingsByCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const meetings = await prisma.meetingRecord.findMany({
      where: { companyId: req.params.companyId },
      orderBy: { meetingDate: 'desc' },
      include: { representative: { select: { id: true, fullName: true } } },
    });
    ok(res, meetings);
  } catch (err) {
    next(err);
  }
}

export async function meetingsByRep(req: Request, res: Response, next: NextFunction) {
  try {
    const meetings = await prisma.meetingRecord.findMany({
      where: { representativeId: req.params.repId },
      orderBy: { meetingDate: 'desc' },
      include: { company: { select: { id: true, name: true } } },
    });
    ok(res, meetings);
  } catch (err) {
    next(err);
  }
}
