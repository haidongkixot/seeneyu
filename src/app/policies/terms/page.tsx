import { notFound } from 'next/navigation'
import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { ArrowLeft } from 'lucide-react'

interface CmsPage {
  title: string
  content: { html?: string } & Record<string, unknown>
}

async function getPage(): Promise<CmsPage | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/cms/pages/terms`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function TermsPage() {
  const page = await getPage()
  if (!page) notFound()

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-16">
        <Link
          href="/policies"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to Policies
        </Link>
        <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-8 leading-tight">
          {page.title}
        </h1>
        {page.content?.html && (
          <div
            className="prose prose-invert prose-amber max-w-none
              prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-accent-400
              prose-strong:text-text-primary prose-li:text-text-secondary"
            dangerouslySetInnerHTML={{ __html: page.content.html }}
          />
        )}
      </div>
    </div>
  )
}
