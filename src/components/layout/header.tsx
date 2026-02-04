'use client'

import { Bell, Search, Command } from 'lucide-react'
import { HelpButton } from '@/components/guidance'
import { useSearch } from '@/components/search/search-provider'

interface HeaderProps {
  user?: {
    full_name: string
    email: string
    avatar_url?: string
  } | null
}

export function Header({ user }: HeaderProps) {
  const { open } = useSearch()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Search - Click to open Command Palette */}
      <div className="flex items-center flex-1 max-w-md">
        <button
          onClick={open}
          className="relative w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-left text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <span>Search clients, engagements...</span>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-slate-400">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono">
              <Command className="h-3 w-3 inline" />
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono">K</kbd>
          </span>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Help Button */}
        <HelpButton
          variant="ghost"
          size="icon"
          className="text-slate-600 hover:text-teal-600 hover:bg-teal-50"
        />

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User menu */}
        {user && (
          <div className="flex items-center gap-3 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-medium">
              {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
