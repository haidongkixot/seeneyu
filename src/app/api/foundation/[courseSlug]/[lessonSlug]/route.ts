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

// GET /api/foundation/[courseSlug]/[lessonSlug] — Get single lesson with full data
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseSlug: string; lessonSlug: string }> }
) {
  try {
    const { courseSlug, lessonSlug } = await params

    // First find the course to get the courseId
    const course = await prisma.foundationCourse.findUnique({
      where: { slug: courseSlug },
      select: { id: true },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const lesson = await prisma.foundationLesson.findUnique({
      where: {
        courseId_slug: {
          courseId: course.id,
          slug: lessonSlug,
        },
      },
      include: {
        examples: true,
        questions: { orderBy: { order: 'asc' } },
      },
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const result = {
      id: lesson.id,
      slug: lesson.slug,
      courseId: lesson.courseId,
      title: lesson.title,
      theoryHtml: lesson.theoryHtml,
      order: lesson.order,
      completed: false,
      quizPassed: false,
      examples: lesson.examples.map((e) => ({
        id: e.id,
        youtubeId: e.youtubeId,
        title: e.title,
        description: e.description,
        startTime: e.startTime,
      })),
      questions: lesson.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        order: q.order,
      })),
    }

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (err) {
    console.error('Error fetching lesson:', err)
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500, headers: corsHeaders }
    )
  }
}
