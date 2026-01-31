'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  showHome?: boolean
}

// Route labels mapping
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Clients',
  engagements: 'Engagements',
  artifacts: 'Artifacts',
  stations: 'AI Stations',
  approvals: 'Approvals',
  settings: 'Settings',
  new: 'New',
}

export function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || generateBreadcrumbs(pathname)

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm">
        {showHome && (
          <>
            <li>
              <Link
                href="/dashboard"
                className="text-slate-500 hover:text-teal-600 transition-colors flex items-center"
              >
                <Home className="h-4 w-4" />
              </Link>
            </li>
            {breadcrumbItems.length > 0 && (
              <ChevronRight className="h-4 w-4 text-slate-300" />
            )}
          </>
        )}
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.href ? (
              <Link
                href={item.href}
                className="text-slate-500 hover:text-teal-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-900 font-medium">{item.label}</span>
            )}
            {index < breadcrumbItems.length - 1 && (
              <ChevronRight className="h-4 w-4 text-slate-300" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []

  // Skip 'dashboard' as it's shown as home
  let currentPath = ''
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`

    if (segment === 'dashboard') continue

    // Check if this is a UUID (detail page)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

    if (isUuid) {
      // For UUIDs, show a generic "Details" label as the final item
      items.push({ label: 'Details' })
    } else {
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      const isLast = i === segments.length - 1

      items.push({
        label,
        href: isLast ? undefined : currentPath,
      })
    }
  }

  return items
}
