import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

/** Current consent schema version — bump when consent terms change materially. */
const CONSENT_VERSION = 1

// ── Read ────────────────────────────────────────────────────────────

export interface ConsentState {
  storageAgreed: boolean
  updatedAt: Date | null
  version: number
}

/**
 * Get the current data-consent state for a user.
 * Returns default (agreed) if no LearnerProfile exists yet.
 */
export async function getUserConsent(userId: string): Promise<ConsentState> {
  const profile = await prisma.learnerProfile.findUnique({
    where: { userId },
    select: {
      dataConsentStorageAgreed: true,
      dataConsentUpdatedAt: true,
      dataConsentVersion: true,
    },
  })

  if (!profile) {
    return { storageAgreed: true, updatedAt: null, version: CONSENT_VERSION }
  }

  return {
    storageAgreed: profile.dataConsentStorageAgreed,
    updatedAt: profile.dataConsentUpdatedAt,
    version: profile.dataConsentVersion,
  }
}

// ── Write ───────────────────────────────────────────────────────────

/**
 * Update consent preference. When switching to `false`, immediately
 * schedules cleanup of existing recordings (non-blocking).
 */
export async function updateConsent(
  userId: string,
  storageAgreed: boolean,
): Promise<ConsentState> {
  const profile = await prisma.learnerProfile.upsert({
    where: { userId },
    update: {
      dataConsentStorageAgreed: storageAgreed,
      dataConsentUpdatedAt: new Date(),
      dataConsentVersion: CONSENT_VERSION,
    },
    create: {
      userId,
      dataConsentStorageAgreed: storageAgreed,
      dataConsentUpdatedAt: new Date(),
      dataConsentVersion: CONSENT_VERSION,
    },
    select: {
      dataConsentStorageAgreed: true,
      dataConsentUpdatedAt: true,
      dataConsentVersion: true,
    },
  })

  // If user opted out, trigger immediate cleanup (fire-and-forget)
  if (!storageAgreed) {
    cleanupUserRecordings(userId).catch((err) =>
      console.error(`[consent] cleanup failed for ${userId}:`, err.message),
    )
  }

  return {
    storageAgreed: profile.dataConsentStorageAgreed,
    updatedAt: profile.dataConsentUpdatedAt,
    version: profile.dataConsentVersion,
  }
}

// ── Check ───────────────────────────────────────────────────────────

/**
 * Quick check: should we keep the recording after feedback is generated?
 * Returns true if user consents to storage, false if they opted out.
 */
export async function shouldStoreRecording(userId: string): Promise<boolean> {
  const profile = await prisma.learnerProfile.findUnique({
    where: { userId },
    select: { dataConsentStorageAgreed: true },
  })
  // Default to true if no profile exists (opt-out model)
  return profile?.dataConsentStorageAgreed ?? true
}

// ── Cleanup ─────────────────────────────────────────────────────────

/**
 * Delete all Vercel Blob recordings for a user who opted out.
 * Preserves UserSession records (scores, feedback JSON) — only removes
 * the recording files and nullifies the URLs.
 */
export async function cleanupUserRecordings(userId: string): Promise<number> {
  const sessions = await prisma.userSession.findMany({
    where: { userId, recordingUrl: { not: null } },
    select: { id: true, recordingUrl: true, recordingKey: true, frameUrls: true },
  })

  let deleted = 0

  for (const session of sessions) {
    try {
      // Delete the recording blob
      if (session.recordingUrl) {
        await del(session.recordingUrl).catch(() => {})
        deleted++
      }

      // Delete frame blobs
      if (session.frameUrls) {
        const frameUrls: string[] = JSON.parse(session.frameUrls as string)
        for (const url of frameUrls) {
          await del(url).catch(() => {})
        }
      }

      // Nullify URLs in DB (keep scores/feedback)
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          recordingUrl: null,
          recordingKey: null,
          frameUrls: null,
        },
      })
    } catch (err) {
      console.error(`[consent] failed to clean session ${session.id}:`, err)
    }
  }

  console.log(`[consent] cleaned ${deleted} recordings for user ${userId}`)
  return deleted
}

/**
 * Batch cleanup: find all users who opted out but still have recordings.
 * Called by the daily consent-cleanup cron.
 */
export async function batchCleanupOptedOutUsers(): Promise<{
  usersProcessed: number
  recordingsDeleted: number
}> {
  // Find opted-out users who still have recordings
  const optedOutProfiles = await prisma.learnerProfile.findMany({
    where: { dataConsentStorageAgreed: false },
    select: { userId: true },
  })

  let totalDeleted = 0

  for (const profile of optedOutProfiles) {
    const count = await prisma.userSession.count({
      where: { userId: profile.userId, recordingUrl: { not: null } },
    })
    if (count > 0) {
      const deleted = await cleanupUserRecordings(profile.userId)
      totalDeleted += deleted
    }
  }

  return { usersProcessed: optedOutProfiles.length, recordingsDeleted: totalDeleted }
}
