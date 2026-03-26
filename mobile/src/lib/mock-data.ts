// Mock data matching Prisma schema shapes for offline/fallback usage.
// When the API endpoints exist, this data is replaced by real responses.

export type FoundationCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  lessonsCount: number;
  completedCount: number;
};

export type FoundationLesson = {
  id: string;
  slug: string;
  courseId: string;
  title: string;
  theoryHtml: string;
  order: number;
  completed: boolean;
  quizPassed: boolean;
  examples: LessonExample[];
  questions: QuizQuestion[];
};

export type LessonExample = {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  startTime?: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  order: number;
};

export type ClipItem = {
  id: string;
  youtubeVideoId: string;
  startSec: number;
  endSec: number;
  movieTitle: string;
  year?: number;
  characterName?: string;
  actorName?: string;
  sceneDescription: string;
  skillCategory: string;
  difficulty: string;
  annotation: string;
  observationGuide?: { steps: string[] } | null;
  script?: string | null;
};

export const MOCK_COURSES: FoundationCourse[] = [
  {
    id: 'c1',
    slug: 'eye-contact',
    title: 'Eye Contact Mastery',
    description:
      'Learn how eye contact conveys confidence, connection, and authority in conversation.',
    icon: 'eye',
    color: '#3b82f6',
    order: 1,
    lessonsCount: 4,
    completedCount: 2,
  },
  {
    id: 'c2',
    slug: 'posture-power',
    title: 'Posture & Power',
    description:
      'Discover how body positioning communicates status, openness, and emotional state.',
    icon: 'user',
    color: '#22c55e',
    order: 2,
    lessonsCount: 3,
    completedCount: 0,
  },
  {
    id: 'c3',
    slug: 'gestures-emphasis',
    title: 'Gestures & Emphasis',
    description:
      'Master hand movements that reinforce your message and captivate your audience.',
    icon: 'hand',
    color: '#f59e0b',
    order: 3,
    lessonsCount: 5,
    completedCount: 0,
  },
  {
    id: 'c4',
    slug: 'facial-expressions',
    title: 'Reading Facial Expressions',
    description:
      'Decode micro-expressions and emotional cues displayed on the face.',
    icon: 'smile',
    color: '#ec4899',
    order: 4,
    lessonsCount: 4,
    completedCount: 0,
  },
  {
    id: 'c5',
    slug: 'vocal-pacing',
    title: 'Vocal Pacing & Tone',
    description:
      'Control rhythm, pauses, and intonation for maximum persuasive impact.',
    icon: 'mic',
    color: '#6366f1',
    order: 5,
    lessonsCount: 3,
    completedCount: 0,
  },
];

export const MOCK_LESSONS: Record<string, FoundationLesson[]> = {
  'eye-contact': [
    {
      id: 'l1',
      slug: 'intro-to-eye-contact',
      courseId: 'c1',
      title: 'Introduction to Eye Contact',
      theoryHtml:
        '<p>Eye contact is one of the most powerful non-verbal cues. It signals confidence, trustworthiness, and engagement.</p><p>In Western cultures, maintaining eye contact for 60-70% of a conversation signals active listening. Too little can suggest disinterest; too much can feel confrontational.</p><p><strong>Key principle:</strong> Match the intensity and duration of your eye contact to the context. A job interview calls for steadier gaze than a casual chat.</p>',
      order: 1,
      completed: true,
      quizPassed: true,
      examples: [
        {
          id: 'e1',
          youtubeId: 'dQw4w9WgXcQ',
          title: 'Confident Gaze in Negotiation',
          description:
            'Notice how the character maintains a steady gaze during the negotiation scene, breaking contact only to think.',
          startTime: 30,
        },
      ],
      questions: [
        {
          id: 'q1',
          question:
            'What percentage of conversation time should you maintain eye contact in Western cultures?',
          options: ['20-30%', '40-50%', '60-70%', '90-100%'],
          correctIndex: 2,
          explanation:
            '60-70% is the ideal range. Less can suggest disinterest, and more can feel confrontational.',
          order: 1,
        },
        {
          id: 'q2',
          question:
            'What does excessive eye contact without breaks typically signal?',
          options: [
            'Confidence',
            'Aggression or confrontation',
            'Romantic interest',
            'Boredom',
          ],
          correctIndex: 1,
          explanation:
            'Unbroken staring can be perceived as aggressive. Natural eye contact includes periodic breaks.',
          order: 2,
        },
      ],
    },
    {
      id: 'l2',
      slug: 'triangular-gazing',
      courseId: 'c1',
      title: 'The Triangular Gaze',
      theoryHtml:
        '<p>The triangular gaze technique involves shifting your focus between the other person\'s two eyes and their mouth, creating a natural triangle pattern.</p><p>This technique makes your gaze feel warm and engaged without being too intense. It\'s particularly effective in one-on-one conversations.</p>',
      order: 2,
      completed: true,
      quizPassed: true,
      examples: [],
      questions: [
        {
          id: 'q3',
          question: 'What three points form the "triangular gaze"?',
          options: [
            'Forehead, left ear, right ear',
            'Left eye, right eye, mouth',
            'Left eye, nose, chin',
            'Both eyes and the bridge of the nose',
          ],
          correctIndex: 1,
          explanation:
            'The triangle is formed by the two eyes and the mouth. This creates a natural, warm gaze pattern.',
          order: 1,
        },
      ],
    },
    {
      id: 'l3',
      slug: 'power-gaze',
      courseId: 'c1',
      title: 'The Power Gaze',
      theoryHtml:
        '<p>The power gaze is used in authority and business contexts. Instead of the social triangle, focus on the area between the eyes and the forehead.</p><p>This creates a more serious, business-like impression. Use it during presentations, negotiations, or when establishing authority.</p>',
      order: 3,
      completed: false,
      quizPassed: false,
      examples: [
        {
          id: 'e2',
          youtubeId: 'dQw4w9WgXcQ',
          title: 'Authority in the Boardroom',
          description:
            'Watch how the executive uses the power gaze to command attention.',
          startTime: 0,
        },
      ],
      questions: [
        {
          id: 'q4',
          question: 'Where do you focus during a "power gaze"?',
          options: [
            'Between the eyes and mouth',
            'Between the eyes and forehead',
            'Directly at the nose',
            'Over the person\'s shoulder',
          ],
          correctIndex: 1,
          explanation:
            'The power gaze triangle sits between the eyes and forehead, conveying authority.',
          order: 1,
        },
      ],
    },
    {
      id: 'l4',
      slug: 'cultural-variations',
      courseId: 'c1',
      title: 'Cultural Variations',
      theoryHtml:
        '<p>Eye contact norms vary dramatically across cultures. In many Asian and Middle Eastern cultures, prolonged eye contact with authority figures is considered disrespectful.</p><p>Always adapt your eye contact behavior to the cultural context of your audience.</p>',
      order: 4,
      completed: false,
      quizPassed: false,
      examples: [],
      questions: [
        {
          id: 'q5',
          question:
            'In many East Asian cultures, prolonged eye contact with authority figures is:',
          options: [
            'Expected and respected',
            'Considered disrespectful',
            'A sign of romantic interest',
            'Completely irrelevant',
          ],
          correctIndex: 1,
          explanation:
            'In many Asian cultures, lowering one\'s gaze with authority figures is a sign of respect.',
          order: 1,
        },
      ],
    },
  ],
};

export const MOCK_CLIPS: ClipItem[] = [
  {
    id: 'clip1',
    youtubeVideoId: 'dQw4w9WgXcQ',
    startSec: 10,
    endSec: 45,
    movieTitle: 'The Dark Knight',
    year: 2008,
    characterName: 'Harvey Dent',
    actorName: 'Aaron Eckhart',
    sceneDescription:
      'Harvey Dent delivers a confident speech at a press conference, demonstrating strong eye contact and open posture throughout.',
    skillCategory: 'eye-contact',
    difficulty: 'beginner',
    annotation:
      'Notice how Dent scans the room, making brief eye contact with individual audience members.',
    observationGuide: {
      steps: [
        'Watch where his eyes move during the speech',
        'Note the duration of each eye contact moment',
        'Observe his head movements as he scans the audience',
        'Notice when he breaks eye contact and why',
      ],
    },
    script:
      'The night is darkest just before the dawn. And I promise you, the dawn is coming.',
  },
  {
    id: 'clip2',
    youtubeVideoId: 'dQw4w9WgXcQ',
    startSec: 0,
    endSec: 30,
    movieTitle: 'The Devil Wears Prada',
    year: 2006,
    characterName: 'Miranda Priestly',
    actorName: 'Meryl Streep',
    sceneDescription:
      'Miranda uses minimal but powerful gestures and posture to assert dominance in the office.',
    skillCategory: 'posture',
    difficulty: 'intermediate',
    annotation:
      'Streep barely moves, yet commands the entire room through stillness and controlled posture.',
    observationGuide: {
      steps: [
        'Notice how still she remains while others fidget',
        'Observe her seated posture — spine straight, shoulders relaxed',
        'Watch how she uses head tilts instead of large movements',
      ],
    },
    script: null,
  },
  {
    id: 'clip3',
    youtubeVideoId: 'dQw4w9WgXcQ',
    startSec: 15,
    endSec: 50,
    movieTitle: 'The King\'s Speech',
    year: 2010,
    characterName: 'King George VI',
    actorName: 'Colin Firth',
    sceneDescription:
      'King George delivers his wartime radio address, overcoming his stutter with careful vocal pacing.',
    skillCategory: 'vocal-pacing',
    difficulty: 'advanced',
    annotation:
      'Firth demonstrates how deliberate pauses can transform a weakness into commanding presence.',
    observationGuide: {
      steps: [
        'Listen for the strategic pauses between phrases',
        'Note the change in pace as confidence builds',
        'Observe how breathing rhythm supports speech delivery',
      ],
    },
    script:
      'In this grave hour, perhaps the most fateful in our history, I send to every household of my peoples...',
  },
  {
    id: 'clip4',
    youtubeVideoId: 'dQw4w9WgXcQ',
    startSec: 5,
    endSec: 35,
    movieTitle: 'Catch Me If You Can',
    year: 2002,
    characterName: 'Frank Abagnale',
    actorName: 'Leonardo DiCaprio',
    sceneDescription:
      'Frank impersonates a substitute teacher, using confident gestures and facial expressions to maintain the deception.',
    skillCategory: 'gestures',
    difficulty: 'intermediate',
    annotation:
      'DiCaprio uses open palm gestures and wide arm movements to project authority beyond his years.',
    observationGuide: null,
    script: null,
  },
  {
    id: 'clip5',
    youtubeVideoId: 'dQw4w9WgXcQ',
    startSec: 20,
    endSec: 55,
    movieTitle: 'Good Will Hunting',
    year: 1997,
    characterName: 'Sean Maguire',
    actorName: 'Robin Williams',
    sceneDescription:
      'Sean shares a deeply personal story, using facial expressions and vocal tone to create emotional connection.',
    skillCategory: 'facial-expressions',
    difficulty: 'advanced',
    annotation:
      'Williams shows how micro-expressions of vulnerability build trust and emotional rapport.',
    observationGuide: {
      steps: [
        'Watch the subtle changes in his facial expression as emotions shift',
        'Notice how his eyes convey sadness, warmth, and humor in quick succession',
        'Observe the synchronization between facial expression and vocal tone',
      ],
    },
    script: null,
  },
  {
    id: 'clip6',
    youtubeVideoId: 'dQw4w9WgXcQ',
    startSec: 0,
    endSec: 40,
    movieTitle: 'The Social Network',
    year: 2010,
    characterName: 'Mark Zuckerberg',
    actorName: 'Jesse Eisenberg',
    sceneDescription:
      'Mark\'s rapid-fire dialogue and minimal eye contact reveal social awkwardness and intellectual dominance simultaneously.',
    skillCategory: 'eye-contact',
    difficulty: 'intermediate',
    annotation:
      'Eisenberg demonstrates how avoidance of eye contact can paradoxically convey intensity and intelligence.',
    observationGuide: {
      steps: [
        'Track how rarely he makes direct eye contact',
        'Notice how this avoidance creates discomfort in other characters',
        'Compare his eye behavior in confident vs uncertain moments',
      ],
    },
    script: null,
  },
];

export const SKILL_CATEGORIES = [
  'all',
  'eye-contact',
  'posture',
  'gestures',
  'facial-expressions',
  'vocal-pacing',
  'proxemics',
  'mirroring',
  'power-dynamics',
];
