import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const plans = [
  {
    slug: 'basic',
    name: 'Basic',
    tagline: 'Get started for free',
    monthlyPrice: 0,
    annualPrice: null,
    features: [
      '5-second video recordings',
      'Short AI feedback summary',
      '3 arcade challenges per type',
      'Library access',
      'Foundation courses',
    ],
    videoLimitSec: 5,
  },
  {
    slug: 'standard',
    name: 'Standard',
    tagline: 'For serious learners',
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    features: [
      '30-second video recordings',
      'Full AI analysis',
      'Unlimited arcade challenges',
      'Unlimited practice sessions',
      'Library access',
      'Foundation courses',
    ],
    videoLimitSec: 30,
  },
  {
    slug: 'advanced',
    name: 'Advanced',
    tagline: 'Maximum potential',
    monthlyPrice: 19.99,
    annualPrice: 15.99,
    features: [
      '3-minute video recordings',
      'Full analysis + coach summary',
      'Unlimited arcade challenges',
      'Unlimited practice sessions',
      'VIP lessons',
      'Priority support',
      'Library access',
      'Foundation courses',
    ],
    videoLimitSec: 180,
  },
]

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        tagline: plan.tagline,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        features: plan.features,
        videoLimitSec: plan.videoLimitSec,
      },
      create: plan,
    })
    console.log(`Upserted plan: ${plan.name}`)
  }
}

main()
  .then(() => {
    console.log('Plans seeded successfully')
    prisma.$disconnect()
  })
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
