import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding CMS data...')

  // ── CMS Pages ────────────────────────────────────────────────────

  const pages = [
    {
      slug: 'about',
      title: 'About seeneyu',
      status: 'published',
      publishedAt: new Date(),
      content: {
        html: `
          <h2>Our Mission</h2>
          <p>seeneyu uses AI and cinematic storytelling to help you master the non-verbal language of confident people.</p>
          <h2>How It Works</h2>
          <p>Watch curated Hollywood scenes, observe specific body language skills, record yourself mimicking them, and receive real-time AI feedback. It's the fastest way to transform how people perceive you.</p>
          <h2>Why Body Language?</h2>
          <p>Research shows that over 55% of communication is non-verbal. Eye contact, posture, gestures, and vocal pacing can make or break a job interview, a sales pitch, or a first impression. Yet most people never practice these skills deliberately.</p>
          <p>seeneyu changes that.</p>
        `.trim(),
      },
    },
    {
      slug: 'roadmap',
      title: 'Product Roadmap',
      status: 'published',
      publishedAt: new Date(),
      content: {
        html: `
          <h2>Where we're headed</h2>
          <p>seeneyu is constantly evolving. Here's what we're working on:</p>
          <h3>Now</h3>
          <ul>
            <li>AI-powered feedback for eye contact and posture</li>
            <li>Foundation courses with structured learning paths</li>
            <li>Gamification: XP, streaks, badges, and leaderboards</li>
          </ul>
          <h3>Next</h3>
          <ul>
            <li>Vocal pacing analysis with audio feedback</li>
            <li>Team/enterprise plans for corporate training</li>
            <li>Mobile app (iOS and Android)</li>
          </ul>
          <h3>Later</h3>
          <ul>
            <li>Live coaching sessions with human experts</li>
            <li>Community challenges and peer feedback</li>
            <li>Multilingual content and feedback</li>
          </ul>
        `.trim(),
      },
    },
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      status: 'published',
      publishedAt: new Date(),
      content: {
        html: `
          <p><strong>Last updated:</strong> March 2026</p>
          <h2>Information We Collect</h2>
          <p>We collect information you provide directly, such as your name, email address, and profile information when you create an account.</p>
          <h3>Recordings</h3>
          <p>When you use the practice feature, your webcam recordings are temporarily stored for AI analysis. Recordings are automatically deleted after processing unless you choose to save them.</p>
          <h3>Usage Data</h3>
          <p>We collect anonymized usage data to improve our service, including pages visited, features used, and practice session metrics.</p>
          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide and improve our AI coaching service</li>
            <li>To personalize your learning experience</li>
            <li>To communicate important updates</li>
          </ul>
          <h2>Data Security</h2>
          <p>We use industry-standard encryption and security measures to protect your data. Your recordings are processed securely and are never shared with third parties.</p>
          <h2>Contact Us</h2>
          <p>If you have questions about this privacy policy, please contact us at privacy@seeneyu.com.</p>
        `.trim(),
      },
    },
    {
      slug: 'terms',
      title: 'Terms of Service',
      status: 'published',
      publishedAt: new Date(),
      content: {
        html: `
          <p><strong>Last updated:</strong> March 2026</p>
          <h2>Acceptance of Terms</h2>
          <p>By accessing and using seeneyu, you agree to be bound by these Terms of Service.</p>
          <h2>Use of Service</h2>
          <p>seeneyu provides AI-powered body language coaching through video analysis. You agree to use the service only for lawful purposes and in accordance with these terms.</p>
          <h2>User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
          <h2>Content</h2>
          <p>All video clips, courses, and educational content on seeneyu are protected by copyright. You may not redistribute, modify, or commercially use our content without written permission.</p>
          <h2>Recordings</h2>
          <p>You retain ownership of your practice recordings. By using our AI feedback feature, you grant us a limited license to process your recordings for the purpose of providing feedback.</p>
          <h2>Limitation of Liability</h2>
          <p>seeneyu is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          <h2>Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of the service constitutes acceptance of the updated terms.</p>
        `.trim(),
      },
    },
  ]

  for (const page of pages) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: { title: page.title, content: page.content, status: page.status },
      create: page,
    })
    console.log(`  Page: ${page.slug}`)
  }

  // ── Site Settings ────────────────────────────────────────────────

  const settings = [
    {
      key: 'logo',
      value: { url: '' },
    },
    {
      key: 'footer_text',
      value: { text: 'seeneyu - AI-powered body language coaching. Learn to command any room.' },
    },
    {
      key: 'social_links',
      value: {
        twitter: '',
        github: '',
        linkedin: '',
      },
    },
  ]

  for (const setting of settings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
    console.log(`  Setting: ${setting.key}`)
  }

  // ── Team Members (from homepage hardcoded data) ──────────────────

  const teamMembers = [
    {
      name: 'Hai Hoang',
      title: 'Founder & CEO',
      bio: 'Passionate about using AI to unlock human potential in communication.',
      order: 0,
    },
    {
      name: 'AI Lead',
      title: 'Head of AI',
      bio: 'Building the intelligence layer that makes real-time coaching possible.',
      order: 1,
    },
    {
      name: 'Product Lead',
      title: 'Head of Product',
      bio: 'Designing experiences that turn cinematic moments into lasting skills.',
      order: 2,
    },
  ]

  // Clear existing team members and re-seed
  const existingCount = await prisma.teamMember.count()
  if (existingCount === 0) {
    for (const member of teamMembers) {
      await prisma.teamMember.create({ data: member })
      console.log(`  Team member: ${member.name}`)
    }
  } else {
    console.log(`  Team members already exist (${existingCount}), skipping`)
  }

  console.log('CMS seed complete!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
