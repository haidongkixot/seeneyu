import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/mobile-auth'

export async function GET(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = authUser.id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      phone: true,
      location: true,
      plan: true,
      status: true,
      role: true,
      image: true,
      avatarUrl: true,
      createdAt: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = authUser.id
  const body = await req.json()

  // Only allow updating these fields
  const allowed = ['name', 'bio', 'phone', 'location'] as const
  const data: Record<string, string | null> = {}
  for (const key of allowed) {
    if (key in body) {
      const val = body[key]
      data[key] = typeof val === 'string' ? val.trim() : null
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      phone: true,
      location: true,
      plan: true,
      status: true,
      role: true,
      image: true,
      avatarUrl: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user)
}
