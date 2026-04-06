#!/usr/bin/env node
/**
 * generate-lab-index.js
 * Reads all thread sources.json files and regenerates lab/datasets/citations.json
 * (unified citation registry). The lab/index.html master dashboard is hand-maintained
 * but this script produces the data artifact for programmatic use.
 *
 * Usage: node scripts/generate-lab-index.js
 */

const fs = require('fs')
const path = require('path')

const threadsDir = path.join(__dirname, '..', 'lab', 'threads')
const datasetsDir = path.join(__dirname, '..', 'lab', 'datasets')

if (!fs.existsSync(datasetsDir)) fs.mkdirSync(datasetsDir, { recursive: true })

const threads = fs.readdirSync(threadsDir).filter(d =>
  fs.statSync(path.join(threadsDir, d)).isDirectory()
)

const allCitations = []
const threadSummaries = []

for (const threadId of threads.sort()) {
  const sourcesPath = path.join(threadsDir, threadId, 'sources.json')
  if (!fs.existsSync(sourcesPath)) continue

  const data = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'))

  threadSummaries.push({
    thread_id: data.thread_id,
    thread_title: data.thread_title,
    lane: data.lane,
    last_updated: data.last_updated,
    source_count: data.sources?.length ?? 0,
    key_finding: data.key_finding,
    evidence_grade_summary: data.evidence_grade_summary,
    seeneyu_relevance: data.seeneyu_relevance,
  })

  for (const src of (data.sources || [])) {
    allCitations.push({
      ...src,
      thread_id: data.thread_id,
      thread_title: data.thread_title,
    })
  }
}

const registry = {
  generated_at: new Date().toISOString(),
  total_sources: allCitations.length,
  total_threads: threadSummaries.length,
  threads: threadSummaries,
  citations: allCitations,
}

const outPath = path.join(datasetsDir, 'citations.json')
fs.writeFileSync(outPath, JSON.stringify(registry, null, 2))

console.log(`✓ Citations registry updated: lab/datasets/citations.json`)
console.log(`  ${registry.total_threads} threads · ${registry.total_sources} total sources`)
for (const t of threadSummaries) {
  console.log(`  - ${t.thread_id}: ${t.source_count} sources`)
}
