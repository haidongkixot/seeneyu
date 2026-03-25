const ENCOURAGEMENTS: Record<string, string[]> = {
  quizCorrect: [
    'Nailed it!',
    'Sharp eye!',
    "You're reading people like a pro!",
    'Excellent observation!',
    'Spot on!',
    'That eye for detail is growing!',
  ],
  quizWrong: [
    'Almost! Body language is subtle.',
    'Good try — watch the clip again.',
    'Keep practicing!',
    "Not quite, but you're learning!",
    'Close! Review the theory section for a hint.',
  ],
  streakContinue: [
    "Day {n}! You're on fire!",
    '{n} days strong!',
    'Unstoppable!',
    '{n}-day streak! Keep it going!',
    'Another day, another step forward!',
  ],
  streakBroken: [
    'No worries — start a new streak today!',
    'Every expert was once a beginner.',
    'Fresh start! Today is day 1.',
    "Streaks break, skills don't. Let's go!",
  ],
  levelUp: [
    'Level {n}! Your communication skills are leveling up!',
    'Welcome to Level {n}!',
    'Level {n} unlocked! You are getting better every day.',
    'Congratulations — Level {n}!',
  ],
  arcadeHighScore: [
    'New personal best!',
    'Expression master!',
    'Incredible performance!',
    'Your best score yet!',
  ],
  badgeEarned: [
    'Achievement unlocked!',
    'New badge earned!',
    "You've earned a badge!",
    'Badge unlocked — check your collection!',
  ],
  heartLost: [
    'Oops! You lost a heart.',
    'Take your time — accuracy matters.',
    'Hearts refill in a few hours. Hang tight!',
  ],
  questComplete: [
    'Quest complete! +{xp} XP',
    'Nice work on that quest!',
    'Quest done! Keep going for the daily bonus!',
  ],
  idle: [
    'Ready to practice?',
    'Coach Ney believes in you!',
    'Small steps lead to big changes.',
    'Your body language journey awaits!',
    'Pick up where you left off?',
  ],
}

/**
 * Get a random encouragement copy for a given category.
 * Supports variable substitution: {n}, {xp}, etc.
 */
export function getRandomCopy(
  category: string,
  vars?: Record<string, string | number>
): string {
  const options = ENCOURAGEMENTS[category]
  if (!options || options.length === 0) return ''

  let text = options[Math.floor(Math.random() * options.length)]

  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
    }
  }

  return text
}

export { ENCOURAGEMENTS }
