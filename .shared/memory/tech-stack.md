# Tech Stack — seeneyu

## Application
| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router) | TypeScript, server components |
| Styling | Tailwind CSS | Dark UI, gray-900/950 base |
| Database | PostgreSQL (Neon) | Serverless, free tier for MVP |
| ORM | Prisma | Schema at `prisma/schema.prisma` |
| Video | YouTube IFrame API | No self-hosting |
| Recording | MediaRecorder API (browser) | Webcam capture, no library needed |
| AI Feedback | GPT-4o Vision (OpenAI) | Analyze user recording frames |
| File Storage | Vercel Blob | Temporary user recordings |
| Deploy | Vercel | Auto-deploy from main branch |

## Environment Variables (`.env.local`)
```
DATABASE_URL=           # Neon PostgreSQL connection string
YOUTUBE_API_KEY=        # YouTube Data API v3
OPENAI_API_KEY=         # GPT-4o Vision for feedback
BLOB_READ_WRITE_TOKEN=  # Vercel Blob
```

## Key Dependencies (to install)
```json
{
  "next": "^14",
  "typescript": "^5",
  "tailwindcss": "^3",
  "@prisma/client": "^6",
  "prisma": "^6",
  "zod": "^3",
  "openai": "^4",
  "@vercel/blob": "latest"
}
```

## Dev Dependencies
```json
{
  "vitest": "latest",
  "@playwright/test": "latest",
  "@testing-library/react": "latest"
}
```

## Project Structure (planned)
```
seeneyu/
  src/
    app/                    ← Next.js App Router pages
      (marketing)/          ← landing page
      library/              ← clip browse + filter
      clip/[id]/            ← clip viewer + annotation + record
      feedback/[sessionId]/ ← AI feedback results
      progress/             ← user progress dashboard
    components/             ← shared UI components
    lib/                    ← utilities, API clients
    actions/                ← Next.js server actions
  prisma/
    schema.prisma
  e2e/                      ← Playwright tests
  .shared/                  ← multi-agent coordination (not part of app)
  roles/                    ← role CLAUDE.md files (not part of app)
```

## Prisma Schema (planned, Data Engineer to finalize)
```prisma
model Clip {
  id                  String   @id @default(cuid())
  youtubeVideoId      String
  startSec            Int
  endSec              Int
  movieTitle          String
  characterName       String?
  skillCategory       String
  difficulty          String   // beginner | intermediate | advanced
  signalClarity       Int
  noiseLevel          Int
  contextDependency   Int
  replicationDifficulty Int
  annotation          String
  contextNote         String?
  createdAt           DateTime @default(now())
  annotations         Annotation[]
}

model Annotation {
  id        String  @id @default(cuid())
  clipId    String
  clip      Clip    @relation(fields: [clipId], references: [id])
  atSecond  Int
  note      String
  type      String  // posture | gesture | eye_contact | voice | expression
}

model UserSession {
  id          String   @id @default(cuid())
  clipId      String
  recordingUrl String?
  feedback    Json?
  scores      Json?
  createdAt   DateTime @default(now())
}
```
