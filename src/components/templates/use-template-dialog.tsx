/**
 * Use Template Dialog (F8.3)
 *
 * Dialog for selecting engagement and customizing template before use.
 *
 * User Stories: US-032
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'
import type { Template } from '@/lib/template-library'

interface Engagement {
  id: string
  name: string
  clientName: string
}

interface UseTemplateDialogProps {
  template: Template
  onClose: () => void
  onUse: (options: {
    templateId: string
    engagementId: string
    artifactName: string
    customizations: Record<string, string>
  }) => Promise<void>
}

export function UseTemplateDialog({
  template,
  onClose,
  onUse,
}: UseTemplateDialogProps) {
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedEngagement, setSelectedEngagement] = useState<string | null>(null)
  const [artifactName, setArtifactName] = useState(template.name)
  const [customizations, setCustomizations] = useState<Record<string, string>>({})
  const [showEngagementDropdown, setShowEngagementDropdown] = useState(false)

  // Extract placeholders from content
  const placeholders = extractPlaceholders(template.content)

  useEffect(() => {
    fetchEngagements()
  }, [])

  const fetchEngagements = async () => {
    try {
      const response = await fetch('/api/engagements?status=active&limit=50')
      const data = await response.json()

      if (data.success) {
        setEngagements(
          data.engagements.map((e: { id: string; name: string; client?: { name: string } }) => ({
            id: e.id,
            name: e.name,
            clientName: e.client?.name || 'Unknown Client',
          }))
        )
      }
    } catch (err) {
      console.error('Error fetching engagements:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedEngagement) {
      setError('Please select an engagement')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onUse({
        templateId: template.id,
        engagementId: selectedEngagement,
        artifactName,
        customizations,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create artifact')
    } finally {
      setSaving(false)
    }
  }

  const selectedEngagementData = engagements.find((e) => e.id === selectedEngagement)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Use Template</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Create a new artifact from &quot;{template.name}&quot;
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Engagement Selection */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Select Engagement <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <button
                type="button"
                onClick={() => setShowEngagementDropdown(!showEngagementDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 text-left border border-slate-300 rounded-lg bg-white hover:bg-slate-50"
              >
                {selectedEngagementData ? (
                  <div>
                    <span className="font-medium">{selectedEngagementData.name}</span>
                    <span className="text-slate-500 ml-2">
                      ({selectedEngagementData.clientName})
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400">Select an engagement...</span>
                )}
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {showEngagementDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </div>
                  ) : engagements.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      No active engagements found
                    </div>
                  ) : (
                    engagements.map((engagement) => (
                      <button
                        key={engagement.id}
                        type="button"
                        onClick={() => {
                          setSelectedEngagement(engagement.id)
                          setShowEngagementDropdown(false)
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-50 ${
                          selectedEngagement === engagement.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium">{engagement.name}</div>
                        <div className="text-sm text-slate-500">
                          {engagement.clientName}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Artifact Name */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Artifact Name
            </label>
            <Input
              value={artifactName}
              onChange={(e) => setArtifactName(e.target.value)}
              placeholder="Enter artifact name"
              className="mt-1"
            />
          </div>

          {/* Placeholders */}
          {placeholders.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Customize Placeholders
                <span className="text-slate-400 font-normal ml-2">
                  (optional, can edit later)
                </span>
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {placeholders.slice(0, 10).map((placeholder) => (
                  <div key={placeholder} className="flex items-center gap-2">
                    <Badge variant="default" size="sm" className="flex-shrink-0">
                      [{placeholder}]
                    </Badge>
                    <Input
                      value={customizations[placeholder] || ''}
                      onChange={(e) =>
                        setCustomizations((prev) => ({
                          ...prev,
                          [placeholder]: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${placeholder.toLowerCase()}`}
                      className="flex-1"
                    />
                  </div>
                ))}
                {placeholders.length > 10 && (
                  <p className="text-sm text-slate-500">
                    +{placeholders.length - 10} more placeholders (edit in artifact)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !selectedEngagement}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Create Artifact
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

function extractPlaceholders(content: string): string[] {
  const regex = /\[([A-Z][A-Za-z0-9\s_-]+)\]/g
  const matches = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    // Skip common markdown/template syntax
    if (!['X', 'NAME', 'DATE', 'COMPANY', 'EMAIL', 'PHONE', 'URL'].includes(match[1])) {
      matches.add(match[1])
    }
  }

  return Array.from(matches)
}
