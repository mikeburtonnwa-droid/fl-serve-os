'use client'

/**
 * Artifact Suggestions Component (Enhanced for Epic 2)
 *
 * Displays AI-suggested artifacts with:
 * - F2.1: Intelligent field mapping with warnings
 * - F2.2: Preview & Edit modal before creation
 * - F2.3: Batch creation ("Create All")
 * - F2.4: Diff viewer for changes
 *
 * User Stories: US-006 through US-012
 */

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Edit3,
  AlertTriangle,
  AlertCircle,
  ListChecks,
} from 'lucide-react'
import { TEMPLATE_METADATA, type TemplateId } from '@/lib/workflow'
import { mapAISuggestionToTemplate, getMappingSummary, canCreateArtifact } from '@/lib/field-mapper'
import { ArtifactPreviewModal } from './artifact-preview-modal'
import { createBrowserClient } from '@supabase/ssr'
import { useToast } from '@/components/ui/toast'

// =============================================================================
// Types
// =============================================================================

interface SuggestedArtifact {
  templateId: TemplateId
  suggestedContent: Record<string, unknown>
  action: 'create' | 'update'
}

interface ArtifactSuggestionsProps {
  engagementId: string
  stationId: string
  suggestions: SuggestedArtifact[]
  onArtifactCreated?: () => void
}

interface CreationResult {
  success: boolean
  artifactId?: string
  error?: string
}

// =============================================================================
// Main Component
// =============================================================================

export function ArtifactSuggestions({
  engagementId,
  stationId,
  suggestions,
  onArtifactCreated,
}: ArtifactSuggestionsProps) {
  const { addToast } = useToast()
  const [creating, setCreating] = useState<string | null>(null)
  const [batchCreating, setBatchCreating] = useState(false)
  const [created, setCreated] = useState<Map<string, string>>(new Map()) // templateId -> artifactId
  const [expanded, setExpanded] = useState<string | null>(null)
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    suggestion: SuggestedArtifact | null
  }>({ isOpen: false, suggestion: null })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Pre-compute mapping results for all suggestions
  const mappingResults = useMemo(() => {
    return suggestions.map(suggestion => ({
      suggestion,
      mapping: mapAISuggestionToTemplate(suggestion.templateId, suggestion.suggestedContent),
      summary: getMappingSummary(mapAISuggestionToTemplate(suggestion.templateId, suggestion.suggestedContent)),
      validation: canCreateArtifact(mapAISuggestionToTemplate(suggestion.templateId, suggestion.suggestedContent)),
    }))
  }, [suggestions])

  // Create single artifact
  const createArtifact = useCallback(async (
    suggestion: SuggestedArtifact,
    content?: Record<string, unknown>
  ): Promise<CreationResult> => {
    const meta = TEMPLATE_METADATA[suggestion.templateId]
    const mappingResult = mapAISuggestionToTemplate(
      suggestion.templateId,
      content || suggestion.suggestedContent
    )

    try {
      // Check if artifact already exists for this template
      const { data: existing } = await supabase
        .from('artifacts')
        .select('id, version')
        .eq('engagement_id', engagementId)
        .eq('template_id', suggestion.templateId)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      let version = 1
      let artifactName = meta.name

      if (existing && suggestion.action === 'update') {
        version = existing.version + 1
        artifactName = `${meta.name} (v${version})`
      }

      const { data: artifact, error } = await supabase
        .from('artifacts')
        .insert({
          engagement_id: engagementId,
          template_id: suggestion.templateId,
          name: artifactName,
          content: mappingResult.mappedContent,
          status: 'draft',
          sensitivity_tier: meta.tier,
          version,
          source_station: stationId,
        })
        .select('id')
        .single()

      if (error) throw error

      return { success: true, artifactId: artifact.id }
    } catch (err) {
      console.error('Failed to create artifact:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }
  }, [engagementId, stationId, supabase])

  // Handle single artifact creation
  const handleCreate = useCallback(async (suggestion: SuggestedArtifact) => {
    setCreating(suggestion.templateId)

    const result = await createArtifact(suggestion)

    if (result.success && result.artifactId) {
      setCreated(prev => new Map(prev).set(suggestion.templateId, result.artifactId!))
      addToast({
        type: 'success',
        title: 'Artifact Created',
        message: `${TEMPLATE_METADATA[suggestion.templateId].name} created successfully`,
      })
      onArtifactCreated?.()
    } else {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: result.error || 'Failed to create artifact',
      })
    }

    setCreating(null)
  }, [createArtifact, addToast, onArtifactCreated])

  // Handle preview modal confirm
  const handlePreviewConfirm = useCallback(async (content: Record<string, unknown>) => {
    if (!previewModal.suggestion) return

    setPreviewModal({ isOpen: false, suggestion: null })
    setCreating(previewModal.suggestion.templateId)

    const result = await createArtifact(previewModal.suggestion, content)

    if (result.success && result.artifactId) {
      setCreated(prev => new Map(prev).set(previewModal.suggestion!.templateId, result.artifactId!))
      addToast({
        type: 'success',
        title: 'Artifact Created',
        message: `${TEMPLATE_METADATA[previewModal.suggestion.templateId].name} created with your edits`,
      })
      onArtifactCreated?.()
    } else {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: result.error || 'Failed to create artifact',
      })
    }

    setCreating(null)
  }, [previewModal.suggestion, createArtifact, addToast, onArtifactCreated])

  // Handle batch creation (F2.3: US-011, US-012)
  const handleCreateAll = useCallback(async () => {
    setBatchCreating(true)

    const pendingSuggestions = suggestions.filter(s => !created.has(s.templateId))
    const results: Array<{ templateId: string; success: boolean; error?: string }> = []

    for (const suggestion of pendingSuggestions) {
      const result = await createArtifact(suggestion)
      results.push({
        templateId: suggestion.templateId,
        success: result.success,
        error: result.error,
      })

      if (result.success && result.artifactId) {
        setCreated(prev => new Map(prev).set(suggestion.templateId, result.artifactId!))
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    if (failCount === 0) {
      addToast({
        type: 'success',
        title: 'All Artifacts Created',
        message: `Successfully created ${successCount} artifact${successCount !== 1 ? 's' : ''}`,
      })
    } else if (successCount > 0) {
      addToast({
        type: 'warning',
        title: 'Partial Success',
        message: `Created ${successCount} artifact${successCount !== 1 ? 's' : ''}, ${failCount} failed`,
      })
    } else {
      addToast({
        type: 'error',
        title: 'Batch Creation Failed',
        message: 'All artifact creations failed',
      })
    }

    onArtifactCreated?.()
    setBatchCreating(false)
  }, [suggestions, created, createArtifact, addToast, onArtifactCreated])

  if (suggestions.length === 0) return null

  const pendingCount = suggestions.filter(s => !created.has(s.templateId)).length

  return (
    <>
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-900">AI-Generated Artifacts</CardTitle>
            </div>
            {pendingCount > 1 && (
              <Button
                size="sm"
                onClick={handleCreateAll}
                disabled={creating !== null || batchCreating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {batchCreating ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ListChecks className="h-3 w-3 mr-1" />
                    Create All ({pendingCount})
                  </>
                )}
              </Button>
            )}
          </div>
          <CardDescription>
            {stationId} has suggested {suggestions.length} artifact
            {suggestions.length !== 1 ? 's' : ''} to create
            {created.size > 0 && ` (${created.size} created)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mappingResults.map(({ suggestion, mapping, summary, validation }) => {
            const meta = TEMPLATE_METADATA[suggestion.templateId]
            const isCreated = created.has(suggestion.templateId)
            const isExpanded = expanded === suggestion.templateId
            const hasWarnings = mapping.warnings.length > 0
            const hasErrors = !validation.canCreate

            return (
              <div
                key={suggestion.templateId}
                className="rounded-lg bg-white border border-purple-200 overflow-hidden"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isCreated ? 'bg-green-100' :
                        hasErrors ? 'bg-red-100' :
                        hasWarnings ? 'bg-yellow-100' :
                        'bg-purple-100'
                      }`}
                    >
                      {isCreated ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : hasErrors ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : hasWarnings ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">{meta.name}</span>
                        <Badge variant={suggestion.action === 'update' ? 'info' : 'default'} size="sm">
                          {suggestion.action === 'update' ? 'Update' : 'New'}
                        </Badge>
                        <Badge variant={meta.tier === 'T2' ? 'warning' : 'default'} size="sm">
                          {meta.tier}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">
                          {summary.mappedFields}/{summary.totalFields} fields mapped
                        </span>
                        {summary.coercedFields > 0 && (
                          <span className="text-xs text-yellow-600">
                            • {summary.coercedFields} auto-corrected
                          </span>
                        )}
                        {summary.missingFields > 0 && mapping.missingRequired.length > 0 && (
                          <span className="text-xs text-red-600">
                            • {mapping.missingRequired.length} required missing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(isExpanded ? null : suggestion.templateId)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>

                    {isCreated ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Created
                      </Badge>
                    ) : (
                      <>
                        {/* Preview & Edit button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewModal({ isOpen: true, suggestion })}
                          disabled={creating !== null || batchCreating}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Preview & Edit
                        </Button>

                        {/* Quick create (only if valid) */}
                        {validation.canCreate && (
                          <Button
                            size="sm"
                            onClick={() => handleCreate(suggestion)}
                            disabled={creating !== null || batchCreating}
                          >
                            {creating === suggestion.templateId ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Create
                              </>
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-purple-100 p-4 bg-slate-50 space-y-3">
                    {/* Warnings */}
                    {mapping.warnings.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs font-medium text-yellow-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Mapping Notes
                        </p>
                        <ul className="text-xs text-yellow-700 space-y-0.5">
                          {mapping.warnings.map((warning, i) => (
                            <li key={i}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Errors */}
                    {!validation.canCreate && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-medium text-red-800 mb-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Cannot Create - Issues Found
                        </p>
                        <ul className="text-xs text-red-700 space-y-0.5">
                          {validation.blockers.map((blocker, i) => (
                            <li key={i}>• {blocker}</li>
                          ))}
                        </ul>
                        <p className="text-xs text-red-600 mt-2">
                          Use &quot;Preview &amp; Edit&quot; to fix these issues before creating.
                        </p>
                      </div>
                    )}

                    {/* Mapped Content Preview */}
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">Mapped Content Preview</p>
                      <pre className="text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto bg-white p-3 rounded border border-slate-200">
                        {JSON.stringify(mapping.mappedContent, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewModal.suggestion && (
        <ArtifactPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, suggestion: null })}
          onConfirm={handlePreviewConfirm}
          templateId={previewModal.suggestion.templateId}
          suggestedContent={previewModal.suggestion.suggestedContent}
          action={previewModal.suggestion.action}
        />
      )}
    </>
  )
}
