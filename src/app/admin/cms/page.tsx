'use client'

import Link from 'next/link'
import { FileText, BookOpen, Users2, Settings } from 'lucide-react'

const cards = [
  {
    href: '/admin/cms/pages',
    label: 'Pages',
    description: 'Manage static pages like About, Roadmap, Privacy, Terms',
    Icon: FileText,
    color: 'text-blue-400 bg-blue-400/10',
  },
  {
    href: '/admin/cms/blog',
    label: 'Blog',
    description: 'Create and manage blog posts',
    Icon: BookOpen,
    color: 'text-violet-400 bg-violet-400/10',
  },
  {
    href: '/admin/cms/team',
    label: 'Team',
    description: 'Manage team members displayed on the site',
    Icon: Users2,
    color: 'text-cyan-400 bg-cyan-400/10',
  },
  {
    href: '/admin/cms/settings',
    label: 'Settings',
    description: 'Logo, footer text, social links, and site settings',
    Icon: Settings,
    color: 'text-amber-400 bg-amber-400/10',
  },
]

export default function CmsDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Content Management</h1>
      <p className="text-text-secondary text-sm mb-8">Manage your site content, blog posts, team, and settings.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ href, label, description, Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-bg-surface border border-white/8 rounded-2xl p-6 hover:border-accent-400/20 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">{label}</h3>
            <p className="text-sm text-text-secondary">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
