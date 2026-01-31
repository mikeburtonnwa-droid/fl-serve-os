'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Shortcut {
  key: string
  modifiers?: ('ctrl' | 'meta' | 'alt' | 'shift')[]
  description: string
  action: () => void
}

export function useKeyboardShortcuts(additionalShortcuts: Shortcut[] = []) {
  const router = useRouter()

  const defaultShortcuts: Shortcut[] = [
    {
      key: 'h',
      modifiers: ['meta'],
      description: 'Go to Dashboard',
      action: () => router.push('/dashboard'),
    },
    {
      key: 'c',
      modifiers: ['meta', 'shift'],
      description: 'View Clients',
      action: () => router.push('/dashboard/clients'),
    },
    {
      key: 'e',
      modifiers: ['meta', 'shift'],
      description: 'View Engagements',
      action: () => router.push('/dashboard/engagements'),
    },
    {
      key: 'n',
      modifiers: ['meta'],
      description: 'New Engagement',
      action: () => router.push('/dashboard/engagements/new'),
    },
    {
      key: 'a',
      modifiers: ['meta', 'shift'],
      description: 'View Approvals',
      action: () => router.push('/dashboard/approvals'),
    },
    {
      key: ',',
      modifiers: ['meta'],
      description: 'Settings',
      action: () => router.push('/dashboard/settings'),
    },
  ]

  const allShortcuts = [...defaultShortcuts, ...additionalShortcuts]

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      for (const shortcut of allShortcuts) {
        const modifiersMatch =
          (!shortcut.modifiers?.includes('ctrl') || event.ctrlKey) &&
          (!shortcut.modifiers?.includes('meta') || event.metaKey) &&
          (!shortcut.modifiers?.includes('alt') || event.altKey) &&
          (!shortcut.modifiers?.includes('shift') || event.shiftKey)

        // Check if only the specified modifiers are pressed
        const hasCtrl = shortcut.modifiers?.includes('ctrl') || shortcut.modifiers?.includes('meta')
        const hasAlt = shortcut.modifiers?.includes('alt')
        const hasShift = shortcut.modifiers?.includes('shift')

        const correctModifiers =
          (hasCtrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey) &&
          (hasAlt ? event.altKey : !event.altKey) &&
          (hasShift ? event.shiftKey : !event.shiftKey)

        if (event.key.toLowerCase() === shortcut.key.toLowerCase() && modifiersMatch && correctModifiers) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    },
    [allShortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return allShortcuts
}

// Helper to format shortcut for display
export function formatShortcut(shortcut: Shortcut): string {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const parts: string[] = []

  if (shortcut.modifiers?.includes('ctrl') || shortcut.modifiers?.includes('meta')) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (shortcut.modifiers?.includes('alt')) {
    parts.push(isMac ? '⌥' : 'Alt')
  }
  if (shortcut.modifiers?.includes('shift')) {
    parts.push('⇧')
  }

  parts.push(shortcut.key.toUpperCase())

  return parts.join(isMac ? '' : '+')
}
