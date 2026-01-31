'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    full_name: string
    email: string
    avatar_url?: string
  } | null
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  return (
    <ToastProvider>
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
      </div>
    </ToastProvider>
  )
}
