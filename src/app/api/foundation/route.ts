import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET /api/foundation — List all courses with lesson counts
export async function GET() {
  try {
    const courses = await prisma.foundationCourse.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { lessons: true } },
        lessons: {
          select: { id: true, slug: true, title: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    const result = courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      icon: c.icon,
      color: c.color,
      order: c.order,
      lessonsCount: c._count.lessons,
      completedCount: 0, // No auth context in public endpoint
      lessons: c.lessons.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        order: l.order,
      })),
    }))

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (err) {
    console.error('Error fetching foundation courses:', err)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500, headers: corsHeaders }
    )
  }
}
