import CertificateCard from '@/toolkit/mini-games/components/CertificateCard'

interface PageProps {
  params: Promise<{ sessionId: string }>
}

// Demo certificate data; replace with API fetch later
async function getCertificateData(sessionId: string) {
  // TODO: Fetch from /api/public/certificate/[sessionId]
  return {
    playerName: 'Demo Player',
    date: new Date().toISOString(),
    challengesPassed: 8,
    totalChallenges: 10,
    avgScore: 78,
    bestScore: 95,
  }
}

export default async function CertificatePage({ params }: PageProps) {
  const { sessionId } = await params
  const data = await getCertificateData(sessionId)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-bg-base">
      <CertificateCard
        playerName={data.playerName}
        date={data.date}
        challengesPassed={data.challengesPassed}
        totalChallenges={data.totalChallenges}
        avgScore={data.avgScore}
        bestScore={data.bestScore}
      />

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="text-sm text-text-secondary mb-3">
          Want to improve your expression skills?
        </p>
        <a
          href="/"
          className="
            inline-block px-6 py-3 rounded-pill
            bg-accent-400 text-text-inverse font-semibold text-sm
            hover:bg-accent-500 hover:shadow-glow-sm
            active:bg-accent-600 active:scale-[0.98]
            transition-all duration-150
          "
        >
          Play on seeneyu
        </a>
      </div>
    </div>
  )
}
