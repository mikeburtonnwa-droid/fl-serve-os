/**
 * Pathway Override Component (F7.3)
 *
 * Allows consultants to override the recommended pathway with justification.
 *
 * User Stories: US-029
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertTriangle,
  Zap,
  Clock,
  Calendar,
  Check,
  X,
  Loader2,
} from 'lucide-react'

interface PathwayOverrideProps {
  currentPathway: 'accelerated' | 'standard' | 'extended'
  recommendedPathway: 'accelerated' | 'standard' | 'extended'
  existingOverride?: {
    pathway: 'accelerated' | 'standard' | 'extended'
    justification: string
    overrideAt: string
  }
  onOverride: (pathway: string, justification: string) => Promise<void>
  onClearOverride?: () => Promise<void>
}

export function PathwayOverride({
  recommendedPathway,
  existingOverride,
  onOverride,
  onClearOverride,
}: PathwayOverrideProps) {
  const [isOverriding, setIsOverriding] = useState(false)
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null)
  const [justification, setJustification] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pathways = [
    {
      id: 'accelerated',
      label: 'Accelerated',
      icon: Zap,
      duration: '6-8 weeks',
      description: 'Fast-track implementation for highly prepared organizations',
      color: 'emerald',
    },
    {
      id: 'standard',
      label: 'Standard',
      icon: Clock,
      duration: '10-14 weeks',
      description: 'Balanced approach with adequate preparation time',
      color: 'blue',
    },
    {
      id: 'extended',
      label: 'Extended',
      icon: Calendar,
      duration: '16-24 weeks',
      description: 'Comprehensive timeline for complex requirements',
      color: 'amber',
    },
  ]

  const handleOverride = async () => {
    if (!selectedPathway || justification.length < 10) {
      setError('Please provide a detailed justification (at least 10 characters)')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onOverride(selectedPathway, justification)
      setIsOverriding(false)
      setSelectedPathway(null)
      setJustification('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save override')
    } finally {
      setSaving(false)
    }
  }

  const handleClearOverride = async () => {
    if (!onClearOverride) return

    setSaving(true)
    try {
      await onClearOverride()
    } finally {
      setSaving(false)
    }
  }

  const hasOverride = existingOverride !== undefined

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Pathway Selection</CardTitle>
          {hasOverride && (
            <Badge variant="warning" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Manual Override Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">System Recommendation</span>
            <PathwayBadge pathway={recommendedPathway} />
          </div>
          {hasOverride && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Current Override</span>
              <PathwayBadge pathway={existingOverride.pathway} isOverride />
            </div>
          )}
        </div>

        {/* Override justification display */}
        {hasOverride && existingOverride.justification && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 mb-1">
              Override Justification:
            </p>
            <p className="text-sm text-amber-700">{existingOverride.justification}</p>
            <p className="text-xs text-amber-600 mt-2">
              Set on {new Date(existingOverride.overrideAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Override form */}
        {isOverriding ? (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <p className="text-sm font-medium text-slate-700">
              Select a new pathway:
            </p>

            {/* Pathway options */}
            <div className="space-y-2">
              {pathways.map((pathway) => {
                const Icon = pathway.icon
                const isSelected = selectedPathway === pathway.id
                const isRecommended = pathway.id === recommendedPathway

                return (
                  <button
                    key={pathway.id}
                    type="button"
                    onClick={() => setSelectedPathway(pathway.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected ? 'bg-blue-100' : 'bg-slate-100'
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              isSelected ? 'text-blue-600' : 'text-slate-500'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {pathway.label}
                            </span>
                            {isRecommended && (
                              <Badge variant="success" size="sm">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            {pathway.duration}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Justification */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Justification <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain why you're overriding the recommended pathway..."
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                Minimum 10 characters required
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOverriding(false)
                  setSelectedPathway(null)
                  setJustification('')
                  setError(null)
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleOverride} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Override
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOverriding(true)}
              className="flex-1"
            >
              {hasOverride ? 'Change Override' : 'Override Pathway'}
            </Button>
            {hasOverride && onClearOverride && (
              <Button
                variant="ghost"
                onClick={handleClearOverride}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span className="ml-2">Clear Override</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Helper Components
// =============================================================================

function PathwayBadge({
  pathway,
  isOverride = false,
}: {
  pathway: 'accelerated' | 'standard' | 'extended'
  isOverride?: boolean
}) {
  const config = {
    accelerated: { label: 'Accelerated', variant: 'success' as const },
    standard: { label: 'Standard', variant: 'info' as const },
    extended: { label: 'Extended', variant: 'warning' as const },
  }

  const { label, variant } = config[pathway]

  return (
    <Badge variant={isOverride ? 'warning' : variant}>
      {label}
    </Badge>
  )
}
