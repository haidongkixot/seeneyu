import Link from 'next/link'
import { ExternalLink, Linkedin, Youtube } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-bg-surface border-t border-black/6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand column */}
          <div className="md:col-span-1">
            <p className="text-lg font-bold text-text-primary mb-1">seeneyu</p>
            <p className="text-sm text-text-tertiary mb-4">Your AI, your PT</p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="LinkedIn"
                 className="text-text-tertiary hover:text-accent-400 transition-colors duration-150">
                <Linkedin size={18} />
              </a>
              <a href="#" aria-label="YouTube"
                 className="text-text-tertiary hover:text-accent-400 transition-colors duration-150">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Product links */}
          <FooterLinkGroup title="Product" links={[
            { label: 'Library', href: '/library' },
            { label: 'Foundation', href: '/foundation' },
            { label: 'Arcade', href: '/arcade' },
          ]} />

          {/* Company links */}
          <FooterLinkGroup title="Company" links={[
            { label: 'About', href: '/' },
            { label: 'PeeTeeAI', href: 'https://www.peetees.ai', external: true },
          ]} />

          {/* Support links */}
          <FooterLinkGroup title="Support" links={[
            { label: 'Contact', href: 'mailto:hello@seeneyu.com' },
          ]} />
        </div>

        {/* Divider */}
        <div className="border-t border-black/6 pt-6">
          <p className="text-xs text-text-tertiary text-center">
            &copy; 2026 PeeTeeAI JSC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLinkGroup({ title, links }: { title: string; links: { label: string; href: string; external?: boolean }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a href={link.href} target="_blank" rel="noopener noreferrer"
                 className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 flex items-center gap-1">
                {link.label}
                <ExternalLink size={10} className="opacity-50" />
              </a>
            ) : (
              <Link href={link.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
