'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { SearchProvider } from '@/components/search/search-provider'
import { CommandPalette } from '@/components/search/command-palette'
import { useSearch } from '@/components/search/search-provider'

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    full_name: string
    email: string
    avatar_url?: string
  } | null
}

// Inner component that has access to SearchProvider context
function DashboardLayoutInner({ children, user }: DashboardLayoutProps) {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts()
  const { isOpen, close } = useSearch()

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Header user={user} />
        <main className="p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <KeyboardShortcutsHelp />
      <CommandPalette isOpen={isOpen} onClose={close} />
    </div>
  )
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <ToastProvider>
      <SearchProvider>
        <DashboardLayoutInner user={user}>
          {children}
        </DashboardLayoutInner>
      </SearchProvider>
    </ToastProvider>
  )
}
