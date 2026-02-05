/**
 * Scenario Manager Component (F6.3)
 *
 * Save, load, and manage ROI scenarios.
 *
 * User Stories: US-026
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  FolderOpen,
  Trash2,
  Star,
  StarOff,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ROIScenario, ROIInputs } from '@/lib/roi'
import { formatCurrency, formatPercent, formatPayback } from '@/lib/roi'

interface ScenarioManagerProps {
  engagementId: string
  currentInputs: ROIInputs
  scenarios: ROIScenario[]
  onLoad: (scenario: ROIScenario) => void
  onSave: (name: string, description?: string) => Promise<void>
  onDelete: (scenarioId: string) => Promise<void>
  onSetRecommended: (scenarioId: string, isRecommended: boolean) => Promise<void>
  onRefresh: () => Promise<void>
  maxScenarios?: number
}

export function ScenarioManager({
  scenarios,
  onLoad,
  onSave,
  onDelete,
  onSetRecommended,
  onRefresh,
  maxScenarios = 5,
}: ScenarioManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSaveMore = scenarios.length < maxScenarios

  const handleSave = async () => {
    if (!saveName.trim()) {
      setError('Please enter a name for this scenario')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave(saveName.trim(), saveDescription.trim() || undefined)
      setShowSaveDialog(false)
      setSaveName('')
      setSaveDescription('')
      await onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scenario')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (scenarioId: string) => {
    setDeleting(scenarioId)
    try {
      await onDelete(scenarioId)
      await onRefresh()
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleRecommended = async (
    scenarioId: string,
    currentlyRecommended: boolean
  ) => {
    await onSetRecommended(scenarioId, !currentlyRecommended)
    await onRefresh()
  }

  return (
    <div className="space-y-4">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Saved Scenarios</h3>
          <p className="text-sm text-slate-500">
            {scenarios.length} of {maxScenarios} scenarios
          </p>
        </div>
        <Button
          onClick={() => setShowSaveDialog(true)}
          disabled={!canSaveMore}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Current
        </Button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Scenario Name
                </label>
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g., Conservative Estimate"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Description (optional)
                </label>
                <Input
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Brief description of this scenario"
                  className="mt-1"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveDialog(false)
                    setSaveName('')
                    setSaveDescription('')
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span className="ml-2">Save Scenario</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenarios List */}
      {scenarios.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No saved scenarios yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Save your current configuration to compare different options
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onLoad={() => onLoad(scenario)}
              onDelete={() => handleDelete(scenario.id)}
              onToggleRecommended={() =>
                handleToggleRecommended(scenario.id, scenario.isRecommended)
              }
              isDeleting={deleting === scenario.id}
            />
          ))}
        </div>
      )}

      {/* Limit Warning */}
      {!canSaveMore && (
        <p className="text-sm text-amber-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Maximum scenarios reached. Delete one to save a new scenario.
        </p>
      )}
    </div>
  )
}

// =============================================================================
// Scenario Card Component
// =============================================================================

interface ScenarioCardProps {
  scenario: ROIScenario
  onLoad: () => void
  onDelete: () => void
  onToggleRecommended: () => void
  isDeleting: boolean
}

function ScenarioCard({
  scenario,
  onLoad,
  onDelete,
  onToggleRecommended,
  isDeleting,
}: ScenarioCardProps) {
  const results = scenario.results

  return (
    <Card
      className={`transition-colors ${
        scenario.isRecommended ? 'border-emerald-300 bg-emerald-50/30' : ''
      }`}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">{scenario.name}</h4>
              {scenario.isRecommended && (
                <Badge variant="success" size="sm">
                  Recommended
                </Badge>
              )}
            </div>
            {scenario.description && (
              <p className="text-sm text-slate-500 mt-1">{scenario.description}</p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Saved {formatDistanceToNow(new Date(scenario.createdAt), { addSuffix: true })}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleRecommended}
              title={scenario.isRecommended ? 'Remove recommendation' : 'Mark as recommended'}
            >
              {scenario.isRecommended ? (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              ) : (
                <StarOff className="h-4 w-4 text-slate-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              title="Delete scenario"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500">ROI</p>
            <p
              className={`text-sm font-semibold ${
                results.roi > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatPercent(results.roi)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Payback</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatPayback(results.paybackMonths)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Net Benefit</p>
            <p
              className={`text-sm font-semibold ${
                results.netBenefit > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(results.netBenefit)}
            </p>
          </div>
          <div className="flex items-end justify-end">
            <Button variant="outline" size="sm" onClick={onLoad}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Load
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
