/**
 * Data migration: Set all existing users to status='approved'.
 * Run AFTER the schema migration adds the `status` column.
 *
 * Usage: npx tsx scripts/migrate-user-status.ts
 */
import { prisma } from '../src/lib/prisma'

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { status: 'pending' },
        { status: { not: 'approved' } },
      ],
    },
    data: {
      status: 'approved',
      approvedAt: new Date(),
    },
  })
  console.log(`Updated ${result.count} existing users to status='approved'`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => { console.error(err); prisma.$disconnect(); process.exit(1) })
