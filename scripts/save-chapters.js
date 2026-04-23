require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const chapters = [
  {
    slug: 'body-language-ch01-science',
    title: 'Chapter 1: The Science of Body Language',
    excerpt: 'How non-verbal communication shapes over 90% of our interpersonal interactions — the research, the science, and why it matters.',
    tags: ['knowledge', 'body-language', 'foundations', 'science'],
    body: `<h2>What Is Body Language?</h2>
<p>Body language — also called <strong>non-verbal communication</strong> — encompasses every signal your body sends without words: facial expressions, gestures, posture, eye contact, touch, and even the space you maintain between yourself and others. These signals are processed by the brain faster than spoken language, often before you're consciously aware of them.</p>
<p>According to anthropologist <strong>Ray Birdwhistell</strong>, who pioneered the field of <em>kinesics</em> in the 1950s, humans can produce over 250,000 facial expressions and 5,000 distinct hand gestures.</p>
<div style="background:#f8f5f0;border-left:4px solid #d4a853;padding:16px;margin:16px 0;border-radius:8px"><strong>Did You Know?</strong><br/>Charles Darwin published <em>The Expression of the Emotions in Man and Animals</em> in 1872 — one of the first scientific works arguing that facial expressions are universal across cultures.</div>
<h2>The Mehrabian Myth — And the Real Research</h2>
<p>In 1967, psychologist <strong>Albert Mehrabian</strong> conducted two studies that produced the <strong>7-38-55 rule</strong>: when communicating feelings, only 7% of the message comes from words, 38% from vocal tone, and 55% from body language. This is frequently misquoted — Mehrabian himself clarified it applies specifically to situations where verbal and non-verbal signals contradict each other.</p>
<h3>When Words and Body Disagree</h3>
<p><strong>When there's a mismatch between what someone says and how they say it, we believe the non-verbal signal.</strong> If a colleague says "I'm fine" while crossing their arms and avoiding eye contact — you don't believe the words.</p>
<h2>The Five Channels of Non-Verbal Communication</h2>
<h3>1. Facial Expressions</h3>
<p><strong>Paul Ekman's</strong> research identified seven universal facial expressions — happiness, sadness, anger, fear, surprise, disgust, and contempt. His <strong>Facial Action Coding System (FACS)</strong> catalogues 46 action units the face can produce.</p>
<h3>2. Gestures</h3>
<p>Gestures fall into three categories: <strong>emblems</strong> (culturally specific symbols like thumbs-up), <strong>illustrators</strong> (movements accompanying speech), and <strong>adaptors</strong> (self-soothing behaviors like touching your face). Research by <strong>David McNeill</strong> shows gestures are integral to the thinking process itself.</p>
<h3>3. Posture and Body Orientation</h3>
<p><strong>Amy Cuddy's</strong> research on "power poses" (2012) suggested expansive postures could increase testosterone. Open, upright posture is consistently perceived as more confident by observers.</p>
<h3>4. Proxemics (Personal Space)</h3>
<p><strong>Edward T. Hall</strong> defined four zones: intimate (0-18 inches), personal (18 inches-4 feet), social (4-12 feet), and public (12+ feet). Violations trigger discomfort processed by the amygdala.</p>
<h3>5. Paralanguage</h3>
<p>Vocal qualities beyond words: pitch, tone, pace, volume, and pauses. Klofstad et al. (2012) found both men and women prefer leaders with lower-pitched voices.</p>
<div style="background:#f8f5f0;border-left:4px solid #d4a853;padding:16px;margin:16px 0;border-radius:8px"><strong>Did You Know?</strong><br/>Mirror neurons — discovered by Giacomo Rizzolatti in the 1990s — fire both when you perform an action and when you observe it. This is why yawning is contagious and the neural basis of empathy.</div>
<h2>Why Body Language Is Harder to Fake</h2>
<p>Many body language signals originate in the <strong>limbic system</strong> — the emotional brain. Former FBI agent <strong>Joe Navarro</strong> calls these "limbic responses" and argues they are far more reliable than words because they are automatic and difficult to suppress. Examples include pupil dilation, blushing, micro-expressions (lasting 1/25th of a second), and foot direction.</p>
<h2>The Impact on Real Life</h2>
<h3>Job Interviews</h3>
<p>Tricia Prickett at the University of Toledo found observers watching just the first 15 seconds of a job interview — with the sound off — could predict the outcome as accurately as interviewers who conducted the full session.</p>
<h3>Relationships</h3>
<p><strong>John Gottman</strong> can predict with 94% accuracy whether a couple will divorce — based primarily on non-verbal behaviors: contempt, defensiveness, and stonewalling.</p>
<div style="background:#f8f5f0;border-left:4px solid #d4a853;padding:16px;margin:16px 0;border-radius:8px"><strong>Did You Know?</strong><br/>Babies as young as 7 months can read facial expressions and respond differently to happy versus angry faces. Body language comprehension is wired into our biology from birth.</div>
<h2>Try This Now</h2>
<ol>
<li><strong>The Mirror Check:</strong> Spend 2 minutes in front of a mirror having an imaginary conversation. Notice your default posture, hand positions, and facial resting state.</li>
<li><strong>The Mute TV Exercise:</strong> Watch 10 minutes of a talk show with the sound off. Identify emotions based solely on body language.</li>
<li><strong>The Baseline Observation:</strong> Pick one person and observe their "normal" body language over 3 days to establish a baseline.</li>
<li><strong>The Posture Reset:</strong> Set 3 random alarms during your workday. Each time, check and reset your posture.</li>
<li><strong>The Congruence Check:</strong> When you say "I'm fine," check whether your body agrees.</li>
</ol>`,
  },
  {
    slug: 'body-language-ch02-first-impressions',
    title: 'Chapter 2: The Psychology of First Impressions',
    excerpt: 'Your brain forms judgments about trustworthiness and competence in just 100 milliseconds — learn the science behind first impressions.',
    tags: ['knowledge', 'body-language', 'first-impressions', 'psychology'],
    body: `<h2>The Speed of Judgment</h2>
<p>In 2006, psychologist <strong>Alexander Todorov</strong> at Princeton discovered that people form reliable judgments about a stranger's trustworthiness in just <strong>100 milliseconds</strong>. This isn't a flaw — it's a survival mechanism wired into our neural circuitry.</p>
<div style="background:#f8f5f0;border-left:4px solid #d4a853;padding:16px;margin:16px 0;border-radius:8px"><strong>Did You Know?</strong><br/>Judgments made in 100ms correlate strongly with judgments made with no time constraints. Your gut reaction is remarkably close to your considered opinion.</div>
<h2>The Halo Effect</h2>
<p>First described by <strong>Edward Thorndike</strong> in 1920, the halo effect is a cognitive bias where our overall impression influences how we judge specific traits. If someone appears confident and well-groomed, we unconsciously assume they're also intelligent and trustworthy. The reverse — the <strong>horn effect</strong> — means a weak handshake or slouched posture can color everything negatively.</p>
<h2>Thin-Slicing</h2>
<p><strong>Nalini Ambady</strong> at Harvard showed that 30-second silent video clips of professors predicted end-of-semester evaluations. Even 6-second clips held predictive power. The key: body language <em>is</em> the information.</p>
<h2>The Primacy Effect</h2>
<p><strong>Solomon Asch</strong> demonstrated that information presented first has disproportionate impact. If you start with confident eye contact and open posture, a later stumble is forgiven as "just nerves." Start with a limp handshake, and even brilliance may be dismissed.</p>
<div style="background:#f8f5f0;border-left:4px solid #d4a853;padding:16px;margin:16px 0;border-radius:8px"><strong>Did You Know?</strong><br/>Chaplin et al. (2000) found that a firm handshake was associated with greater extraversion and emotional expressivity. For women especially, a firm handshake created a more favorable impression.</div>
<h2>Seven Signals of a Strong First Impression</h2>
<h3>1. The Eyebrow Flash</h3>
<p>A quick raising of the eyebrows (1/5th second) — universally recognized as a greeting signal, documented by <strong>Eibl-Eibesfeldt</strong> across dozens of cultures.</p>
<h3>2. The Genuine Smile (Duchenne Smile)</h3>
<p>Engages both the zygomatic major (mouth) and orbicularis oculi (eye crinkle). A "social" smile without eye involvement is detected as insincere within milliseconds.</p>
<h3>3. Open Torso</h3>
<p>Facing someone squarely with visible hands signals trust. Turning away signals discomfort.</p>
<h3>4. Forward Lean</h3>
<p>A subtle 10-15 degree lean communicates interest. Leaning back signals evaluation.</p>
<h3>5. Palm Displays</h3>
<p>Visible, upturned palms signal honesty. Hidden palms create suspicion (<strong>Allan Pease</strong>).</p>
<h3>6. Head Tilt</h3>
<p>Exposing the carotid artery unconsciously signals safety and attentive listening.</p>
<h3>7. Appropriate Personal Space</h3>
<p>Read the other person's cues to gauge when to close distance.</p>
<h2>Resetting a Bad First Impression</h2>
<p>Research by Gawronski (2013) shows bad first impressions are harder to reverse (negativity bias). Strategies: acknowledge it directly, show warmth quickly, be consistent, and use light self-deprecating humor.</p>
<div style="background:#f8f5f0;border-left:4px solid #d4a853;padding:16px;margin:16px 0;border-radius:8px"><strong>Did You Know?</strong><br/>In video calls, your face appears larger than in person, making facial expressions — especially smiling and camera eye contact — disproportionately important (Bailenson, 2021).</div>
<h2>Try This Now</h2>
<ol>
<li><strong>The 3-Second Entrance:</strong> Pause at the doorway, make eye contact, smile, then walk in.</li>
<li><strong>The Handshake Practice:</strong> Practice different firmness levels with a friend. Aim for firm (not crushing), 2-3 seconds, with direct eye contact.</li>
<li><strong>The Thin-Slice Test:</strong> Record yourself walking in and sitting down for 10 seconds. Watch it back with sound off — what impression does your body create?</li>
<li><strong>The Reset Script:</strong> Prepare a natural reset line: "Let me start over — I was in my head for a moment."</li>
</ol>`,
  },
  {
    slug: 'body-language-ch03-eye-contact',
    title: 'Chapter 3: Eye Contact Mastery',
    excerpt: 'Eye contact is the most powerful non-verbal signal — learn the Triangle Technique, optimal gaze duration, and cultural differences.',
    tags: ['knowledge', 'body-language', 'eye-contact', 'gaze'],
    body: `<h2>The Neuroscience of Eye Contact</h2>
<p>Mutual gaze activates the <strong>social brain network</strong> — including the superior temporal sulcus and reward circuitry (<strong>Norihiro Sadato</strong>, 2017). Eye contact triggers <strong>oxytocin</strong> release (the bonding hormone) and activates the <strong>amygdala</strong>, which is why prolonged staring from a stranger feels threatening while the same from a loved one feels intimate.</p>
<div style="background:#f8f5f0;border-left:4px solid #d4a853;padding:16px;margin:16px 0;border-radius:8px"><strong>Did You Know?</strong><br/>Babies as young as 2 days old prefer faces with direct gaze over averted gaze. Eye contact detection is hardwired from birth (Helminen et al., 2011).</div>
<h2>Types of Gaze</h2>
<h3>Social Gaze</h3>
<p>Eyes move in a triangle between the other person's <strong>left eye, right eye, and mouth</strong>. Comfortable and signals friendly engagement.</p>
<h3>Power Gaze</h3>
<p>Triangle shifts to <strong>eyes and forehead</strong>. Conveys seriousness in business contexts (<strong>Allan and Barbara Pease</strong>).</p>
<h3>Intimate Gaze</h3>
<p>Triangle drops to <strong>eyes and chest</strong>. Signals personal or romantic interest.</p>
<h3>Scanning Gaze</h3>
<p>Rapid movement across a room, never settling. Signals anxiety or searching for someone else.</p>
<h2>The Triangle Technique</h2>
<p>Move your gaze slowly: <strong>left eye → right eye → nose bridge</strong>, 2-3 seconds each point. This creates natural, comfortable eye contact without intensity.</p>
<p><strong>Michael Argyle</strong> at Oxford established that listeners maintain eye contact ~70-75% of the time, while speakers maintain ~40-60%. Speakers break gaze more because looking away helps cognitive processing.</p>
<h2>The 3-5 Second Rule</h2>
<p>Eye contact held for 3-5 seconds before a natural break is perceived as confident. Less than 1 second reads as shifty. More than 7-10 seconds feels aggressive. <strong>Joe Navarro</strong> recommends the "break and return" method: hold 4-5 seconds, briefly look sideways (not down), then return.</p>
<div style="background:#f8f5f0;border-left:4px solid #d4a853;padding:16px;margin:16px 0;border-radius:8px"><strong>Did You Know?</strong><br/>Breaking gaze downward signals submission across all studied cultures. Sideways signals thinking. Upward signals boredom. For confident communication, break to the side (<strong>Eibl-Eibesfeldt</strong>).</div>
<h2>Eye Contact in Different Contexts</h2>
<h3>Public Speaking</h3>
<p>The "lighthouse technique": pick 3-5 friendly faces in different sections. Make 3-5 seconds of direct eye contact with each before moving on.</p>
<h3>Job Interviews</h3>
<p>Maintain 60-70% eye contact. Hold gaze while the interviewer speaks. Brief breaks while formulating your answer are natural and expected.</p>
<h3>Video Calls</h3>
<p>Position your call window directly below the webcam. During key points, look at the camera lens for direct eye contact effect.</p>
<h2>Cultural Differences</h2>
<ul>
<li><strong>Western:</strong> Direct eye contact expected, avoidance read as dishonest</li>
<li><strong>East Asian:</strong> Extended direct gaze with superiors can be disrespectful</li>
<li><strong>Middle Eastern:</strong> Prolonged eye contact between men signals trust</li>
<li><strong>Indigenous Australian:</strong> Sustained eye contact during serious talk can be rude</li>
</ul>
<h2>Eye Blocking Behaviors</h2>
<p><strong>Navarro</strong> describes unconscious eye-blocking: rubbing eyes (disagreement), extended blinks >1 second (blocking unwanted information), squinting (suspicion or analysis).</p>
<h2>Pupil Dilation</h2>
<p>Pupils dilate with interest and constrict with dislike — controlled by the autonomic nervous system and impossible to fake. <strong>Eckhard Hess</strong> (1960s) found pupils dilate up to 45% when viewing something pleasurable.</p>
<div style="background:#f8f5f0;border-left:4px solid #d4a853;padding:16px;margin:16px 0;border-radius:8px"><strong>Did You Know?</strong><br/>Renaissance Italian women used <em>belladonna</em> ("beautiful woman") drops to dilate their pupils for attractiveness. The active compound, atropine, is still used by eye doctors today.</div>
<h2>Try This Now</h2>
<ol>
<li><strong>Triangle Practice:</strong> In your next conversation, practice left eye → right eye → nose bridge, 2-3 seconds each.</li>
<li><strong>The 4-Second Hold:</strong> Practice holding eye contact for exactly 4 seconds before a natural side-break.</li>
<li><strong>Break Direction Awareness:</strong> For one day, notice which direction you break eye contact. Practice breaking sideways instead of down.</li>
<li><strong>The Video Call Trick:</strong> Place a small sticker next to your webcam lens. Look at it during key moments for direct eye contact.</li>
<li><strong>The Pupil Observer:</strong> In good lighting, notice someone's pupil size when discussing topics they enjoy vs dislike.</li>
</ol>`,
  },
];

async function saveAll() {
  for (const ch of chapters) {
    try {
      const result = await prisma.blogPost.upsert({
        where: { slug: ch.slug },
        update: {
          title: ch.title,
          excerpt: ch.excerpt,
          body: ch.body,
          tags: ch.tags,
          category: 'knowledge',
          status: 'published',
          publishedAt: new Date(),
        },
        create: {
          slug: ch.slug,
          title: ch.title,
          excerpt: ch.excerpt,
          body: ch.body,
          tags: ch.tags,
          category: 'knowledge',
          status: 'published',
          publishedAt: new Date(),
        },
      });
      console.log('Saved:', result.slug);
    } catch (e) {
      console.error('Error saving', ch.slug, ':', e.message);
    }
  }
  await prisma.$disconnect();
}

saveAll();
