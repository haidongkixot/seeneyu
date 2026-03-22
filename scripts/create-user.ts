import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

const email = process.env.USER_EMAIL || 'test@seeneyu.com'
const password = process.env.USER_PASSWORD || 'test1234'
const name = process.env.USER_NAME || 'Test Learner'

async function main() {
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'learner' },
    create: { email, name, role: 'learner', passwordHash },
  })
  console.log('Learner created:', user.email)
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => { console.error(err); prisma.$disconnect(); process.exit(1) })
