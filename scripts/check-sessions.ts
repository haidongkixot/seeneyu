import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()

  const user = await prisma.user.findUnique({
    where: { email: 'test@seeneyu.com' },
    select: { id: true, name: true, role: true }
  })
  console.log('User:', user)

  const sessions = await prisma.userSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { clip: { select: { skillCategory: true, movieTitle: true } } }
  })

  console.log('\nRecent sessions:')
  for (const s of sessions) {
    const frames = s.frameUrls ? JSON.parse(s.frameUrls as string) : []
    console.log(JSON.stringify({
      id: s.id,
      status: s.status,
      frameCount: frames.length,
      hasRecording: !!s.recordingUrl,
      hasFeedback: !!s.feedback,
      clip: s.clip?.movieTitle,
      skill: s.clip?.skillCategory,
      createdAt: s.createdAt,
    }, null, 2))
  }

  await prisma.$disconnect()
}

main().catch(console.error)
