#!/usr/bin/env node
/**
 * init-thread.js
 * Scaffolds a new research thread directory with empty sources.json
 *
 * Usage: node scripts/init-thread.js <id> "<title>" [social|clinical|social-clinical]
 * Example: node scripts/init-thread.js 05-spaced-repetition "Spaced Repetition & Long-term Retention" social
 */

const fs = require('fs')
const path = require('path')

const id = process.argv[2]
const title = process.argv[3]
const lane = process.argv[4] || 'social'

if (!id || !title) {
  console.error('Usage: node scripts/init-thread.js <id> "<title>" [social|clinical|social-clinical]')
  process.exit(1)
}

const threadDir = path.join(__dirname, '..', 'lab', 'threads', id)

if (fs.existsSync(threadDir)) {
  console.error(`Thread directory already exists: ${threadDir}`)
  process.exit(1)
}

fs.mkdirSync(threadDir, { recursive: true })

const sources = {
  thread_id: id,
  thread_title: title,
  seeneyu_relevance: "TODO: Describe how this thread connects to seeneyu's core loop.",
  lane,
  last_updated: new Date().toISOString().split('T')[0],
  hypothesis: "TODO: State the hypothesis before searching.",
  key_finding: "TODO: Fill after research complete.",
  evidence_grade_summary: "TODO: Fill after research complete.",
  sources: [
    {
      id: "src_001",
      authors: ["Author, A."],
      year: 2000,
      title: "Paper title",
      journal: "Journal Name",
      volume: "1(1)",
      pages: "1–10",
      doi: "10.xxxx/xxxxx",
      url: "https://",
      evidence_grade: "B",
      key_finding: "TODO",
      seeneyu_application: "TODO",
      quote: "TODO"
    }
  ]
}

fs.writeFileSync(
  path.join(threadDir, 'sources.json'),
  JSON.stringify(sources, null, 2)
)

const htmlStub = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title} — Coach Noey's Lab</title>
</head>
<body>
<p>Thread in progress. Run research and generate this page.</p>
<a href="../index.html">Back to Lab</a>
</body>
</html>`

fs.writeFileSync(path.join(threadDir, 'index.html'), htmlStub)

console.log(`✓ Thread scaffolded: lab/threads/${id}/`)
console.log(`  sources.json — fill with research findings`)
console.log(`  index.html   — replace with full HTML after research`)
console.log(`\nNext: Run generate-lab-index.js to update the master dashboard.`)
