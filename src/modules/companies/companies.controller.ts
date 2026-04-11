import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { ok, created, paginate } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';

export async function listCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, city, companySize } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { deletedAt: null };
    if (search) where['name'] = { contains: search, mode: 'insensitive' };
    if (city) where['city'] = city;
    if (companySize) where['companySize'] = companySize;

    const [total, companies] = await prisma.$transaction([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { contactPerson: true },
      }),
    ]);

    paginate(res, companies, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await prisma.company.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        contactPerson: true,
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { report: true },
        },
      },
    });

    if (!company) throw new AppError(404, 'Company not found');
    ok(res, company);
  } catch (err) {
    next(err);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { contact, ...companyData } = req.body;

    const company = await prisma.company.create({
      data: {
        ...companyData,
        ...(contact
          ? {
              contactPerson: { create: contact },
            }
          : {}),
      },
      include: { contactPerson: true },
    });

    created(res, company);
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.company.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) throw new AppError(404, 'Company not found');

    const { contact, ...companyData } = req.body;

    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        ...companyData,
        ...(contact
          ? {
              contactPerson: {
                upsert: {
                  create: contact,
                  update: contact,
                },
              },
            }
          : {}),
      },
      include: { contactPerson: true },
    });

    ok(res, company);
  } catch (err) {
    next(err);
  }
}

export async function deleteCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.company.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) throw new AppError(404, 'Company not found');

    await prisma.company.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
