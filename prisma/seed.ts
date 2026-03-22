/**
 * seeneyu — Prisma Database Seed
 *
 * Seeds the database with 15 curated clips from .shared/outputs/data/clips-seed.json
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
  annotations: SeedAnnotation[];
}

interface SeedFile {
  _meta: { status: string };
  clips: SeedClip[];
}

async function main() {
  const seedPath = path.resolve(
    ".shared/outputs/data/clips-seed.json"
  );

  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed file not found: ${seedPath}`);
  }

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
  let skipped = 0;

  for (const clip of seedData.clips) {
    // Upsert: safe to re-run seed without duplicating
    const existing = await prisma.clip.findFirst({
      where: { youtubeVideoId: clip.youtube_video_id },
    });

    if (existing) {
      // Patch script field if missing (M10 migration)
      if (existing.script === null && clip.script) {
        await prisma.clip.update({
          where: { id: existing.id },
          data: { script: clip.script },
        });
        console.log(`  PATCH ${clip.id} — script field updated`);
      } else {
        console.log(`  SKIP ${clip.id} — already exists`);
      }
      skipped++;
      continue;
    }

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
        annotations: {
          create: clip.annotations.map((a) => ({
            atSecond: a.at_second,
            note: a.note,
            type: a.type,
          })),
        },
      },
    });

    console.log(`  OK   ${clip.id} — ${clip.skill_category}/${clip.difficulty}`);
    created++;
  }

  console.log(`\n─── Seed complete ───`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped} (already existed)`);
  console.log(`Total in DB: ${await prisma.clip.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
