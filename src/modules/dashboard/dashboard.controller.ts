import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { ok } from '../../utils/response';

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalCompanies,
      totalAssessments,
      draftCount,
      completedCount,
      reports,
      companiesBySize,
      companiesByCity,
      recentAssessments,
      recentMeetings,
      repsWithCounts,
    ] = await prisma.$transaction([
      prisma.company.count({ where: { deletedAt: null } }),
      prisma.assessment.count(),
      prisma.assessment.count({ where: { status: 'draft' } }),
      prisma.assessment.count({ where: { status: 'completed' } }),
      prisma.assessmentReport.findMany({ select: { aggregateScore: true } }),
      prisma.company.groupBy({ by: ['companySize'], _count: true, where: { deletedAt: null }, orderBy: {} }),
      prisma.company.groupBy({ by: ['city'], _count: true, where: { deletedAt: null }, orderBy: {} }),
      prisma.assessment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { company: { select: { name: true } }, representative: { select: { fullName: true } } },
      }),
      prisma.meetingRecord.findMany({
        take: 5,
        orderBy: { meetingDate: 'desc' },
        include: {
          company: { select: { name: true } },
          representative: { select: { fullName: true } },
        },
      }),
      prisma.representative.findMany({
        where: { isActive: true },
        include: { _count: { select: { assessments: true } } },
        orderBy: { fullName: 'asc' },
      }),
    ]);

    const avgScore =
      reports.length > 0
        ? reports.reduce((s, r) => s + Number(r.aggregateScore), 0) / reports.length
        : 0;

    ok(res, {
      totalCompanies,
      totalAssessments,
      assessmentsByStatus: { draft: draftCount, completed: completedCount },
      avgScore: Math.round(avgScore * 10) / 10,
      companiesBySize: Object.fromEntries(companiesBySize.map(r => [r.companySize, r._count])),
      companiesByCity: Object.fromEntries(companiesByCity.map(r => [r.city, r._count])),
      assessmentsPerRep: repsWithCounts.map(r => ({
        id: r.id,
        fullName: r.fullName,
        assessmentCount: r._count.assessments,
      })),
      recentAssessments,
      recentMeetings,
    });
  } catch (err) {
    next(err);
  }
}
