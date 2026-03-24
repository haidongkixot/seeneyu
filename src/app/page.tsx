import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { SkillBadge } from '@/components/SkillBadge'
import { Eye, PersonStanding, Ear, Mic2, ShieldCheck, Film, Video, Sparkles, Star } from 'lucide-react'
import type { SkillCategory } from '@/lib/types'
import { SKILL_LABELS, SKILL_COLORS } from '@/lib/types'

const SKILLS: { skill: SkillCategory; icon: React.ReactNode; description: string }[] = [
  {
    skill: 'eye-contact',
    icon: <Eye size={24} />,
    description: 'Hold gaze with intention. Learn when to hold, when to break, and how to make people feel seen.',
  },
  {
    skill: 'open-posture',
    icon: <PersonStanding size={24} />,
    description: 'Uncrossed arms, upright spine, feet apart. Signal authority and openness at the same time.',
  },
  {
    skill: 'active-listening',
    icon: <Ear size={24} />,
    description: 'Nod, lean in, mirror expression. Make people feel heard without saying a word.',
  },
  {
    skill: 'vocal-pacing',
    icon: <Mic2 size={24} />,
    description: 'Strategic pauses, varied tempo, silence comfort. Control the room through rhythm.',
  },
  {
    skill: 'confident-disagreement',
    icon: <ShieldCheck size={24} />,
    description: 'Hold your position without aggression. Disagree calmly while your body stays open.',
  },
]

const TEAM = [
  {
    initials: 'HH',
    name: 'Hai Hoang',
    title: 'Founder & CEO',
    bio: 'Passionate about using AI to unlock human potential in communication.',
    accentColor: 'from-amber-600 to-amber-400',
  },
  {
    initials: 'AI',
    name: 'AI Lead',
    title: 'Head of AI',
    bio: 'Building the intelligence layer that makes real-time coaching possible.',
    accentColor: 'from-violet-600 to-violet-400',
  },
  {
    initials: 'PL',
    name: 'Product Lead',
    title: 'Head of Product',
    bio: 'Designing experiences that turn cinematic moments into lasting skills.',
    accentColor: 'from-cyan-600 to-cyan-400',
  },
]

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'UX Designer',
    quote: 'After just 2 weeks with seeneyu, I landed a job interview and the hiring manager specifically complimented my presence. I\'m not kidding.',
    rating: 5,
  },
  {
    name: 'Marcus Williams',
    role: 'Sales Manager',
    quote: 'The AI feedback is surprisingly spot-on. It caught a habit I had of looking away when answering tough questions. My close rate has gone up.',
    rating: 5,
  },
  {
    name: 'Priya Patel',
    role: 'PhD Student',
    quote: 'I used to avoid eye contact in presentations. Two months in, my advisor told me my defense was the most confident she\u2019d seen from a first-year.',
    rating: 5,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />

      {/* ── Hero with animated gradient ────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient layer */}
        <div className="absolute inset-0 hero-animated-bg" aria-hidden="true" />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 hero-dot-grid opacity-30" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column */}
          <div className="flex flex-col">
            <SkillBadge skill="eye-contact" size="sm" className="self-start mb-6" />

            <h1 className="text-5xl lg:text-6xl font-black text-text-primary leading-[1.08] tracking-tight">
              Learn to command<br />
              <span className="text-accent-400">any room.</span>
            </h1>

            <p className="text-xl text-text-secondary mt-5 max-w-md leading-relaxed">
              From Hollywood&apos;s greatest performances &mdash; one scene at a time.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
              <Link
                href="/library"
                className="bg-accent-400 text-text-inverse rounded-pill px-8 py-4 text-lg font-semibold shadow-glow hover:bg-accent-500 hover:scale-[1.02] transition-all duration-150"
              >
                Start Learning &mdash; It&apos;s Free
              </Link>
              <Link
                href="/library"
                className="text-text-secondary text-sm hover:text-text-primary transition-colors duration-150"
              >
                Browse the Library &rarr;
              </Link>
            </div>

            <div className="mt-12">
              <p className="text-xs text-text-tertiary uppercase tracking-widest mb-3">Skills you&apos;ll master</p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(({ skill }) => (
                  <SkillBadge key={skill} skill={skill} size="sm" />
                ))}
              </div>
            </div>
          </div>

          {/* Right column — floating preview card */}
          <div className="hidden lg:flex justify-center">
            <div className="float-animation w-80 bg-bg-surface border border-white/10 rounded-2xl shadow-xl p-4">
              <div className="aspect-video bg-bg-elevated rounded-xl overflow-hidden flex items-center justify-center">
                <Film size={48} className="text-text-tertiary" />
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <SkillBadge skill="eye-contact" size="sm" />
                <span className="text-xs text-text-tertiary bg-bg-elevated rounded-pill px-2 py-0.5 font-mono">1:45</span>
              </div>
              <p className="text-sm text-text-secondary italic mt-2 leading-relaxed">
                &ldquo;Watch how he holds the gaze without blinking &mdash; 2-3 seconds, then a natural break...&rdquo;
              </p>
              <div className="bg-bg-elevated rounded-xl p-3 mt-3">
                <p className="text-xs text-text-tertiary mb-1.5">AI Score</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/8 rounded-pill h-2 overflow-hidden">
                    <div className="bg-success h-2 rounded-pill" style={{ width: '82%' }} />
                  </div>
                  <span className="text-xl font-black text-success">82</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Mission ─────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(180,83,9,0.25) 0%, rgba(13,13,20,1) 40%, rgba(76,29,149,0.20) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0d0d14] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0d0d14] to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-4">
            Our Mission
          </p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-text-primary mb-6 leading-tight">
            Transforming how the world communicates
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            seeneyu uses AI and cinematic storytelling to help you master
            the non-verbal language of confident people.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="bg-bg-surface py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-16">
            How seeneyu works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Film size={28} />, step: '01', title: 'Watch', desc: 'Study how Hollywood actors command attention in curated scenes.' },
              { icon: <Video size={28} />, step: '02', title: 'Mimic', desc: 'Record yourself attempting the same body language behavior.' },
              { icon: <Sparkles size={28} />, step: '03', title: 'Improve', desc: 'Get AI coaching with a score and specific, actionable tips.' },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="bg-bg-elevated rounded-2xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-400/10 rounded-full text-accent-400 mb-4">
                  {icon}
                </div>
                <p className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-2">{step}</p>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Skills grid ──────────────────────────────────────── */}
      <section className="bg-bg-base py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-4">
            5 skills that change how people see you
          </h2>
          <p className="text-base text-text-secondary text-center mb-16">
            Each skill has beginner, intermediate, and advanced clips &mdash; start anywhere.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILLS.map(({ skill, icon, description }) => {
              const colors = SKILL_COLORS[skill]
              return (
                <Link
                  key={skill}
                  href={`/library?skill=${skill}`}
                  className="bg-bg-surface border border-white/8 rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                >
                  <div
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-4 transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                  >
                    {icon}
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary">{SKILL_LABELS[skill]}</h3>
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">{description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Our Team ─────────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
            The People
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">
            Our Team
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center text-center p-6 bg-bg-surface border border-white/8 rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-1 hover:border-accent-400/20 transition-all duration-300"
            >
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.accentColor} flex items-center justify-center mb-4 shadow-lg`}>
                <span className="text-xl font-bold text-white">{member.initials}</span>
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-0.5">{member.name}</h3>
              <p className="text-xs font-medium text-accent-400 mb-3">{member.title}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">
            Real Results
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">
            What learners say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="relative p-6 rounded-2xl overflow-hidden bg-[rgba(13,13,20,0.60)] backdrop-blur-xl border border-white/8 shadow-card hover:border-accent-400/15 hover:shadow-card-hover transition-all duration-300"
            >
              {/* Quote mark decoration */}
              <div className="absolute top-4 right-5 text-6xl font-serif text-accent-400/10 leading-none select-none pointer-events-none">
                &ldquo;
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="text-accent-400 fill-accent-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-text-primary leading-relaxed mb-5 relative z-10">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Attribution */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-bg-elevated border border-white/10 flex items-center justify-center text-xs font-semibold text-text-secondary">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary leading-tight">{t.name}</p>
                  <p className="text-xs text-text-tertiary">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────── */}
      <section className="bg-bg-surface border-t border-white/8 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to transform how you communicate?
          </h2>
          <p className="text-text-secondary mb-8">
            65+ curated scenes. 5 essential skills. Unlimited practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/library"
              className="bg-accent-400 text-text-inverse rounded-pill px-8 py-4 text-base font-semibold shadow-glow hover:bg-accent-500 hover:scale-[1.02] transition-all duration-150 w-full sm:w-auto text-center"
            >
              Start Learning &mdash; It&apos;s Free
            </Link>
            <Link
              href="/library"
              className="border border-white/10 text-text-primary rounded-xl px-6 py-4 text-base hover:border-white/20 hover:bg-bg-overlay transition-all duration-150 w-full sm:w-auto text-center"
            >
              Browse Library &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
