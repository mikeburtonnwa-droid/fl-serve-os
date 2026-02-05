/**
 * Template Library Component (F8.1)
 *
 * Main component for browsing and searching templates.
 *
 * User Stories: US-031, US-032
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  Loader2,
  FileText,
  ClipboardCheck,
  BarChart,
  Presentation,
  Calendar,
  ListChecks,
  File,
  X,
} from 'lucide-react'
import { TemplateCard } from './template-card'
import { TemplateViewer } from './template-viewer'
import { UseTemplateDialog } from './use-template-dialog'
import type { Template, TemplateCategory, TemplatePreview } from '@/lib/template-library'
import { DEFAULT_CATEGORIES } from '@/lib/template-library'

interface TemplateLibraryProps {
  onArtifactCreated?: (artifactId: string) => void
}

export function TemplateLibrary({ onArtifactCreated }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<TemplatePreview[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null)
  const [selectedSource, setSelectedSource] = useState<'all' | 'system' | 'user' | 'community'>(
    'all'
  )
  const [showFilters, setShowFilters] = useState(false)

  // Viewer state
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null)
  const [usingTemplate, setUsingTemplate] = useState<Template | null>(null)

  // Fetch templates
  const fetchTemplates = useCallback(async (resetPage = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedCategory) params.set('category', selectedCategory)
      if (selectedSource !== 'all') params.set('source', selectedSource)
      params.set('page', resetPage ? '1' : String(page))
      params.set('pageSize', '12')

      const response = await fetch(`/api/templates?${params}`)
      const data = await response.json()

      if (data.success) {
        if (resetPage) {
          setTemplates(data.templates)
          setPage(1)
        } else {
          setTemplates((prev) => [...prev, ...data.templates])
        }
        setTotal(data.total)
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory, selectedSource, page])

  useEffect(() => {
    fetchTemplates(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, selectedSource])

  // View template details
  const handleView = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      const data = await response.json()

      if (data.success) {
        setViewingTemplate(data.template)
      }
    } catch (error) {
      console.error('Error fetching template:', error)
    }
  }

  // Start using template
  const handleUseStart = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      const data = await response.json()

      if (data.success) {
        setViewingTemplate(null)
        setUsingTemplate(data.template)
      }
    } catch (error) {
      console.error('Error fetching template:', error)
    }
  }

  // Complete template usage
  const handleUseComplete = async (options: {
    templateId: string
    engagementId: string
    artifactName: string
    customizations: Record<string, string>
  }) => {
    const response = await fetch(`/api/templates/${options.templateId}/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engagementId: options.engagementId,
        artifactName: options.artifactName,
        customizations: options.customizations,
      }),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to create artifact')
    }

    if (onArtifactCreated) {
      onArtifactCreated(data.artifact.id)
    }
  }

  // Load more templates
  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
    fetchTemplates(false)
  }

  // Clear filters
  const clearFilters = () => {
    setSearch('')
    setSelectedCategory(null)
    setSelectedSource('all')
  }

  const hasActiveFilters = search || selectedCategory || selectedSource !== 'all'

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, typeof FileText> = {
      assessment: ClipboardCheck,
      proposal: FileText,
      report: BarChart,
      presentation: Presentation,
      plan: Calendar,
      checklist: ListChecks,
      other: File,
    }
    const Icon = icons[category] || File
    return Icon
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Template Library</h2>
          <p className="text-slate-500">
            Browse example artifacts and use them as starting points
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="default" size="sm" className="ml-2">
                Active
              </Badge>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_CATEGORIES.map((cat) => {
                      const Icon = getCategoryIcon(cat.id)
                      return (
                        <Button
                          key={cat.id}
                          variant={selectedCategory === cat.id ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() =>
                            setSelectedCategory(
                              selectedCategory === cat.id ? null : cat.id
                            )
                          }
                        >
                          <Icon className="h-3.5 w-3.5 mr-1" />
                          {cat.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Source Filter */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Source
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'system', label: 'Official' },
                      { id: 'user', label: 'My Templates' },
                      { id: 'community', label: 'Community' },
                    ].map((source) => (
                      <Button
                        key={source.id}
                        variant={
                          selectedSource === source.id ? 'primary' : 'outline'
                        }
                        size="sm"
                        onClick={() =>
                          setSelectedSource(
                            source.id as 'all' | 'system' | 'user' | 'community'
                          )
                        }
                      >
                        {source.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {total} template{total !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Templates Grid */}
      {loading && templates.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No templates found</p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                id={template.id}
                name={template.name}
                description={template.description}
                category={template.category}
                tags={template.tags}
                usageCount={template.usageCount}
                rating={template.rating}
                ratingCount={template.ratingCount}
                source={template.source}
                onView={handleView}
                onUse={handleUseStart}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {/* Template Viewer Modal */}
      {viewingTemplate && (
        <TemplateViewer
          template={viewingTemplate}
          onClose={() => setViewingTemplate(null)}
          onUse={handleUseStart}
        />
      )}

      {/* Use Template Dialog */}
      {usingTemplate && (
        <UseTemplateDialog
          template={usingTemplate}
          onClose={() => setUsingTemplate(null)}
          onUse={handleUseComplete}
        />
      )}
    </div>
  )
}
