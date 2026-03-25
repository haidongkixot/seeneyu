const PptxGenJS = require('pptxgenjs')
const path = require('path')

const pptx = new PptxGenJS()

// ── Brand Colors ──────────────────────────────────────────────────────
const DARK = '0d0d14'
const DARK_SURFACE = '13131e'
const DARK_ELEVATED = '1c1c2e'
const AMBER = 'fbbf24'
const AMBER_DIM = 'b45309'
const WHITE = 'f4f4f8'
const GREY = '9898b0'
const GREY_DIM = '5c5c72'
const GREEN = '22c55e'
const RED = 'ef4444'
const VIOLET = '7c3aed'
const CYAN = '0891b2'

pptx.layout = 'LAYOUT_WIDE' // 16:9
pptx.author = 'seeneyu / PeeTeeAI'
pptx.company = 'PeeTeeAI'
pptx.subject = 'seeneyu Seed Round Pitch Deck'
pptx.title = 'seeneyu — Seed Round'

// ── Helpers ───────────────────────────────────────────────────────────

function addBg(slide) {
  slide.background = { color: DARK }
}

function addPageNum(slide, num) {
  slide.addText(String(num), {
    x: 12.4, y: 7.0, w: 0.6, h: 0.3,
    fontSize: 9, color: GREY_DIM, fontFace: 'Calibri', align: 'right'
  })
}

function titleSlide(slide, title, num) {
  addBg(slide)
  slide.addText(title, {
    x: 0.5, y: 0.3, w: 12, h: 0.7,
    fontSize: 28, bold: true, color: AMBER, fontFace: 'Calibri'
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 1.0, w: 1.2, h: 0.04, fill: { color: AMBER }
  })
  addPageNum(slide, num)
  return slide
}

function bulletList(items, opts = {}) {
  return items.map(item => ({
    text: item,
    options: {
      fontSize: opts.fontSize || 16,
      color: opts.color || WHITE,
      fontFace: 'Calibri',
      bullet: { type: 'bullet', color: AMBER },
      paraSpaceAfter: 8,
      lineSpacingMultiple: 1.3,
    }
  }))
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 1: COVER
// ══════════════════════════════════════════════════════════════════════
const s1 = pptx.addSlide()
addBg(s1)

s1.addText('seeneyu', {
  x: 1, y: 1.8, w: 8, h: 1.2,
  fontSize: 64, bold: true, color: AMBER, fontFace: 'Calibri'
})
s1.addText('Watch great performers. Become one.', {
  x: 1, y: 3.1, w: 8, h: 0.6,
  fontSize: 24, color: WHITE, fontFace: 'Calibri'
})
s1.addText('The AI-powered body language coaching platform', {
  x: 1, y: 3.8, w: 8, h: 0.5,
  fontSize: 16, color: GREY, fontFace: 'Calibri'
})
s1.addText('seeneyu.vercel.app', {
  x: 1, y: 4.5, w: 4, h: 0.4,
  fontSize: 14, color: GREY_DIM, fontFace: 'Calibri'
})
s1.addText('SEED ROUND  —  $1.5M', {
  x: 1, y: 5.8, w: 4, h: 0.5,
  fontSize: 18, bold: true, color: AMBER, fontFace: 'Calibri'
})
s1.addText('by PeeTeeAI', {
  x: 1, y: 6.4, w: 4, h: 0.4,
  fontSize: 12, color: GREY_DIM, fontFace: 'Calibri'
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 2: PROBLEM
// ══════════════════════════════════════════════════════════════════════
const s2 = titleSlide(pptx.addSlide(), 'The Problem', 2)

s2.addText('55% of communication is body language.\nYet there is no way to practice it.', {
  x: 0.5, y: 1.4, w: 12, h: 1.0,
  fontSize: 24, bold: true, color: WHITE, fontFace: 'Calibri', lineSpacingMultiple: 1.4
})

s2.addText(bulletList([
  'Professionals read books, watch TED Talks, attend workshops — then forget everything in a week',
  '$370B spent on corporate training globally — yet soft skills ROI is unmeasurable',
  '89% of hiring failures are due to poor soft skills, not technical ability',
  '73% of employers rank communication as the #1 skill they look for',
  'No Duolingo for body language. No gym. No structured practice system.',
]), {
  x: 0.5, y: 2.6, w: 12, h: 4.0,
  valign: 'top'
})

s2.addText('"In every high-stakes room — job interviews, board meetings, investor pitches —\nyour body speaks before you do."', {
  x: 0.5, y: 6.2, w: 12, h: 0.7,
  fontSize: 14, italic: true, color: GREY, fontFace: 'Calibri'
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 3: SOLUTION
// ══════════════════════════════════════════════════════════════════════
const s3 = titleSlide(pptx.addSlide(), 'The Solution — seeneyu', 3)

s3.addText('The first AI-powered body language coaching platform.\nLearn from Hollywood\'s greatest performers.', {
  x: 0.5, y: 1.4, w: 12, h: 0.8,
  fontSize: 20, color: WHITE, fontFace: 'Calibri', lineSpacingMultiple: 1.4
})

const flowY = 2.8
const boxW = 2.5
const boxH = 2.2
const gap = 0.4
const startX = 0.8
const colors = [AMBER, VIOLET, GREEN, CYAN]
const steps = [
  { title: 'WATCH', desc: 'Study curated Hollywood clips demonstrating a specific skill' },
  { title: 'OBSERVE', desc: 'AI-guided breakdown: what to look for, when, and why' },
  { title: 'RECORD', desc: 'Turn on your webcam. Mimic the behavior. 10–30 seconds.' },
  { title: 'FEEDBACK', desc: 'Instant AI coaching scored across 5 dimensions — specific to the second' },
]

steps.forEach((step, i) => {
  const x = startX + i * (boxW + gap)
  s3.addShape(pptx.ShapeType.roundRect, {
    x, y: flowY, w: boxW, h: boxH,
    fill: { color: DARK_SURFACE },
    line: { color: colors[i], width: 1.5 },
    rectRadius: 0.15
  })
  s3.addText(step.title, {
    x, y: flowY + 0.2, w: boxW, h: 0.5,
    fontSize: 16, bold: true, color: colors[i], fontFace: 'Calibri', align: 'center'
  })
  s3.addText(step.desc, {
    x: x + 0.15, y: flowY + 0.8, w: boxW - 0.3, h: 1.2,
    fontSize: 12, color: GREY, fontFace: 'Calibri', align: 'center', lineSpacingMultiple: 1.3
  })
  if (i < 3) {
    s3.addText('→', {
      x: x + boxW, y: flowY + 0.8, w: gap, h: 0.5,
      fontSize: 22, color: GREY_DIM, fontFace: 'Calibri', align: 'center'
    })
  }
})

s3.addText('↻  Repeat until the skill becomes muscle memory', {
  x: 0.5, y: 5.4, w: 12, h: 0.5,
  fontSize: 14, color: AMBER, fontFace: 'Calibri', align: 'center', bold: true
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 4: PRODUCT
// ══════════════════════════════════════════════════════════════════════
const s4 = titleSlide(pptx.addSlide(), 'The Product — Live Today', 4)

s4.addText('seeneyu.vercel.app', {
  x: 0.5, y: 1.3, w: 6, h: 0.4,
  fontSize: 14, color: AMBER, fontFace: 'Calibri'
})

const features = [
  ['65+ Curated Clips', 'From 38 films across 5 skill categories and 3 difficulty levels'],
  ['AI Feedback Engine', 'MediaPipe body mesh + GPT-4o Vision → frame-level coaching'],
  ['Foundation Courses', '3 courses, 30 lessons with theory, video examples, and quizzes'],
  ['Arcade Zone', '30 quick challenges — facial expression & gesture practice with instant scoring'],
  ['Micro-Practice', 'Step-by-step skill breakdown with 30-second focused recordings'],
  ['Learning Path', 'Onboarding assessment → personalized skill progression dashboard'],
]

features.forEach((f, i) => {
  const col = i % 2
  const row = Math.floor(i / 2)
  const x = 0.5 + col * 6.2
  const y = 2.0 + row * 1.6

  s4.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 5.8, h: 1.3,
    fill: { color: DARK_SURFACE },
    line: { color: DARK_ELEVATED, width: 1 },
    rectRadius: 0.1
  })
  s4.addText(f[0], {
    x: x + 0.3, y: y + 0.15, w: 5.2, h: 0.4,
    fontSize: 15, bold: true, color: AMBER, fontFace: 'Calibri'
  })
  s4.addText(f[1], {
    x: x + 0.3, y: y + 0.6, w: 5.2, h: 0.5,
    fontSize: 12, color: GREY, fontFace: 'Calibri', lineSpacingMultiple: 1.2
  })
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 5: MARKET OPPORTUNITY
// ══════════════════════════════════════════════════════════════════════
const s5 = titleSlide(pptx.addSlide(), 'Market Opportunity', 5)

s5.addText('$30B+ professional development market with zero body language practice products.', {
  x: 0.5, y: 1.4, w: 12, h: 0.5,
  fontSize: 18, color: WHITE, fontFace: 'Calibri'
})

const circleData = [
  { label: 'TAM', value: '$30B', desc: 'Global professional\ndevelopment & coaching', size: 3.0, x: 2.5, color: DARK_ELEVATED, border: GREY_DIM },
  { label: 'SAM', value: '$8B', desc: 'Online professional skills\n(US + Western Europe)', size: 2.3, x: 5.5, color: DARK_SURFACE, border: AMBER_DIM },
  { label: 'SOM', value: '$120M', desc: '100K paid users\n~$100 avg ARR (3yr)', size: 1.7, x: 8.5, color: DARK, border: AMBER },
]

circleData.forEach(c => {
  const cy = 3.8
  s5.addShape(pptx.ShapeType.ellipse, {
    x: c.x - c.size / 2, y: cy - c.size / 2, w: c.size, h: c.size,
    fill: { color: c.color },
    line: { color: c.border, width: 2 }
  })
  s5.addText(c.label, {
    x: c.x - 1, y: cy - 0.9, w: 2, h: 0.4,
    fontSize: 12, bold: true, color: AMBER, fontFace: 'Calibri', align: 'center'
  })
  s5.addText(c.value, {
    x: c.x - 1, y: cy - 0.5, w: 2, h: 0.5,
    fontSize: 24, bold: true, color: WHITE, fontFace: 'Calibri', align: 'center'
  })
  s5.addText(c.desc, {
    x: c.x - 1.2, y: cy + 0.1, w: 2.4, h: 0.7,
    fontSize: 10, color: GREY, fontFace: 'Calibri', align: 'center', lineSpacingMultiple: 1.2
  })
})

s5.addText('Sources: Grand View Research 2024, Statista Corporate Training Report 2024', {
  x: 0.5, y: 6.5, w: 12, h: 0.3,
  fontSize: 9, color: GREY_DIM, fontFace: 'Calibri'
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 6: BUSINESS MODEL
// ══════════════════════════════════════════════════════════════════════
const s6 = titleSlide(pptx.addSlide(), 'Business Model', 6)

s6.addText('SaaS subscription — B2C first, expanding to B2B and Enterprise.', {
  x: 0.5, y: 1.4, w: 12, h: 0.5,
  fontSize: 18, color: WHITE, fontFace: 'Calibri'
})

const tableRows = [
  [
    { text: 'Tier', options: { bold: true, color: DARK, fill: { color: AMBER }, fontSize: 14 } },
    { text: 'Price', options: { bold: true, color: DARK, fill: { color: AMBER }, fontSize: 14 } },
    { text: 'Features', options: { bold: true, color: DARK, fill: { color: AMBER }, fontSize: 14 } },
    { text: 'Target', options: { bold: true, color: DARK, fill: { color: AMBER }, fontSize: 14 } },
  ],
  [
    { text: 'Basic', options: { color: WHITE, fill: { color: DARK_SURFACE }, fontSize: 13 } },
    { text: 'Free', options: { color: GREEN, fill: { color: DARK_SURFACE }, fontSize: 13, bold: true } },
    { text: '5s recordings, limited feedback, 3 arcade challenges', options: { color: GREY, fill: { color: DARK_SURFACE }, fontSize: 12 } },
    { text: 'Trial users', options: { color: GREY, fill: { color: DARK_SURFACE }, fontSize: 12 } },
  ],
  [
    { text: 'Standard', options: { color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: '$12/mo', options: { color: AMBER, fill: { color: DARK_ELEVATED }, fontSize: 13, bold: true } },
    { text: '30s recordings, full AI feedback, all content', options: { color: GREY, fill: { color: DARK_ELEVATED }, fontSize: 12 } },
    { text: 'Individual professionals', options: { color: GREY, fill: { color: DARK_ELEVATED }, fontSize: 12 } },
  ],
  [
    { text: 'Advanced', options: { color: WHITE, fill: { color: DARK_SURFACE }, fontSize: 13 } },
    { text: '$29/mo', options: { color: AMBER, fill: { color: DARK_SURFACE }, fontSize: 13, bold: true } },
    { text: '3min recordings, VIP content, monthly coach summary', options: { color: GREY, fill: { color: DARK_SURFACE }, fontSize: 12 } },
    { text: 'Power users', options: { color: GREY, fill: { color: DARK_SURFACE }, fontSize: 12 } },
  ],
  [
    { text: 'Enterprise', options: { color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: 'Custom', options: { color: AMBER, fill: { color: DARK_ELEVATED }, fontSize: 13, bold: true } },
    { text: 'SCORM/LMS, analytics, bulk seats, SSO', options: { color: GREY, fill: { color: DARK_ELEVATED }, fontSize: 12 } },
    { text: 'L&D teams', options: { color: GREY, fill: { color: DARK_ELEVATED }, fontSize: 12 } },
  ],
]

s6.addTable(tableRows, {
  x: 0.5, y: 2.2, w: 12, h: 3.5,
  colW: [2, 1.8, 5, 3.2],
  border: { type: 'solid', color: DARK_ELEVATED, pt: 1 },
  fontFace: 'Calibri',
  rowH: [0.5, 0.6, 0.6, 0.6, 0.6],
})

s6.addText('Unit economics: ~$100 blended ARR · <$5 AI cost per user/month · >80% gross margin at scale', {
  x: 0.5, y: 6.2, w: 12, h: 0.4,
  fontSize: 13, color: GREY, fontFace: 'Calibri'
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 7: COMPETITIVE LANDSCAPE
// ══════════════════════════════════════════════════════════════════════
const s7 = titleSlide(pptx.addSlide(), 'Competitive Landscape', 7)

s7.addText('seeneyu is the only product combining active practice + AI feedback + full body language.', {
  x: 0.5, y: 1.4, w: 12, h: 0.5,
  fontSize: 18, color: WHITE, fontFace: 'Calibri'
})

const matrixX = 1.5, matrixY = 2.2, matrixW = 10, matrixH = 4.5

s7.addShape(pptx.ShapeType.rect, { x: matrixX, y: matrixY, w: matrixW / 2, h: matrixH / 2, fill: { color: DARK_SURFACE } })
s7.addShape(pptx.ShapeType.rect, { x: matrixX + matrixW / 2, y: matrixY, w: matrixW / 2, h: matrixH / 2, fill: { color: DARK_ELEVATED } })
s7.addShape(pptx.ShapeType.rect, { x: matrixX, y: matrixY + matrixH / 2, w: matrixW / 2, h: matrixH / 2, fill: { color: DARK_ELEVATED } })
s7.addShape(pptx.ShapeType.rect, { x: matrixX + matrixW / 2, y: matrixY + matrixH / 2, w: matrixW / 2, h: matrixH / 2, fill: { color: DARK_SURFACE } })

s7.addText('Full Body Language ←                                          → Speech Only', {
  x: matrixX, y: matrixY + matrixH + 0.1, w: matrixW, h: 0.3,
  fontSize: 10, color: GREY, fontFace: 'Calibri', align: 'center'
})
s7.addText('Active Practice\n+ AI Feedback', {
  x: matrixX - 1.5, y: matrixY + 0.3, w: 1.4, h: 0.8,
  fontSize: 9, color: GREY, fontFace: 'Calibri', align: 'center'
})
s7.addText('Passive Content\n(No Practice)', {
  x: matrixX - 1.5, y: matrixY + matrixH - 1.2, w: 1.4, h: 0.8,
  fontSize: 9, color: GREY, fontFace: 'Calibri', align: 'center'
})

const competitors = [
  { name: '★ seeneyu', x: matrixX + 1.2, y: matrixY + 0.6, color: AMBER, size: 14, bold: true },
  { name: 'Yoodli', x: matrixX + matrixW - 2.5, y: matrixY + 1.0, color: GREY, size: 11, bold: false },
  { name: 'Poised', x: matrixX + matrixW - 1.5, y: matrixY + 1.5, color: GREY, size: 11, bold: false },
  { name: 'Speeko', x: matrixX + matrixW - 2.0, y: matrixY + 1.8, color: GREY, size: 11, bold: false },
  { name: 'Orai', x: matrixX + matrixW - 3.0, y: matrixY + 2.0, color: GREY_DIM, size: 10, bold: false },
  { name: 'Udemy', x: matrixX + 2.5, y: matrixY + matrixH - 1.5, color: GREY_DIM, size: 10, bold: false },
  { name: 'LinkedIn\nLearning', x: matrixX + matrixW - 2.5, y: matrixY + matrixH - 1.5, color: GREY_DIM, size: 10, bold: false },
  { name: 'Toastmasters', x: matrixX + matrixW - 1.0, y: matrixY + matrixH - 0.8, color: GREY_DIM, size: 10, bold: false },
]

competitors.forEach(c => {
  s7.addText(c.name, {
    x: c.x, y: c.y, w: 1.6, h: 0.5,
    fontSize: c.size, bold: c.bold, color: c.color, fontFace: 'Calibri', align: 'center'
  })
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 8: GO-TO-MARKET
// ══════════════════════════════════════════════════════════════════════
const s8 = titleSlide(pptx.addSlide(), 'Go-to-Market Strategy', 8)

const phases = [
  {
    title: 'PHASE 1 — B2C Growth',
    timeline: 'Months 1–6',
    items: [
      'Product Hunt launch + tech press coverage',
      'Content marketing: body language tips on TikTok, YouTube, LinkedIn',
      'SEO: "body language practice", "AI communication coach"',
      'Influencer partnerships (career coaches, public speaking creators)',
    ],
    color: AMBER
  },
  {
    title: 'PHASE 2 — B2B Pilots',
    timeline: 'Months 6–12',
    items: [
      'Outbound to L&D teams at mid-market companies',
      'Sales enablement use case (objection handling, presence)',
      'Team analytics dashboard + manager reporting',
      'Case studies from Phase 1 power users',
    ],
    color: VIOLET
  },
  {
    title: 'PHASE 3 — Enterprise',
    timeline: 'Months 12–24',
    items: [
      'SCORM/LMS integration for enterprise LMS platforms',
      'Custom content creation for company-specific scenarios',
      'SSO, compliance, dedicated support tier',
      'International expansion (localized clips, multi-language)',
    ],
    color: CYAN
  },
]

phases.forEach((phase, i) => {
  const x = 0.5 + i * 4.2
  const y = 1.6

  s8.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 3.8, h: 5.0,
    fill: { color: DARK_SURFACE },
    line: { color: phase.color, width: 1.5 },
    rectRadius: 0.1
  })
  s8.addText(phase.title, {
    x: x + 0.2, y: y + 0.2, w: 3.4, h: 0.5,
    fontSize: 14, bold: true, color: phase.color, fontFace: 'Calibri'
  })
  s8.addText(phase.timeline, {
    x: x + 0.2, y: y + 0.7, w: 3.4, h: 0.3,
    fontSize: 11, color: GREY, fontFace: 'Calibri'
  })
  s8.addText(
    phase.items.map(item => ({ text: item, options: { fontSize: 12, color: WHITE, fontFace: 'Calibri', bullet: { type: 'bullet', color: phase.color }, paraSpaceAfter: 6, lineSpacingMultiple: 1.2 } })),
    { x: x + 0.2, y: y + 1.2, w: 3.4, h: 3.5, valign: 'top' }
  )
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 9: TRACTION
// ══════════════════════════════════════════════════════════════════════
const s9 = titleSlide(pptx.addSlide(), 'Traction & Milestones', 9)

s9.addText('Live product. Full feature set. Built in <30 days.', {
  x: 0.5, y: 1.4, w: 12, h: 0.5,
  fontSize: 20, bold: true, color: WHITE, fontFace: 'Calibri'
})

const metrics = [
  { value: '65+', label: 'Curated Clips', sub: '38 films, 5 skills, 3 levels' },
  { value: '30', label: 'Lessons', sub: '3 Foundation courses with quizzes' },
  { value: '30', label: 'Arcade Challenges', sub: 'Quick practice with AI scoring' },
  { value: '20', label: 'Milestones Shipped', sub: 'End-to-end product in <30 days' },
]

metrics.forEach((m, i) => {
  const x = 0.5 + i * 3.1
  const y = 2.4

  s9.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 2.8, h: 2.0,
    fill: { color: DARK_SURFACE },
    line: { color: DARK_ELEVATED, width: 1 },
    rectRadius: 0.1
  })
  s9.addText(m.value, {
    x, y: y + 0.2, w: 2.8, h: 0.7,
    fontSize: 36, bold: true, color: AMBER, fontFace: 'Calibri', align: 'center'
  })
  s9.addText(m.label, {
    x, y: y + 0.9, w: 2.8, h: 0.4,
    fontSize: 14, bold: true, color: WHITE, fontFace: 'Calibri', align: 'center'
  })
  s9.addText(m.sub, {
    x, y: y + 1.3, w: 2.8, h: 0.4,
    fontSize: 10, color: GREY, fontFace: 'Calibri', align: 'center'
  })
})

s9.addText('Next 12 Months', {
  x: 0.5, y: 4.8, w: 12, h: 0.4,
  fontSize: 14, bold: true, color: AMBER, fontFace: 'Calibri'
})

s9.addText(bulletList([
  'Q2 2026: Access control + subscription tiers (Basic/Standard/Advanced)',
  'Q3 2026: Mobile app (iOS + Android), streak system, social features',
  'Q4 2026: Enterprise pilots, SCORM integration, custom content tools',
  'Q1 2027: 200+ clips, international expansion, Series A preparation',
], { fontSize: 13, color: GREY }), {
  x: 0.5, y: 5.3, w: 12, h: 2.0,
  valign: 'top'
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 10: TECHNOLOGY
// ══════════════════════════════════════════════════════════════════════
const s10 = titleSlide(pptx.addSlide(), 'Technology & Defensibility', 10)

s10.addText('AI-native architecture with a data flywheel.', {
  x: 0.5, y: 1.4, w: 12, h: 0.5,
  fontSize: 20, color: WHITE, fontFace: 'Calibri'
})

const techItems = [
  { title: 'MediaPipe', desc: '478 facial landmarks + full body skeletal mesh from webcam frames', color: GREEN },
  { title: 'GPT-4o Vision', desc: 'Multimodal AI interprets body language against coaching rubrics', color: VIOLET },
  { title: 'Content Pipeline', desc: 'YouTube API + AI relevance scoring discovers training clips at scale', color: CYAN },
  { title: 'Next.js + Prisma', desc: 'Production stack: App Router, PostgreSQL, Vercel edge deployment', color: GREY },
]

techItems.forEach((t, i) => {
  const x = 0.5 + (i % 2) * 6.2
  const y = 2.2 + Math.floor(i / 2) * 1.5

  s10.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 5.8, h: 1.2,
    fill: { color: DARK_SURFACE },
    line: { color: t.color, width: 1.5 },
    rectRadius: 0.1
  })
  s10.addText(t.title, {
    x: x + 0.3, y: y + 0.15, w: 5.2, h: 0.4,
    fontSize: 15, bold: true, color: t.color, fontFace: 'Calibri'
  })
  s10.addText(t.desc, {
    x: x + 0.3, y: y + 0.6, w: 5.2, h: 0.4,
    fontSize: 12, color: GREY, fontFace: 'Calibri'
  })
})

s10.addText('The Data Flywheel', {
  x: 0.5, y: 5.2, w: 12, h: 0.4,
  fontSize: 14, bold: true, color: AMBER, fontFace: 'Calibri'
})

s10.addText('More users → More recordings → Better labeled body language data → Better AI models → Better feedback → More users', {
  x: 0.5, y: 5.7, w: 12, h: 0.5,
  fontSize: 13, color: WHITE, fontFace: 'Calibri', align: 'center'
})

s10.addText('Every recording session generates labeled training data: user video + AI scoring + self-assessment.\nThis proprietary dataset is the long-term moat — no generic model will replicate it.', {
  x: 0.5, y: 6.3, w: 12, h: 0.5,
  fontSize: 11, color: GREY, fontFace: 'Calibri'
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 11: TEAM
// ══════════════════════════════════════════════════════════════════════
const s11 = titleSlide(pptx.addSlide(), 'The Team', 11)

s11.addText('Solo founder + AI-native development. Proof that one person with the right tools can build a full product.', {
  x: 0.5, y: 1.4, w: 12, h: 0.5,
  fontSize: 18, color: WHITE, fontFace: 'Calibri'
})

s11.addShape(pptx.ShapeType.roundRect, {
  x: 2.5, y: 2.4, w: 8, h: 2.2,
  fill: { color: DARK_SURFACE },
  line: { color: AMBER, width: 2 },
  rectRadius: 0.15
})

s11.addShape(pptx.ShapeType.ellipse, {
  x: 3.0, y: 2.7, w: 1.2, h: 1.2,
  fill: { color: AMBER_DIM },
  line: { color: AMBER, width: 1.5 }
})
s11.addText('HH', {
  x: 3.0, y: 2.7, w: 1.2, h: 1.2,
  fontSize: 24, bold: true, color: WHITE, fontFace: 'Calibri', align: 'center', valign: 'middle'
})

s11.addText('Hai Hoang', {
  x: 4.5, y: 2.6, w: 5.5, h: 0.5,
  fontSize: 22, bold: true, color: WHITE, fontFace: 'Calibri'
})
s11.addText('Founder & CEO', {
  x: 4.5, y: 3.1, w: 5.5, h: 0.4,
  fontSize: 14, color: AMBER, fontFace: 'Calibri'
})
s11.addText('Passionate about using AI to unlock human potential in communication.\nBuilt seeneyu end-to-end with an AI-augmented development team in <30 days.', {
  x: 4.5, y: 3.6, w: 5.5, h: 0.7,
  fontSize: 12, color: GREY, fontFace: 'Calibri', lineSpacingMultiple: 1.3
})

s11.addText('AI-Augmented Development Team', {
  x: 0.5, y: 5.2, w: 12, h: 0.4,
  fontSize: 14, bold: true, color: AMBER, fontFace: 'Calibri'
})

s11.addText(bulletList([
  'Project Manager — orchestrates milestones, decisions, and sprint planning',
  'Designer — UI/UX specs, design system, component specifications',
  'Backend Engineer — full-stack implementation, API design, database',
  'Data Engineer — content curation, YouTube API pipeline, curriculum',
  'Tester — QA sign-off on every milestone before release',
  'Builder — Git, CI/CD, Vercel deployment, infrastructure',
], { fontSize: 11, color: GREY }), {
  x: 0.5, y: 5.7, w: 12, h: 2.0,
  valign: 'top'
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 12: FINANCIALS
// ══════════════════════════════════════════════════════════════════════
const s12 = titleSlide(pptx.addSlide(), '3-Year Financial Projections', 12)

const finRows = [
  [
    { text: '', options: { fill: { color: AMBER }, fontSize: 12 } },
    { text: 'Year 1', options: { bold: true, color: DARK, fill: { color: AMBER }, fontSize: 13 } },
    { text: 'Year 2', options: { bold: true, color: DARK, fill: { color: AMBER }, fontSize: 13 } },
    { text: 'Year 3', options: { bold: true, color: DARK, fill: { color: AMBER }, fontSize: 13 } },
  ],
  [
    { text: 'Paid Users', options: { bold: true, color: WHITE, fill: { color: DARK_SURFACE }, fontSize: 13 } },
    { text: '5,000', options: { color: WHITE, fill: { color: DARK_SURFACE }, fontSize: 13 } },
    { text: '25,000', options: { color: WHITE, fill: { color: DARK_SURFACE }, fontSize: 13 } },
    { text: '100,000', options: { color: AMBER, fill: { color: DARK_SURFACE }, fontSize: 13, bold: true } },
  ],
  [
    { text: 'Avg ARR', options: { bold: true, color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: '$99', options: { color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: '$100', options: { color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: '$120', options: { color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
  ],
  [
    { text: 'ARR', options: { bold: true, color: WHITE, fill: { color: DARK_SURFACE }, fontSize: 13 } },
    { text: '$495K', options: { color: WHITE, fill: { color: DARK_SURFACE }, fontSize: 13 } },
    { text: '$2.5M', options: { color: WHITE, fill: { color: DARK_SURFACE }, fontSize: 13 } },
    { text: '$12M', options: { color: AMBER, fill: { color: DARK_SURFACE }, fontSize: 13, bold: true } },
  ],
  [
    { text: 'B2B Revenue', options: { bold: true, color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: '$0', options: { color: GREY, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: '$500K', options: { color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: '$3M', options: { color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
  ],
  [
    { text: 'Total Revenue', options: { bold: true, color: AMBER, fill: { color: DARK_SURFACE }, fontSize: 14 } },
    { text: '$495K', options: { color: AMBER, fill: { color: DARK_SURFACE }, fontSize: 14, bold: true } },
    { text: '$3M', options: { color: AMBER, fill: { color: DARK_SURFACE }, fontSize: 14, bold: true } },
    { text: '$15M', options: { color: AMBER, fill: { color: DARK_SURFACE }, fontSize: 14, bold: true } },
  ],
  [
    { text: 'Burn Rate (monthly)', options: { bold: true, color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: '$80K', options: { color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: '$120K', options: { color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
    { text: '$180K', options: { color: WHITE, fill: { color: DARK_ELEVATED }, fontSize: 13 } },
  ],
]

s12.addTable(finRows, {
  x: 1.5, y: 1.8, w: 10, h: 4.5,
  colW: [3, 2.3, 2.3, 2.4],
  border: { type: 'solid', color: DARK_ELEVATED, pt: 1 },
  fontFace: 'Calibri',
  rowH: [0.5, 0.55, 0.55, 0.55, 0.55, 0.6, 0.55],
})

s12.addText('Key assumptions: 80% gross margin, $5 avg AI cost/user/mo, B2B avg contract $20K ARR', {
  x: 0.5, y: 6.5, w: 12, h: 0.3,
  fontSize: 10, color: GREY_DIM, fontFace: 'Calibri'
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 13: THE ASK
// ══════════════════════════════════════════════════════════════════════
const s13 = titleSlide(pptx.addSlide(), 'The Ask — $1.5M Seed', 13)

s13.addText('Raising $1.5M to scale content, launch mobile, and drive early growth.', {
  x: 0.5, y: 1.4, w: 12, h: 0.5,
  fontSize: 20, color: WHITE, fontFace: 'Calibri'
})

const funds = [
  { label: 'Content (40%)', value: '$600K', desc: 'Expand to 200+ clips, hire content curator, license partnerships', color: AMBER, pct: 0.4 },
  { label: 'Product (30%)', value: '$450K', desc: 'Mobile app (iOS + Android), streak system, social features', color: VIOLET, pct: 0.3 },
  { label: 'Marketing (20%)', value: '$300K', desc: 'SEO, influencer partnerships, B2B outbound, Product Hunt', color: GREEN, pct: 0.2 },
  { label: 'Operations (10%)', value: '$150K', desc: 'Legal, infrastructure, customer support', color: CYAN, pct: 0.1 },
]

const barY = 2.6
let barX = 0.5
const totalBarW = 12

funds.forEach(f => {
  const bw = f.pct * totalBarW
  s13.addShape(pptx.ShapeType.roundRect, {
    x: barX, y: barY, w: bw, h: 0.6,
    fill: { color: f.color },
    rectRadius: 0.05
  })
  if (bw > 1.5) {
    s13.addText(f.label, {
      x: barX, y: barY, w: bw, h: 0.6,
      fontSize: 11, bold: true, color: DARK, fontFace: 'Calibri', align: 'center', valign: 'middle'
    })
  }
  barX += bw
})

funds.forEach((f, i) => {
  const x = 0.5 + i * 3.1
  const y = 3.6

  s13.addText(f.label, {
    x, y, w: 2.8, h: 0.4,
    fontSize: 14, bold: true, color: f.color, fontFace: 'Calibri'
  })
  s13.addText(f.value, {
    x, y: y + 0.4, w: 2.8, h: 0.4,
    fontSize: 20, bold: true, color: WHITE, fontFace: 'Calibri'
  })
  s13.addText(f.desc, {
    x, y: y + 0.9, w: 2.8, h: 0.6,
    fontSize: 11, color: GREY, fontFace: 'Calibri', lineSpacingMultiple: 1.2
  })
})

s13.addText('Path to Series A (18 months)', {
  x: 0.5, y: 5.5, w: 12, h: 0.4,
  fontSize: 14, bold: true, color: AMBER, fontFace: 'Calibri'
})

s13.addText(bulletList([
  '10,000+ paid users with >60% monthly retention',
  '$2M+ ARR with positive unit economics',
  '3+ enterprise pilots converting to annual contracts',
  'Mobile app launched with 4.5+ App Store rating',
], { fontSize: 12, color: GREY }), {
  x: 0.5, y: 5.9, w: 12, h: 1.5,
  valign: 'top'
})

// ══════════════════════════════════════════════════════════════════════
// SLIDE 14: VISION
// ══════════════════════════════════════════════════════════════════════
const s14 = titleSlide(pptx.addSlide(), 'The Vision', 14)

s14.addText('seeneyu becomes the Duolingo of interpersonal skills.', {
  x: 0.5, y: 1.4, w: 12, h: 0.6,
  fontSize: 26, bold: true, color: WHITE, fontFace: 'Calibri'
})

s14.addText('Body language is just the beginning.', {
  x: 0.5, y: 2.2, w: 12, h: 0.5,
  fontSize: 18, color: GREY, fontFace: 'Calibri'
})

const vision = [
  { year: 'NOW', text: 'AI body language coaching from Hollywood clips', color: AMBER },
  { year: 'YEAR 2', text: '+ Negotiation, leadership presence, cross-cultural communication', color: VIOLET },
  { year: 'YEAR 3', text: '+ Enterprise L&D platform with custom scenario creation', color: GREEN },
  { year: 'YEAR 5', text: 'The global standard for interpersonal skills training', color: CYAN },
]

vision.forEach((v, i) => {
  const y = 3.2 + i * 1.0

  s14.addShape(pptx.ShapeType.rect, {
    x: 0.5, y, w: 0.3, h: 0.6,
    fill: { color: v.color }
  })
  s14.addText(v.year, {
    x: 1.1, y, w: 1.5, h: 0.6,
    fontSize: 14, bold: true, color: v.color, fontFace: 'Calibri', valign: 'middle'
  })
  s14.addText(v.text, {
    x: 2.8, y, w: 9.5, h: 0.6,
    fontSize: 16, color: WHITE, fontFace: 'Calibri', valign: 'middle'
  })
})

s14.addText('"In every high-stakes room, your body speaks before you do.\nWe\'re building the platform that teaches it to speak with confidence."', {
  x: 1, y: 6.2, w: 11, h: 0.6,
  fontSize: 14, italic: true, color: GREY, fontFace: 'Calibri', align: 'center', lineSpacingMultiple: 1.4
})

// ══════════════════════════════════════════════════════════════════════
// SAVE
// ══════════════════════════════════════════════════════════════════════
const outputPath = path.resolve(__dirname, '../../../.shared/outputs/marketer/seeneyu-pitch-deck.pptx')
console.log('Writing deck to:', outputPath)

pptx.writeFile({ fileName: outputPath })
  .then(() => console.log('Pitch deck saved successfully!'))
  .catch(err => console.error('Error saving deck:', err))
