/**
 * CRIT-001 remediation: deletes all Vercel Blob files under the legacy
 * publicly-enumerable prefixes (recordings/, frames/, micro/).
 *
 * New uploads use opaque per-user UUID paths + addRandomSuffix, so the old
 * predictable clipId/timestamp prefixes become orphans after this runs.
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=... npx tsx scripts/delete-legacy-recordings.ts [--dry-run]
 */
import { list, del } from '@vercel/blob'

const LEGACY_PREFIXES = ['recordings/', 'frames/', 'micro/']
const BATCH_SIZE = 200

const dryRun = process.argv.includes('--dry-run')

async function run() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Missing BLOB_READ_WRITE_TOKEN env var.')
    process.exit(1)
  }

  let totalFound = 0
  let totalDeleted = 0

  for (const prefix of LEGACY_PREFIXES) {
    console.log(`\n— Scanning prefix "${prefix}" —`)
    let cursor: string | undefined
    while (true) {
      const page: any = await list({ prefix, cursor, limit: BATCH_SIZE })
      const blobs: Array<{ url: string; pathname: string; size: number }> = page.blobs ?? []
      if (blobs.length === 0) break

      // Heuristic: legacy = path segment 2 is NOT a cuid-style userId (starts "c").
      // New uploads go under recordings/{userId}/{uuid} where userId starts with "c"
      // (Prisma cuid). Legacy path was recordings/{clipId}/{timestamp}.webm.
      const legacy = blobs.filter(b => {
        const parts = b.pathname.split('/')
        const second = parts[1] || ''
        // Flag as legacy if second segment looks like a clipId (legacy) rather than userId.
        // Since both use cuid, fall back to filename pattern: legacy files are just "<digits>.webm"
        const name = parts[parts.length - 1] || ''
        const isLegacyName = /^\d+(_[0-9a-z]+)?\.(webm|jpg|mp4)$/i.test(name)
        return isLegacyName
      })

      totalFound += legacy.length
      if (legacy.length > 0) {
        console.log(`  found ${legacy.length} legacy blobs in this page (of ${blobs.length})`)
        if (!dryRun) {
          for (const b of legacy) {
            try {
              await del(b.url)
              totalDeleted++
            } catch (err) {
              console.warn(`  del failed for ${b.pathname}: ${(err as Error).message}`)
            }
          }
        }
      }

      cursor = page.cursor
      if (!cursor) break
    }
  }

  console.log(`\nDone. Legacy blobs found: ${totalFound}${dryRun ? '' : `, deleted: ${totalDeleted}`}`)
  if (dryRun) console.log('(dry run — re-run without --dry-run to actually delete)')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
