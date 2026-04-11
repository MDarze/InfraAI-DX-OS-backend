import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database...');

  // ─── Admin users ─────────────────────────────────────────────────────────
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@infraai.sa' },
    update: {},
    create: {
      email: 'admin@infraai.sa',
      passwordHash: await bcrypt.hash('TempPassword@123', 12),
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  const admin2 = await prisma.adminUser.upsert({
    where: { email: 'manager@infraai.sa' },
    update: {},
    create: {
      email: 'manager@infraai.sa',
      passwordHash: await bcrypt.hash('TempPassword@123', 12),
      fullName: 'Assessment Manager',
      role: 'ADMIN',
    },
  });

  const viewer = await prisma.adminUser.upsert({
    where: { email: 'viewer@infraai.sa' },
    update: {},
    create: {
      email: 'viewer@infraai.sa',
      passwordHash: await bcrypt.hash('TempPassword@123', 12),
      fullName: 'Report Viewer',
      role: 'VIEWER',
    },
  });

  console.log('  ✓ Admin users created');

  // ─── Representatives ──────────────────────────────────────────────────────
  const rep1 = await prisma.representative.upsert({
    where: { email: 'khalid@infraai.sa' },
    update: {},
    create: {
      fullName: 'Khalid Al-Rashidi',
      email: 'khalid@infraai.sa',
      phone: '+966501234567',
      role: 'Senior Consultant',
    },
  });

  const rep2 = await prisma.representative.upsert({
    where: { email: 'fatima@infraai.sa' },
    update: {},
    create: {
      fullName: 'Fatima Al-Zahrani',
      email: 'fatima@infraai.sa',
      phone: '+966507654321',
      role: 'Assessor',
    },
  });

  const rep3 = await prisma.representative.upsert({
    where: { email: 'omar@infraai.sa' },
    update: {},
    create: {
      fullName: 'Omar Al-Ghamdi',
      email: 'omar@infraai.sa',
      phone: '+966509876543',
      role: 'Account Manager',
    },
  });

  console.log('  ✓ Representatives created');

  // ─── Companies + assessments ───────────────────────────────────────────────
  const company1 = await prisma.company.upsert({
    where: { emirateRegistration: 'SA-CON-001' },
    update: {},
    create: {
      name: 'Al-Bina Construction Co.',
      emirateRegistration: 'SA-CON-001',
      industry: 'Construction',
      companySize: '50-200',
      city: 'Riyadh',
      contactPerson: {
        create: {
          name: 'Mohammed Al-Qahtani',
          jobTitle: 'Operations Director',
          email: 'mohammed@albina.sa',
          phone: '+966501111111',
          preferredContactMethod: 'WHATSAPP',
        },
      },
    },
  });

  const company2 = await prisma.company.upsert({
    where: { emirateRegistration: 'SA-CON-002' },
    update: {},
    create: {
      name: 'Najem Infrastructure LLC',
      emirateRegistration: 'SA-CON-002',
      industry: 'Construction',
      companySize: '200+',
      city: 'Jeddah',
      contactPerson: {
        create: {
          name: 'Sara Al-Harbi',
          jobTitle: 'CFO',
          email: 'sara@najem.sa',
          phone: '+966502222222',
          preferredContactMethod: 'EMAIL',
        },
      },
    },
  });

  const company3 = await prisma.company.upsert({
    where: { emirateRegistration: 'SA-RE-003' },
    update: {},
    create: {
      name: 'Green Valley Real Estate',
      emirateRegistration: 'SA-RE-003',
      industry: 'Real Estate',
      companySize: '<50',
      city: 'Dammam',
      contactPerson: {
        create: {
          name: 'Faisal Al-Dossary',
          jobTitle: 'CEO',
          email: 'faisal@greenvalley.sa',
          phone: '+966503333333',
          preferredContactMethod: 'PHONE',
        },
      },
    },
  });

  console.log('  ✓ Companies created');

  // ─── Sample completed assessment for company1 ─────────────────────────────
  const existing = await prisma.assessment.findFirst({
    where: { companyId: company1.id, status: 'completed' },
  });

  if (!existing) {
    const roiSettings = {
      engineersCount: 8,
      workingDaysPerWeek: 5,
      savingRate: 0.35,
      hourlyCost: 85,
      overheadMultiplier: 1.3,
      currency: 'SAR',
    };

    const assessment = await prisma.assessment.create({
      data: {
        companyId: company1.id,
        representativeId: rep1.id,
        projectName: 'Digital Maturity Assessment Q1 2026',
        status: 'completed',
        roiSettings,
        completedAt: new Date(),
        respondents: {
          create: [
            {
              role: 'Manager',
              name: 'Ahmed Al-Qahtani',
              completedAt: new Date(),
              answers: {
                create: [
                  { questionId: 'p01', value: 'b', evidenceNote: 'Uses WhatsApp groups' },
                  { questionId: 'p02', value: 'b' },
                  { questionId: 'p03', value: 'b' },
                  { questionId: 'p04', value: 'c' },
                  { questionId: 'p05', value: 'b' },
                ],
              },
            },
            {
              role: 'Engineer',
              name: 'Nasser Al-Otaibi',
              completedAt: new Date(),
              answers: {
                create: [
                  { questionId: 'd01', value: 'b' },
                  { questionId: 'd02', value: 2, evidenceNote: 'Fills 2 spreadsheets daily' },
                  { questionId: 'd03', value: 2 },
                  { questionId: 'df01', value: 'b' },
                  { questionId: 'df02', value: 'b' },
                ],
              },
            },
            {
              role: 'Finance',
              name: 'Rania Al-Shehri',
              completedAt: new Date(),
              answers: {
                create: [
                  { questionId: 'f01', value: 'b' },
                  { questionId: 'f02', value: 'b' },
                  { questionId: 'f06', value: 25 },
                  { questionId: 'g01', value: 'b' },
                  { questionId: 'g02', value: 'b' },
                ],
              },
            },
            {
              role: 'Operations',
              name: 'Tariq Al-Malki',
              completedAt: new Date(),
              answers: {
                create: [
                  { questionId: 'au01', value: 'b' },
                  { questionId: 'au02', value: 'b' },
                  { questionId: 'ai01', value: 'b' },
                  { questionId: 'ai02', value: 'b' },
                ],
              },
            },
          ],
        },
      },
    });

    // Generate report
    const fullAssessment = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: { respondents: { include: { answers: true } } },
    });

    // Dynamic import to avoid circular deps
    const { analyzeAssessment } = await import('../src/engine/scoring');
    const result = analyzeAssessment({
      respondents: fullAssessment!.respondents.map(r => ({
        id: r.id, role: r.role, name: r.name,
        answers: r.answers.map(a => ({
          questionId: a.questionId,
          value: a.value as string | string[] | number | null,
        })),
      })),
      roiSettings: roiSettings as any,
    });

    await prisma.assessmentReport.create({
      data: {
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
        generatedBy: rep1.fullName,
      },
    });

    console.log('  ✓ Sample assessment + report created for Al-Bina');
  }

  // Draft assessment for company2
  await prisma.assessment.upsert({
    where: { id: 'seed-draft-najem' },
    update: {},
    create: {
      id: 'seed-draft-najem',
      companyId: company2.id,
      representativeId: rep2.id,
      projectName: 'Initial DX Discovery',
      status: 'draft',
      roiSettings: {
        engineersCount: 15,
        workingDaysPerWeek: 6,
        savingRate: 0.35,
        hourlyCost: 90,
        overheadMultiplier: 1.3,
        currency: 'SAR',
      },
    },
  });

  console.log('  ✓ Draft assessment created for Najem Infrastructure');
  console.log('\n✅  Seed complete!');
  console.log('\n📋  Login credentials:');
  console.log('   admin@infraai.sa      / TempPassword@123  (SUPER_ADMIN)');
  console.log('   manager@infraai.sa    / TempPassword@123  (ADMIN)');
  console.log('   viewer@infraai.sa     / TempPassword@123  (VIEWER)');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
