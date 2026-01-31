'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Cpu,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: typeof LayoutDashboard
  badge?: number
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchPendingCount = async () => {
      // Count pending station runs
      const { count: stationCount } = await supabase
        .from('station_runs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'awaiting_approval')

      // Count pending artifacts
      const { count: artifactCount } = await supabase
        .from('artifacts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review')

      setPendingApprovals((stationCount || 0) + (artifactCount || 0))
    }

    fetchPendingCount()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('approval-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'station_runs' },
        () => fetchPendingCount()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artifacts' },
        () => fetchPendingCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Engagements', href: '/dashboard/engagements', icon: Briefcase },
    { name: 'AI Stations', href: '/dashboard/stations', icon: Cpu },
    { name: 'Artifacts', href: '/dashboard/artifacts', icon: FileText },
    { name: 'Approvals', href: '/dashboard/approvals', icon: ShieldCheck, badge: pendingApprovals },
  ]

  const bottomNavigation: NavItem[] = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
        <Logo size="sm" showText={!collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{item.name}</span>}
              {item.badge && item.badge > 0 && (
                <span
                  className={cn(
                    'flex items-center justify-center text-xs font-semibold text-white bg-amber-500 rounded-full',
                    collapsed ? 'absolute -top-1 -right-1 w-5 h-5' : 'w-6 h-6'
                  )}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom navigation */}
      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </form>
      </div>
    </aside>
  )
}
