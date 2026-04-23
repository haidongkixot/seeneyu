/**
 * Batch Generate Practice Guides + Arcade Guidance
 *
 * Generates:
 * 1. Practice step images (Flux realistic) for 20 clips without images
 * 2. Arcade guidance steps (GPT) + images for challenges without guidance
 *
 * Uses Pollinations Flux-Realism model (free, no API key)
 * Uses deployed Vercel API for GPT (has OPENAI_API_KEY)
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FLUX_BASE = 'https://image.pollinations.ai/prompt';
const FLUX_MODEL = 'flux-realism';
const IMG_WIDTH = 768;
const IMG_HEIGHT = 768;

// ── Image Generation via Pollinations Flux-Realism ──────────────
// Pollinations URLs are permanent and cacheable — no need to re-upload to Blob.
// Format: https://image.pollinations.ai/prompt/{encoded}?params

function getFluxImageUrl(prompt, seed) {
  const encoded = encodeURIComponent(prompt);
  const s = seed || Math.floor(Math.random() * 999999);
  return `${FLUX_BASE}/${encoded}?width=${IMG_WIDTH}&height=${IMG_HEIGHT}&model=${FLUX_MODEL}&nologo=true&seed=${s}`;
}

async function verifyImage(url) {
  // Quick HEAD check to verify the image renders
  const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`Image check failed: ${res.status}`);
  return url;
}

// ── Practice Step Image Generation ─────────────────────────────

async function generatePracticeImages() {
  console.log('\n=== GENERATING PRACTICE STEP IMAGES ===\n');

  const steps = await prisma.practiceStep.findMany({
    where: { demoImageUrl: null },
    include: { clip: { select: { movieTitle: true, skillCategory: true, sceneDescription: true } } },
    orderBy: { clipId: 'asc' },
    take: 120, // ~20 clips x 4-6 steps
  });

  // Group by clip
  const byClip = {};
  for (const step of steps) {
    if (!byClip[step.clipId]) byClip[step.clipId] = [];
    byClip[step.clipId].push(step);
  }

  const clipIds = Object.keys(byClip).slice(0, 20);
  console.log(`Found ${steps.length} steps without images across ${Object.keys(byClip).length} clips`);
  console.log(`Processing first 20 clips (${clipIds.length} clips)\n`);

  let generated = 0;
  let failed = 0;

  for (const clipId of clipIds) {
    const clipSteps = byClip[clipId];
    const clip = clipSteps[0].clip;
    console.log(`\n[${clip.movieTitle}] (${clip.skillCategory}) — ${clipSteps.length} steps`);

    for (const step of clipSteps) {
      const prompt = `Photorealistic portrait of a person demonstrating ${step.skillFocus.toLowerCase()} body language technique. ${step.instruction.slice(0, 100)}. Professional photography, studio lighting, clean background, high quality, realistic human expression and posture.`;

      try {
        const imageUrl = getFluxImageUrl(prompt, step.stepNumber * 1000 + generated);
        await verifyImage(imageUrl);

        await prisma.practiceStep.update({
          where: { id: step.id },
          data: { demoImageUrl: imageUrl },
        });

        generated++;
        console.log(`  ✓ Step ${step.stepNumber} (${step.skillFocus})`);
      } catch (err) {
        failed++;
        console.log(`  ✗ Step ${step.stepNumber} (${step.skillFocus}) — ${err.message}`);
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\nPractice images: ${generated} generated, ${failed} failed`);
  return { generated, failed };
}

// ── Arcade Guidance Generation ─────────────────────────────────

async function generateArcadeGuidance() {
  console.log('\n=== GENERATING ARCADE GUIDANCE ===\n');

  // Find challenges without guidance (Json null check)
  const allChallenges = await prisma.arcadeChallenge.findMany({
    include: { bundle: { select: { title: true } } },
    orderBy: { orderIndex: 'asc' },
  });

  const challenges = allChallenges.filter(c => !c.guidanceSteps || (Array.isArray(c.guidanceSteps) && c.guidanceSteps.length === 0));
  console.log(`Found ${challenges.length} challenges without guidance (of ${allChallenges.length} total)\n`);

  let generated = 0;
  let failed = 0;

  for (const challenge of challenges) {
    console.log(`[${challenge.title}] (${challenge.type}, ${challenge.difficulty})`);

    // Generate guidance steps based on challenge data
    const steps = generateGuidanceFromChallenge(challenge);

    // Generate images for each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const prompt = `Photorealistic portrait of a person demonstrating ${challenge.type === 'facial' ? 'facial expression' : 'body gesture'}: ${step.instruction.slice(0, 80)}. Professional photography, studio lighting, clean background, realistic human, high quality portrait.`;

      try {
        const imageUrl = getFluxImageUrl(prompt, generated * 100 + step.stepNumber);
        await verifyImage(imageUrl);
        steps[i].imageUrl = imageUrl;
        console.log(`  ✓ Step ${step.stepNumber} image generated`);
      } catch (err) {
        console.log(`  ✗ Step ${step.stepNumber} image failed: ${err.message}`);
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    // Save guidance to DB
    try {
      await prisma.arcadeChallenge.update({
        where: { id: challenge.id },
        data: { guidanceSteps: steps },
      });
      generated++;
      console.log(`  ✓ Saved ${steps.length} guidance steps`);
    } catch (err) {
      failed++;
      console.log(`  ✗ Save failed: ${err.message}`);
    }
  }

  console.log(`\nArcade guidance: ${generated} generated, ${failed} failed`);
  return { generated, failed };
}

// ── Generate guidance steps from challenge data (no GPT needed) ──

function generateGuidanceFromChallenge(challenge) {
  const isFacial = challenge.type === 'facial';
  const desc = challenge.description || '';
  const title = challenge.title || '';

  // Parse the description to create 3 guidance steps
  const steps = [];

  if (isFacial) {
    steps.push({
      stepNumber: 1,
      instruction: `Start with a neutral, relaxed face. Release any tension in your jaw, forehead, and around your eyes. Take a deep breath.`,
      tip: 'A neutral baseline makes the expression more impactful when you transition into it.',
      imageUrl: null,
      voiceUrl: null,
    });
    steps.push({
      stepNumber: 2,
      instruction: `Now gradually transition into the expression: ${title.toLowerCase()}. Focus on the key muscle groups — ${desc.slice(0, 120)}.`,
      tip: 'Move slowly and deliberately. The transition should feel natural, not sudden.',
      imageUrl: null,
      voiceUrl: null,
    });
    steps.push({
      stepNumber: 3,
      instruction: `Hold the full expression for 3-5 seconds. Make sure it reads clearly — check that your eyes, mouth, and eyebrows are all engaged.`,
      tip: 'The hold is where the score matters most. Commit fully to the expression.',
      imageUrl: null,
      voiceUrl: null,
    });
  } else {
    // Gesture challenges
    steps.push({
      stepNumber: 1,
      instruction: `Stand with feet shoulder-width apart, shoulders back, chin level. Establish a confident, grounded base position.`,
      tip: 'Your base posture sets the foundation for every gesture.',
      imageUrl: null,
      voiceUrl: null,
    });
    steps.push({
      stepNumber: 2,
      instruction: `Perform the gesture: ${title.toLowerCase()}. ${desc.slice(0, 120)}. Keep your movements deliberate and controlled.`,
      tip: 'Use the space between your waist and shoulders — the power gesture zone.',
      imageUrl: null,
      voiceUrl: null,
    });
    steps.push({
      stepNumber: 3,
      instruction: `Hold the final position for 3-5 seconds with confidence. Your body should feel open and stable, with weight evenly distributed.`,
      tip: 'Stillness at the end communicates conviction. Avoid fidgeting.',
      imageUrl: null,
      voiceUrl: null,
    });
  }

  return steps;
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('=== BATCH GENERATION SCRIPT ===');
  console.log('Using Flux-Realism model via Pollinations (free, realistic style)');
  console.log('Time: ' + new Date().toISOString());
  console.log('');

  const practiceResult = await generatePracticeImages();
  const arcadeResult = await generateArcadeGuidance();

  console.log('\n=== SUMMARY ===');
  console.log(`Practice images: ${practiceResult.generated} generated, ${practiceResult.failed} failed`);
  console.log(`Arcade guidance: ${arcadeResult.generated} generated, ${arcadeResult.failed} failed`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
