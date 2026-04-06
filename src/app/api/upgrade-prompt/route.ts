import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type UpgradeReason =
  | 'recording_limit'
  | 'coach_limit'
  | 'hearts_depleted'
  | 'locked_lesson'
  | 'locked_clip'
  | 'locked_game'
  | 'discussion_post'

interface UpgradePrompt {
  title: string
  body: string
  ctaText: string
  ctaLink: string
  coachMessage: string
}

const prompts: Record<UpgradeReason, UpgradePrompt> = {
  recording_limit: {
    title: 'Want to record longer?',
    body: 'Your 15-second recording is just a taste! Upgrade to Standard for 60-second recordings and see the full picture of your body language.',
    ctaText: 'Start 7-day free trial',
    ctaLink: '/pricing',
    coachMessage:
      "Hey, I noticed you hit the recording limit! 15 seconds is great for a quick check, but real improvement happens when you can observe yourself for a full minute. Trust me -- you'll spot patterns you never knew you had.",
  },
  coach_limit: {
    title: 'Coach Ney has more to share!',
    body: 'Unlock 20 conversations per day with Standard. Get deeper insights, voice chat, and personalized coaching.',
    ctaText: 'Unlock more coaching',
    ctaLink: '/pricing',
    coachMessage:
      "I love our chats! We've used up today's free sessions, but there's so much more I want to help you with. Upgrade and let's keep this momentum going -- 20 conversations a day means we can really dig into your technique.",
  },
  hearts_depleted: {
    title: 'Out of hearts!',
    body: "You've used all 3 hearts for today. Hearts refill in 4 hours, or upgrade to Standard for 10 hearts per day.",
    ctaText: 'Get more hearts',
    ctaLink: '/pricing',
    coachMessage:
      "Running out of hearts means you're pushing yourself -- that's the spirit! But don't let a cooldown slow your progress. With Standard, you get 10 hearts and can keep practicing without interruption.",
  },
  locked_lesson: {
    title: 'Continue your journey',
    body: 'This lesson continues your journey. Start your 7-day free trial to unlock all Foundation courses and master body language step by step.',
    ctaText: 'Start 7-day free trial',
    ctaLink: '/pricing',
    coachMessage:
      "You've completed the free lessons -- nice work! The next lessons build on what you've learned, and they're where the real breakthroughs happen. Start your free trial and let's keep going together.",
  },
  locked_clip: {
    title: 'Unlock this clip',
    body: 'Intermediate and advanced clips are available on Standard and above. Upgrade to access the full library of curated Hollywood scenes.',
    ctaText: 'Unlock all clips',
    ctaLink: '/pricing',
    coachMessage:
      "This clip has some amazing techniques to study! The intermediate and advanced library is where you'll find the most nuanced body language examples. Upgrade and let's analyze them together.",
  },
  locked_game: {
    title: 'Unlock more games',
    body: 'Free accounts have access to 2 mini-games. Upgrade to Standard to unlock all 5 games and sharpen every skill.',
    ctaText: 'Unlock all games',
    ctaLink: '/pricing',
    coachMessage:
      "Games are a fantastic way to train your eye! You've mastered the basics -- now let's level up with Expression King, Emotion Timeline, and Spot the Signal. Each one targets a different skill.",
  },
  discussion_post: {
    title: 'Join the Conversation',
    body: 'Upgrade to Standard to share your thoughts, ask questions, and connect with fellow learners in the discussion section.',
    ctaText: 'Start 7-day free trial',
    ctaLink: '/pricing',
    coachMessage:
      "Learning is better together! The discussion section is where learners share insights, ask questions, and support each other. Upgrade to Standard and become part of the community.",
  },
}

const validReasons = new Set<string>(Object.keys(prompts))

export async function GET(req: NextRequest) {
  const reason = req.nextUrl.searchParams.get('reason')

  if (!reason || !validReasons.has(reason)) {
    return NextResponse.json(
      { error: 'Invalid reason. Must be one of: ' + Array.from(validReasons).join(', ') },
      { status: 400 }
    )
  }

  return NextResponse.json(prompts[reason as UpgradeReason])
}
