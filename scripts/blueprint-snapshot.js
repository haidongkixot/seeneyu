/**
 * blueprint-snapshot.js
 * Snapshots the live blueprint at d:/Claude Projects/seeneyu-blueprint.md
 * into .blueprint-versions/ with a timestamped filename, then appends a
 * row to VERSIONS.md.
 *
 * Usage:
 *   node scripts/blueprint-snapshot.js v1.2.0 "Added X feature"
 *
 * Version format: vMAJOR.MINOR.PATCH (e.g. v1.2.0)
 */

const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..')
const LIVE_BLUEPRINT = path.resolve(REPO_ROOT, '..', 'seeneyu-blueprint.md')
const VERSIONS_DIR = path.resolve(REPO_ROOT, '.blueprint-versions')
const VERSIONS_INDEX = path.resolve(VERSIONS_DIR, 'VERSIONS.md')

const [, , version, ...descParts] = process.argv
const description = descParts.join(' ').trim()

if (!version || !description) {
  console.error('Usage: node scripts/blueprint-snapshot.js <version> "<description>"')
  console.error('Example: node scripts/blueprint-snapshot.js v1.2.0 "Added recurring reviews"')
  process.exit(1)
}

if (!/^v\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Invalid version format: ${version}. Use vMAJOR.MINOR.PATCH (e.g. v1.2.0).`)
  process.exit(1)
}

if (!fs.existsSync(LIVE_BLUEPRINT)) {
  console.error(`Live blueprint not found at: ${LIVE_BLUEPRINT}`)
  process.exit(1)
}

if (!fs.existsSync(VERSIONS_DIR)) {
  fs.mkdirSync(VERSIONS_DIR, { recursive: true })
}

// Build snapshot filename: v1.2.0_2026-04-08_added-recurring-reviews.md
const date = new Date().toISOString().slice(0, 10)
const slug = description
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .split(/\s+/)
  .slice(0, 6)
  .join('-')
const filename = `${version}_${date}_${slug}.md`
const targetPath = path.join(VERSIONS_DIR, filename)

if (fs.existsSync(targetPath)) {
  console.error(`Snapshot already exists: ${filename}`)
  process.exit(1)
}

// Copy the blueprint
fs.copyFileSync(LIVE_BLUEPRINT, targetPath)
const sizeKb = (fs.statSync(targetPath).size / 1024).toFixed(1)
console.log(`✓ Snapshot saved: .blueprint-versions/${filename} (${sizeKb}KB)`)

// Append row to VERSIONS.md (skip if a row for this version already exists)
if (fs.existsSync(VERSIONS_INDEX)) {
  let index = fs.readFileSync(VERSIONS_INDEX, 'utf8')
  if (index.includes(`| ${version}  |`) || index.includes(`| ${version} |`)) {
    console.log(`✓ VERSIONS.md already has a row for ${version} — leaving it untouched`)
    console.log(`\nNext: commit the snapshot with:`)
    console.log(`  git add .blueprint-versions/${filename}`)
    console.log(`  git commit -m "Blueprint snapshot ${version}: ${description}"`)
    process.exit(0)
  }
  // Get latest commit hash for traceability
  let commit = ''
  try {
    const { execSync } = require('child_process')
    commit = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT }).toString().trim()
  } catch { /* ignore */ }
  const row = `| ${version}  | ${date} | ${description} | \`${commit}\` |\n`

  // Insert after the table header (look for the second |---| line ending)
  const tableRowMarker = '|---------|------|-------------|'
  const idx = index.indexOf(tableRowMarker)
  if (idx >= 0) {
    const insertAt = index.indexOf('\n', idx) + 1
    // Find first data row to insert before it
    const firstRowIdx = index.indexOf('\n', insertAt) + 1
    index = index.slice(0, firstRowIdx) + row + index.slice(firstRowIdx)
  } else {
    index += '\n' + row
  }
  fs.writeFileSync(VERSIONS_INDEX, index)
  console.log(`✓ VERSIONS.md updated`)
}

console.log(`\nNext: commit the snapshot with:`)
console.log(`  git add .blueprint-versions/${filename} .blueprint-versions/VERSIONS.md`)
console.log(`  git commit -m "Blueprint snapshot ${version}: ${description}"`)
