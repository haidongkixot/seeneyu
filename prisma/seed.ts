/**
 * seeneyu — Prisma Database Seed
 *
 * Seeds the database with clips from .shared/outputs/data/clips-100-seed.json (or clips-seed.json as fallback)
 *
 * Prerequisites:
 *   1. YOUTUBE_API_KEY verified — all youtube_video_id must NOT be "NEEDS_VERIFICATION"
 *   2. DATABASE_URL set in .env.local
 *   3. npx prisma db push (or migrate) run first
 *
 * Run: npx tsx prisma/seed.ts
 * Or via package.json: "prisma": { "seed": "tsx prisma/seed.ts" }
 * Then: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface SeedAnnotation {
  at_second: number;
  type: string;
  note: string;
}

interface SeedPracticeStep {
  step_number: number;
  skill_focus: string;
  instruction: string;
  tip?: string;
  target_duration_sec: number;
}

interface SeedClip {
  id: string;
  youtube_video_id: string;
  movie_title: string;
  year?: number;
  character_name?: string;
  actor_name?: string;
  scene_description: string;
  skill_category: string;
  difficulty: string;
  start_sec: number;
  end_sec: number;
  signal_clarity: number;
  noise_level: number;
  context_dependency: number;
  replication_difficulty: number;
  difficulty_score: number;
  annotation: string;
  context_note?: string;
  script?: string;
  screenplay_source?: string;
  observation_guide?: Record<string, unknown>;
  practice_steps?: SeedPracticeStep[];
  annotations: SeedAnnotation[];
}

interface SeedFile {
  _meta: { status: string };
  clips: SeedClip[];
}

async function main() {
  const preferredPath = path.resolve(".shared/outputs/data/clips-100-seed.json");
  const fallbackPath = path.resolve(".shared/outputs/data/clips-seed.json");
  const seedPath = fs.existsSync(preferredPath) ? preferredPath : fallbackPath;

  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed file not found: ${seedPath}`);
  }

  console.log(`Using seed file: ${seedPath}`);

  const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8")) as SeedFile;

  // Guard: refuse to seed with placeholder IDs
  const unverified = seedData.clips.filter(
    (c) => c.youtube_video_id === "NEEDS_VERIFICATION"
  );
  if (unverified.length > 0) {
    console.error(
      `\nERROR: ${unverified.length} clip(s) still have NEEDS_VERIFICATION YouTube IDs:`
    );
    unverified.forEach((c) => console.error(`  - ${c.id}`));
    console.error(
      "\nRun the YouTube discovery pipeline first:\n  cd roles/data-engineer/pipelines && npm run discover"
    );
    process.exit(1);
  }

  console.log(`Seeding ${seedData.clips.length} clips...`);

  let created = 0;
  let patched = 0;
  let skipped = 0;

  for (const clip of seedData.clips) {
    const existing = await prisma.clip.findFirst({
      where: { youtubeVideoId: clip.youtube_video_id },
    });

    if (existing) {
      // Patch any missing scalar/JSON fields
      const patch: Record<string, unknown> = {};
      if (existing.script === null && clip.script) patch.script = clip.script;
      if (existing.screenplaySource === null && clip.screenplay_source) {
        patch.screenplaySource = clip.screenplay_source;
      }
      if (existing.observationGuide === null && clip.observation_guide) {
        patch.observationGuide = clip.observation_guide;
      }

      if (Object.keys(patch).length > 0) {
        await prisma.clip.update({ where: { id: existing.id }, data: patch });
      }

      // Patch PracticeStep relation — create rows if none exist yet
      let stepsAdded = 0;
      if (clip.practice_steps?.length) {
        const existingStepCount = await prisma.practiceStep.count({
          where: { clipId: existing.id },
        });
        if (existingStepCount === 0) {
          await prisma.practiceStep.createMany({
            data: clip.practice_steps.map((s) => ({
              clipId: existing.id,
              stepNumber: s.step_number,
              skillFocus: s.skill_focus,
              instruction: s.instruction,
              tip: s.tip ?? null,
              targetDurationSec: s.target_duration_sec,
            })),
          });
          stepsAdded = clip.practice_steps.length;
        }
      }

      const totalPatched = Object.keys(patch).length + stepsAdded;
      if (totalPatched > 0) {
        const desc = [
          ...Object.keys(patch),
          ...(stepsAdded > 0 ? [`${stepsAdded} practiceSteps`] : []),
        ].join(", ");
        console.log(`  PATCH ${clip.id} — ${desc}`);
        patched++;
      } else {
        console.log(`  SKIP  ${clip.id} — already complete`);
        skipped++;
      }
      continue;
    }

    // Create new clip with all fields
    await prisma.clip.create({
      data: {
        youtubeVideoId: clip.youtube_video_id,
        startSec: clip.start_sec,
        endSec: clip.end_sec,
        movieTitle: clip.movie_title,
        year: clip.year ?? null,
        characterName: clip.character_name ?? null,
        actorName: clip.actor_name ?? null,
        sceneDescription: clip.scene_description,
        skillCategory: clip.skill_category,
        difficulty: clip.difficulty,
        difficultyScore: clip.difficulty_score,
        signalClarity: clip.signal_clarity,
        noiseLevel: clip.noise_level,
        contextDependency: clip.context_dependency,
        replicationDifficulty: clip.replication_difficulty,
        annotation: clip.annotation,
        contextNote: clip.context_note ?? null,
        script: clip.script ?? null,
        screenplaySource: clip.screenplay_source ?? null,
        observationGuide: clip.observation_guide ? JSON.parse(JSON.stringify(clip.observation_guide)) : undefined,
        practiceSteps: clip.practice_steps ? {
          create: clip.practice_steps.map((s) => ({
            stepNumber: s.step_number,
            skillFocus: s.skill_focus,
            instruction: s.instruction,
            tip: s.tip ?? null,
            targetDurationSec: s.target_duration_sec,
          })),
        } : undefined,
        annotations: {
          create: clip.annotations.map((a) => ({
            atSecond: a.at_second,
            note: a.note,
            type: a.type,
          })),
        },
      },
    });

    console.log(`  OK    ${clip.id} — ${clip.skill_category}/${clip.difficulty}`);
    created++;
  }

  console.log(`\n─── Clip seed complete ───`);
  console.log(`Created: ${created}`);
  console.log(`Patched: ${patched}`);
  console.log(`Skipped: ${skipped} (already complete)`);
  console.log(`Total in DB: ${await prisma.clip.count()}`);
  console.log(`PracticeSteps in DB: ${await prisma.practiceStep.count()}`);

  // Foundation curriculum seeding
  const foundationPath = path.resolve('.shared/outputs/data/foundation-curriculum.json');
  if (fs.existsSync(foundationPath)) {
    const curriculumData = JSON.parse(fs.readFileSync(foundationPath, 'utf-8'));

    for (const courseData of curriculumData.courses) {
      const course = await prisma.foundationCourse.upsert({
        where: { slug: courseData.slug },
        update: { title: courseData.title, description: courseData.description, icon: courseData.icon, color: courseData.color, order: courseData.order },
        create: { slug: courseData.slug, title: courseData.title, description: courseData.description, icon: courseData.icon, color: courseData.color, order: courseData.order },
      });

      for (const lessonData of courseData.lessons) {
        const lesson = await prisma.foundationLesson.upsert({
          where: { courseId_slug: { courseId: course.id, slug: lessonData.slug } },
          update: { title: lessonData.title, theoryHtml: lessonData.theoryHtml, order: lessonData.order },
          create: { courseId: course.id, slug: lessonData.slug, title: lessonData.title, theoryHtml: lessonData.theoryHtml, order: lessonData.order },
        });

        // Delete and re-create examples + questions
        await prisma.lessonExample.deleteMany({ where: { lessonId: lesson.id } });
        for (const ex of lessonData.examples) {
          await prisma.lessonExample.create({
            data: { lessonId: lesson.id, youtubeId: ex.youtubeId, title: ex.title, description: ex.description, startTime: ex.startTime ?? null },
          });
        }

        await prisma.quizQuestion.deleteMany({ where: { lessonId: lesson.id } });
        const quizArr = lessonData.quiz as { question: string; options: string[]; correctIndex: number; explanation: string }[];
        for (let qi = 0; qi < quizArr.length; qi++) {
          const q = quizArr[qi];
          await prisma.quizQuestion.create({
            data: { lessonId: lesson.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: qi },
          });
        }
      }
    }
    console.log('✓ Foundation curriculum seeded');
  } else {
    console.log('⚠ foundation-curriculum.json not found — skipping Foundation seed');
  }

  // Arcade challenges seeding
  const arcadePath = path.resolve('.shared/outputs/data/arcade-challenges-seed.json');
  if (fs.existsSync(arcadePath)) {
    const arcadeData = JSON.parse(fs.readFileSync(arcadePath, 'utf-8'));

    for (const bundleData of arcadeData.bundles) {
      // Upsert bundle by title
      const existing = await (prisma as any).arcadeBundle.findFirst({
        where: { title: bundleData.title },
      });

      let bundle: { id: string };
      if (existing) {
        bundle = existing;
        console.log(`  SKIP bundle "${bundleData.title}" — already exists`);
      } else {
        bundle = await (prisma as any).arcadeBundle.create({
          data: {
            title: bundleData.title,
            description: bundleData.description,
            theme: bundleData.theme,
            difficulty: bundleData.difficulty,
            xpReward: bundleData.xpReward ?? 100,
          },
        });
        console.log(`  OK   bundle "${bundleData.title}" created`);
      }

      // Seed challenges
      const existingChallengeCount = await (prisma as any).arcadeChallenge.count({
        where: { bundleId: bundle.id },
      });

      if (existingChallengeCount === 0 && bundleData.challenges?.length) {
        await (prisma as any).arcadeChallenge.createMany({
          data: bundleData.challenges.map((c: any) => ({
            bundleId: bundle.id,
            type: c.type,
            title: c.title,
            description: c.description,
            context: c.context,
            referenceImageUrl: c.referenceImageUrl ?? null,
            difficulty: c.difficulty,
            xpReward: c.xpReward ?? 20,
            orderIndex: c.orderIndex,
          })),
        });
        console.log(`    + ${bundleData.challenges.length} challenges created`);
      }
    }
    console.log('✓ Arcade challenges seeded');
  } else {
    console.log('⚠ arcade-challenges-seed.json not found — skipping Arcade seed');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
