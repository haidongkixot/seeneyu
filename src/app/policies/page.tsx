import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { FileText } from 'lucide-react'

const policyPages = [
  {
    href: '/policies/privacy',
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your personal information.',
  },
  {
    href: '/policies/terms',
    title: 'Terms of Service',
    description: 'The rules and guidelines for using seeneyu.',
  },
]

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Policies</h1>
        <p className="text-text-secondary mb-12">Legal and policy documents for seeneyu.</p>

        <div className="space-y-4">
          {policyPages.map(p => (
            <Link
              key={p.href}
              href={p.href}
              className="flex items-start gap-4 bg-bg-surface border border-black/8 rounded-2xl p-6 hover:border-accent-400/20 hover:shadow-card-hover transition-all duration-200"
            >
              <div className="mt-0.5 text-accent-400">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">{p.title}</h2>
                <p className="text-sm text-text-secondary">{p.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
