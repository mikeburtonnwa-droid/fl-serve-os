'use client'

/**
 * Command Palette (F3.2)
 *
 * Global search interface accessible via Cmd+K / Ctrl+K.
 * Features:
 * - Keyboard navigation
 * - Grouped results by type
 * - Match highlighting
 * - Recent searches (F3.4)
 *
 * User Stories: US-015, US-016, US-017
 * Test Cases: TC-202, TC-501, TC-502
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Search,
  X,
  Building2,
  FileText,
  Briefcase,
  Loader2,
  Clock,
  ArrowRight,
  Command,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  type GroupedSearchResults,
  type SearchResult,
  type SearchResultType,
} from '@/lib/search'

// =============================================================================
// Types
// =============================================================================

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface ResultItemProps {
  result: SearchResult
  isSelected: boolean
  onSelect: () => void
  onMouseEnter: () => void
}

// =============================================================================
// Recent Searches (F3.4)
// =============================================================================

const RECENT_SEARCHES_KEY = 'serve-os-recent-searches'
const MAX_RECENT_SEARCHES = 5

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return
  try {
    const recent = getRecentSearches()
    const filtered = recent.filter(q => q.toLowerCase() !== query.toLowerCase())
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage errors
  }
}

function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch {
    // Ignore storage errors
  }
}

// =============================================================================
// Type Icons
// =============================================================================

const typeIcons: Record<SearchResultType, typeof Building2> = {
  client: Building2,
  engagement: Briefcase,
  artifact: FileText,
}

const typeLabels: Record<SearchResultType, string> = {
  client: 'Clients',
  engagement: 'Engagements',
  artifact: 'Artifacts',
}

const typeColors: Record<SearchResultType, string> = {
  client: 'text-blue-600 bg-blue-100',
  engagement: 'text-teal-600 bg-teal-100',
  artifact: 'text-purple-600 bg-purple-100',
}

// =============================================================================
// Result Item Component
// =============================================================================

function ResultItem({ result, isSelected, onSelect, onMouseEnter }: ResultItemProps) {
  const Icon = typeIcons[result.item.type]

  return (
    <button
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
      )}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={isSelected}
    >
      <div className={clsx('p-2 rounded-lg', typeColors[result.item.type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{result.item.title}</p>
        {result.item.subtitle && (
          <p className="text-sm text-slate-500 truncate">{result.item.subtitle}</p>
        )}
        {result.item.description && (
          <p className="text-xs text-slate-400 truncate">{result.item.description}</p>
        )}
      </div>
      {isSelected && (
        <ArrowRight className="h-4 w-4 text-teal-600 flex-shrink-0" />
      )}
    </button>
  )
}

// =============================================================================
// Result Group Component
// =============================================================================

function ResultGroup({
  type,
  results,
  selectedIndex,
  startIndex,
  onSelect,
  onMouseEnter,
}: {
  type: SearchResultType
  results: SearchResult[]
  selectedIndex: number
  startIndex: number
  onSelect: (url: string, query: string) => void
  onMouseEnter: (index: number) => void
}) {
  if (results.length === 0) return null

  return (
    <div>
      <div className="px-4 py-2 bg-slate-50 border-y border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {typeLabels[type]}
        </span>
      </div>
      <div role="listbox" aria-label={typeLabels[type]}>
        {results.map((result, i) => {
          const globalIndex = startIndex + i
          return (
            <ResultItem
              key={result.item.id}
              result={result}
              isSelected={selectedIndex === globalIndex}
              onSelect={() => onSelect(result.item.url, result.item.title)}
              onMouseEnter={() => onMouseEnter(globalIndex)}
            />
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// Main Command Palette Component
// =============================================================================

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GroupedSearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [durationMs, setDurationMs] = useState<number | null>(null)

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setResults(null)
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    if (!results) return []
    return [
      ...results.clients,
      ...results.engagements,
      ...results.artifacts,
    ]
  }, [results])

  // Search function with debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null)
      setDurationMs(null)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      )
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
        setDurationMs(data.durationMs)
        setSelectedIndex(0)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 150)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  // Navigate to selected result
  const handleSelect = useCallback((url: string, title: string) => {
    addRecentSearch(query || title)
    onClose()
    router.push(url)
  }, [query, onClose, router])

  // Use recent search
  const handleRecentSearch = useCallback((recentQuery: string) => {
    setQuery(recentQuery)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < flatResults.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (flatResults[selectedIndex]) {
          const result = flatResults[selectedIndex]
          handleSelect(result.item.url, result.item.title)
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [flatResults, selectedIndex, handleSelect, onClose])

  // Handle mouse enter for selection
  const handleMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  if (!isOpen) return null

  // Calculate group start indices for navigation
  const clientsStartIndex = 0
  const engagementsStartIndex = results?.clients.length || 0
  const artifactsStartIndex = engagementsStartIndex + (results?.engagements.length || 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-x-4 top-[15vh] z-50 mx-auto max-w-2xl animate-in zoom-in-95 slide-in-from-top-2 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-dialog-title"
      >
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
            {loading ? (
              <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-slate-400" />
            )}
            <input
              ref={inputRef}
              type="text"
              className="flex-1 text-lg outline-none placeholder:text-slate-400"
              placeholder="Search clients, engagements, artifacts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search"
              aria-controls="search-results"
              aria-activedescendant={
                flatResults[selectedIndex]
                  ? `result-${flatResults[selectedIndex].item.id}`
                  : undefined
              }
            />
            <div className="flex items-center gap-1">
              {durationMs !== null && (
                <span className="text-xs text-slate-400">{durationMs}ms</span>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                aria-label="Close search"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div
            id="search-results"
            className="max-h-[60vh] overflow-y-auto"
            role="listbox"
          >
            {/* Recent Searches (when no query) */}
            {!query && recentSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Recent Searches
                  </span>
                  <button
                    onClick={() => {
                      clearRecentSearches()
                      setRecentSearches([])
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((recent, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => handleRecentSearch(recent)}
                  >
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{recent}</span>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && results && results.total === 0 && (
              <div className="px-4 py-12 text-center">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No results found for "{query}"</p>
                <p className="text-sm text-slate-400 mt-1">
                  Try adjusting your search terms
                </p>
              </div>
            )}

            {/* Search Results */}
            {results && results.total > 0 && (
              <>
                <ResultGroup
                  type="client"
                  results={results.clients}
                  selectedIndex={selectedIndex}
                  startIndex={clientsStartIndex}
                  onSelect={handleSelect}
                  onMouseEnter={handleMouseEnter}
                />
                <ResultGroup
                  type="engagement"
                  results={results.engagements}
                  selectedIndex={selectedIndex}
                  startIndex={engagementsStartIndex}
                  onSelect={handleSelect}
                  onMouseEnter={handleMouseEnter}
                />
                <ResultGroup
                  type="artifact"
                  results={results.artifacts}
                  selectedIndex={selectedIndex}
                  startIndex={artifactsStartIndex}
                  onSelect={handleSelect}
                  onMouseEnter={handleMouseEnter}
                />
              </>
            )}

            {/* Empty State (no query, no recent) */}
            {!query && recentSearches.length === 0 && (
              <div className="px-4 py-12 text-center">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Search across all your data</p>
                <p className="text-sm text-slate-400 mt-1">
                  Find clients, engagements, and artifacts instantly
                </p>
              </div>
            )}
          </div>

          {/* Footer with keyboard hints */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium">
                  ↵
                </kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium">
                  Esc
                </kbd>
                Close
              </span>
            </div>
            {results && results.total > 0 && (
              <span>{results.total} result{results.total !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// =============================================================================
// Search Provider Hook
// =============================================================================

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  }
}

export default CommandPalette
