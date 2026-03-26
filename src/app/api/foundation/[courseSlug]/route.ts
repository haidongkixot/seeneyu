import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET /api/foundation/[courseSlug] — Get course detail with all lessons
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseSlug: string }> }
) {
  try {
    const { courseSlug } = await params

    const course = await prisma.foundationCourse.findUnique({
      where: { slug: courseSlug },
      include: {
        _count: { select: { lessons: true } },
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            examples: true,
            questions: { orderBy: { order: 'asc' } },
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const courseData = {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      icon: course.icon,
      color: course.color,
      order: course.order,
      lessonsCount: course._count.lessons,
      completedCount: 0,
    }

    const lessonsData = course.lessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      courseId: l.courseId,
      title: l.title,
      theoryHtml: l.theoryHtml,
      order: l.order,
      completed: false,
      quizPassed: false,
      examples: l.examples.map((e) => ({
        id: e.id,
        youtubeId: e.youtubeId,
        title: e.title,
        description: e.description,
        startTime: e.startTime,
      })),
      questions: l.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        order: q.order,
      })),
    }))

    return NextResponse.json(
      { course: courseData, lessons: lessonsData },
      { headers: corsHeaders }
    )
  } catch (err) {
    console.error('Error fetching course detail:', err)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500, headers: corsHeaders }
    )
  }
}
