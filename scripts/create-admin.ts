import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

const email = process.env.ADMIN_EMAIL || 'admin@seeneyu.com'
const password = process.env.ADMIN_PASSWORD || 'changeme123'

async function main() {
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', passwordHash },
    create: { email, name: 'Admin', role: 'admin', passwordHash },
  })
  console.log('Admin created:', user.email)
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => { console.error(err); prisma.$disconnect(); process.exit(1) })
