'use client'

import { useEffect, useState } from 'react'
import { X, Keyboard } from 'lucide-react'
import { Button } from './button'

interface ShortcutItem {
  keys: string
  description: string
}

const shortcuts: ShortcutItem[] = [
  { keys: '⌘ H', description: 'Go to Dashboard' },
  { keys: '⌘ ⇧ C', description: 'View Clients' },
  { keys: '⌘ ⇧ E', description: 'View Engagements' },
  { keys: '⌘ N', description: 'New Engagement' },
  { keys: '⌘ ⇧ A', description: 'View Approvals' },
  { keys: '⌘ ,', description: 'Settings' },
  { keys: '⌘ K', description: 'Focus Search' },
  { keys: '?', description: 'Show Keyboard Shortcuts' },
  { keys: 'Esc', description: 'Close Modal / Cancel' },
]

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }

      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                <span className="text-sm text-slate-600">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs">?</kbd> to toggle this help
          </p>
        </div>
      </div>
    </div>
  )
}
