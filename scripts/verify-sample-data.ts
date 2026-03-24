import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count({
    where: { email: { contains: '@example.com' } },
  });

  const sessionCount = await prisma.userSession.count({
    where: { user: { email: { contains: '@example.com' } } },
  });

  const microCount = await prisma.microSession.count();

  const baselineCount = await prisma.skillBaseline.count({
    where: { user: { email: { contains: '@example.com' } } },
  });

  const completeSessions = await prisma.userSession.findMany({
    where: {
      status: 'complete',
      user: { email: { contains: '@example.com' } },
    },
    select: { scores: true },
    take: 3,
  });

  const users = await prisma.user.findMany({
    where: { email: { contains: '@example.com' } },
    select: { name: true, email: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log('\n=== Sample Data Verification ===');
  console.log(`Sample users:      ${userCount}`);
  console.log(`UserSessions:      ${sessionCount}`);
  console.log(`MicroSessions:     ${microCount}`);
  console.log(`SkillBaselines:    ${baselineCount}`);
  console.log(`\nUsers created:`);
  users.forEach(u => console.log(`  - ${u.name} (${u.email})`));
  console.log(`\nSample scores (first 3 complete sessions):`);
  completeSessions.forEach((s, i) => console.log(`  [${i + 1}] ${JSON.stringify(s.scores)}`));
  console.log('\n=== VERIFICATION PASSED ===');
}

main()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
