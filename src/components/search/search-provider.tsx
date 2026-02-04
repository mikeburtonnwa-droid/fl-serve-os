'use client'

/**
 * Search Provider (F3.2)
 *
 * Provides global search context and renders the command palette.
 * Wrap your layout with this provider to enable Cmd+K search.
 */

import React, { createContext, useContext, ReactNode } from 'react'
import { CommandPalette, useCommandPalette } from './command-palette'

// =============================================================================
// Context
// =============================================================================

interface SearchContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

// =============================================================================
// Provider
// =============================================================================

interface SearchProviderProps {
  children: ReactNode
}

export function SearchProvider({ children }: SearchProviderProps) {
  const { isOpen, open, close, toggle } = useCommandPalette()

  return (
    <SearchContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      <CommandPalette isOpen={isOpen} onClose={close} />
    </SearchContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

export default SearchProvider
