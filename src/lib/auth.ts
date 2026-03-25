import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user || !user.passwordHash) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        // Check approval status — only approved users can sign in
        if (user.status !== 'approved') {
          // Encode status (and optional note) so the client can parse it
          const note = user.statusNote || ''
          throw new Error(`status:${user.status}|${note}`)
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.status = (user as any).status
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).status = token.status
      }
      return session
    },
  },
}
