'use client'

import { useState } from 'react'
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
  Eye,
} from 'lucide-react'
import { TEMPLATE_METADATA, type TemplateId } from '@/lib/workflow'
import { createBrowserClient } from '@supabase/ssr'

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

export function ArtifactSuggestions({
  engagementId,
  stationId,
  suggestions,
  onArtifactCreated,
}: ArtifactSuggestionsProps) {
  const [creating, setCreating] = useState<string | null>(null)
  const [created, setCreated] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const createArtifact = async (suggestion: SuggestedArtifact) => {
    setCreating(suggestion.templateId)
    setError(null)

    try {
      const meta = TEMPLATE_METADATA[suggestion.templateId]

      // Check if artifact already exists for this template
      const { data: existing } = await supabase
        .from('artifacts')
        .select('id, version')
        .eq('engagement_id', engagementId)
        .eq('template_id', suggestion.templateId)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (existing && suggestion.action === 'update') {
        // Update existing artifact - create new version
        const { error: updateError } = await supabase
          .from('artifacts')
          .insert({
            engagement_id: engagementId,
            template_id: suggestion.templateId,
            name: `${meta.name} (v${existing.version + 1})`,
            content: suggestion.suggestedContent,
            status: 'draft',
            sensitivity_tier: meta.tier,
            version: existing.version + 1,
            source_station: stationId,
          })

        if (updateError) throw updateError
      } else {
        // Create new artifact
        const { error: createError } = await supabase
          .from('artifacts')
          .insert({
            engagement_id: engagementId,
            template_id: suggestion.templateId,
            name: meta.name,
            content: suggestion.suggestedContent,
            status: 'draft',
            sensitivity_tier: meta.tier,
            version: 1,
            source_station: stationId,
          })

        if (createError) throw createError
      }

      setCreated((prev) => [...prev, suggestion.templateId])
      onArtifactCreated?.()
    } catch (err) {
      console.error('Failed to create artifact:', err)
      setError(`Failed to create ${TEMPLATE_METADATA[suggestion.templateId].name}`)
    } finally {
      setCreating(null)
    }
  }

  const createAll = async () => {
    for (const suggestion of suggestions) {
      if (!created.includes(suggestion.templateId)) {
        await createArtifact(suggestion)
      }
    }
  }

  if (suggestions.length === 0) return null

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-purple-900">AI-Generated Artifacts</CardTitle>
          </div>
          {suggestions.length > 1 && created.length !== suggestions.length && (
            <Button
              size="sm"
              onClick={createAll}
              disabled={creating !== null}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create All
            </Button>
          )}
        </div>
        <CardDescription>
          {stationId} has suggested {suggestions.length} artifact
          {suggestions.length !== 1 ? 's' : ''} to create
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {suggestions.map((suggestion) => {
          const meta = TEMPLATE_METADATA[suggestion.templateId]
          const isCreated = created.includes(suggestion.templateId)
          const isExpanded = expanded === suggestion.templateId

          return (
            <div
              key={suggestion.templateId}
              className="rounded-lg bg-white border border-purple-200 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isCreated ? 'bg-green-100' : 'bg-purple-100'
                    }`}
                  >
                    {isCreated ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{meta.name}</span>
                      <Badge variant={suggestion.action === 'update' ? 'info' : 'default'} size="sm">
                        {suggestion.action === 'update' ? 'Update' : 'New'}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {meta.tier}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{meta.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(isExpanded ? null : suggestion.templateId)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 ml-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                  {isCreated ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Created
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => createArtifact(suggestion)}
                      disabled={creating !== null}
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
                </div>
              </div>

              {/* Preview content */}
              {isExpanded && (
                <div className="border-t border-purple-100 p-4 bg-slate-50">
                  <pre className="text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {JSON.stringify(suggestion.suggestedContent, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
