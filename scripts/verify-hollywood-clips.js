// Verification: 48 newly imported Hollywood clips
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

(async () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/50-hollywood-clips.json'), 'utf8'));
  const ytIds = data.map(c => c.youtubeVideoId);

  const clips = await prisma.clip.findMany({
    where: { youtubeVideoId: { in: ytIds } },
    include: { practiceSteps: true, tags: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${clips.length} clips matching JSON youtubeVideoIds (expected 50; 48 new + 2 pre-existing).`);

  // Sort by createdAt; the 48 newest are the imports
  const sorted = [...clips].sort((a, b) => a.createdAt - b.createdAt);
  // Identify the "new" ones — take the 48 with most recent createdAt
  const newest = [...clips].sort((a, b) => b.createdAt - a.createdAt).slice(0, 48);

  // Show createdAt span
  if (clips.length) {
    console.log('Earliest createdAt:', sorted[0].createdAt.toISOString());
    console.log('Latest   createdAt:', sorted[sorted.length - 1].createdAt.toISOString());
  }

  const issues = [];
  let allComplete = 0;
  let missingObs = 0;
  let lt4Steps = 0;
  let stepsNoImg = 0;
  let lt3Tags = 0;

  for (const c of newest) {
    const probs = [];
    const requiredStr = ['movieTitle','characterName','actorName','sceneDescription','annotation','skillCategory','difficulty'];
    for (const f of requiredStr) {
      if (!c[f] || String(c[f]).trim() === '') probs.push(`missing ${f}`);
    }
    if (c.year == null) probs.push('missing year');
    if (c.startSec == null) probs.push('missing startSec');
    if (c.endSec == null) probs.push('missing endSec');
    if (c.startSec != null && c.endSec != null && !(c.endSec > c.startSec)) probs.push('endSec<=startSec');
    if (c.isActive !== true) probs.push('isActive!=true');

    // observationGuide
    const og = c.observationGuide;
    let ogOk = false;
    if (og && typeof og === 'object' && Array.isArray(og.moments)) {
      if (og.moments.length >= 4 && og.moments.length <= 6) ogOk = true;
      else probs.push(`observationGuide.moments=${og.moments.length} (need 4-6)`);
    } else {
      probs.push('observationGuide missing or no moments[]');
    }
    if (!ogOk) missingObs++;

    // practice steps
    if (c.practiceSteps.length < 4) {
      probs.push(`practiceSteps=${c.practiceSteps.length} (need >=4)`);
      lt4Steps++;
    }
    const noImg = c.practiceSteps.filter(s => !s.demoImageUrl || !s.demoImageUrl.includes('blob.vercel-storage')).length;
    if (noImg > 0) {
      probs.push(`${noImg} step(s) missing/non-blob demoImageUrl`);
      stepsNoImg += noImg;
    }

    // tags
    if (c.tags.length < 3) {
      probs.push(`tags=${c.tags.length} (need >=3)`);
      lt3Tags++;
    }

    if (probs.length === 0) allComplete++;
    else issues.push({ title: c.movieTitle, yt: c.youtubeVideoId, probs });
  }

  console.log('\n===== ISSUES =====');
  if (issues.length === 0) console.log('None — all 48 clips fully complete.');
  else for (const i of issues) console.log(`- [${i.title}] (${i.yt}): ${i.probs.join('; ')}`);

  console.log('\n===== SUMMARY =====');
  console.log(`Total new clips checked:           ${newest.length}`);
  console.log(`Clips with all fields complete:    ${allComplete}`);
  console.log(`Clips missing observation guide:   ${missingObs}`);
  console.log(`Clips with < 4 practice steps:     ${lt4Steps}`);
  console.log(`Steps without Vercel Blob demoImg: ${stepsNoImg}`);
  console.log(`Clips with < 3 tags:               ${lt3Tags}`);

  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
