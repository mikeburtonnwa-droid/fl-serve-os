/**
 * Clone Wizard Component (F9.1)
 *
 * Multi-step wizard for cloning an engagement with configuration options.
 *
 * User Stories: US-033, US-034
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Copy,
  Building,
  FileText,
  Settings,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { ClientSelector } from './client-selector'
import { ArtifactSelector } from './artifact-selector'
import type { CloneWizardStep, CloneableArtifact, CloneResult } from '@/lib/cloning'

interface CloneWizardProps {
  engagementId: string
  engagementName: string
  sourceClientId: string
  sourceClientName: string
  onClose: () => void
  onComplete: (result: CloneResult) => void
}

export function CloneWizard({
  engagementId,
  engagementName,
  sourceClientId,
  sourceClientName,
  onClose,
  onComplete,
}: CloneWizardProps) {
  const [currentStep, setCurrentStep] = useState<CloneWizardStep>('select-client')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Configuration state
  const [targetClientId, setTargetClientId] = useState<string | null>(null)
  const [targetClientName, setTargetClientName] = useState<string>('')
  const [newEngagementName, setNewEngagementName] = useState(`${engagementName} (Copy)`)
  const [clearClientFields, setClearClientFields] = useState(true)
  const [includeVersionHistory, setIncludeVersionHistory] = useState(false)
  const [includeComments, setIncludeComments] = useState(false)
  const [preservePathway, setPreservePathway] = useState(true)
  const [cloneNotes, setCloneNotes] = useState('')
  const [artifacts, setArtifacts] = useState<CloneableArtifact[]>([])

  // Load clone preview data
  useEffect(() => {
    const loadPreview = async () => {
      try {
        const response = await fetch(`/api/engagements/${engagementId}/clone`)
        const data = await response.json()

        if (data.success) {
          setArtifacts(
            data.artifacts.map((a: CloneableArtifact) => ({
              ...a,
              selected: true, // Select all by default
            }))
          )
        }
      } catch {
        setError('Failed to load engagement data')
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [engagementId])

  const steps: { id: CloneWizardStep; label: string; icon: typeof Copy }[] = [
    { id: 'select-client', label: 'Select Client', icon: Building },
    { id: 'configure-clone', label: 'Configure', icon: Settings },
    { id: 'select-artifacts', label: 'Artifacts', icon: FileText },
    { id: 'review-confirm', label: 'Review', icon: Check },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  const canProceed = () => {
    switch (currentStep) {
      case 'select-client':
        return !!targetClientId
      case 'configure-clone':
        return newEngagementName.trim().length > 0
      case 'select-artifacts':
        return artifacts.some((a) => a.selected)
      case 'review-confirm':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const handleSubmit = async () => {
    if (!targetClientId) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/engagements/${engagementId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetClientId,
          newEngagementName,
          clearClientFields,
          selectedArtifactIds: artifacts.filter((a) => a.selected).map((a) => a.id),
          includeVersionHistory,
          includeComments,
          preservePathway,
          cloneNotes: cloneNotes || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onComplete(data)
      } else {
        setError(data.error || 'Failed to clone engagement')
      }
    } catch {
      setError('An error occurred while cloning')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedArtifactCount = artifacts.filter((a) => a.selected).length
  const clientDataArtifactCount = artifacts.filter(
    (a) => a.selected && a.hasClientData
  ).length

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Copy className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Clone Engagement</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Create a copy of &quot;{engagementName}&quot;
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isComplete = index < currentStepIndex

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : isComplete
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />
                  )}
                </div>
              )
            })}
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Step 1: Select Client */}
              {currentStep === 'select-client' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Select Target Client
                  </h3>
                  <p className="text-slate-600">
                    Choose which client will own the cloned engagement.
                  </p>
                  <ClientSelector
                    selectedClientId={targetClientId}
                    sourceClientId={sourceClientId}
                    onSelect={(id, name) => {
                      setTargetClientId(id)
                      setTargetClientName(name)
                    }}
                  />
                </div>
              )}

              {/* Step 2: Configure Clone */}
              {currentStep === 'configure-clone' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Configure Clone Settings
                  </h3>

                  {/* New Engagement Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      New Engagement Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newEngagementName}
                      onChange={(e) => setNewEngagementName(e.target.value)}
                      placeholder="Enter engagement name"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">
                      Clone Options
                    </label>

                    <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clearClientFields}
                        onChange={(e) => setClearClientFields(e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-slate-900">
                          Clear client-specific fields
                        </div>
                        <div className="text-sm text-slate-500">
                          Automatically remove client names, contact info, and other
                          sensitive data from artifacts.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preservePathway}
                        onChange={(e) => setPreservePathway(e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-slate-900">
                          Preserve pathway configuration
                        </div>
                        <div className="text-sm text-slate-500">
                          Keep the same implementation pathway as the source engagement.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer opacity-50">
                      <input
                        type="checkbox"
                        checked={includeVersionHistory}
                        onChange={(e) => setIncludeVersionHistory(e.target.checked)}
                        className="mt-1"
                        disabled
                      />
                      <div>
                        <div className="font-medium text-slate-900">
                          Include version history
                        </div>
                        <div className="text-sm text-slate-500">
                          Copy artifact version history (coming soon).
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer opacity-50">
                      <input
                        type="checkbox"
                        checked={includeComments}
                        onChange={(e) => setIncludeComments(e.target.checked)}
                        className="mt-1"
                        disabled
                      />
                      <div>
                        <div className="font-medium text-slate-900">
                          Include comments/notes
                        </div>
                        <div className="text-sm text-slate-500">
                          Copy internal comments and notes (coming soon).
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Clone Notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Clone Notes (optional)
                    </label>
                    <textarea
                      value={cloneNotes}
                      onChange={(e) => setCloneNotes(e.target.value)}
                      placeholder="Add any notes about why you're cloning this engagement..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Select Artifacts */}
              {currentStep === 'select-artifacts' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Select Artifacts to Clone
                  </h3>
                  <p className="text-slate-600">
                    Choose which artifacts to include in the cloned engagement.
                  </p>
                  <ArtifactSelector
                    artifacts={artifacts}
                    onSelectionChange={setArtifacts}
                  />
                </div>
              )}

              {/* Step 4: Review & Confirm */}
              {currentStep === 'review-confirm' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Review Clone Configuration
                  </h3>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-500">Source</div>
                      <div className="font-medium text-slate-900">{engagementName}</div>
                      <div className="text-sm text-slate-600">{sourceClientName}</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">Target</div>
                      <div className="font-medium text-slate-900">{newEngagementName}</div>
                      <div className="text-sm text-slate-600">{targetClientName}</div>
                    </div>
                  </div>

                  {/* Configuration Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">Artifacts to clone</span>
                      <Badge variant="default">{selectedArtifactCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">Clear client fields</span>
                      <Badge variant={clearClientFields ? 'success' : 'default'}>
                        {clearClientFields ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">Preserve pathway</span>
                      <Badge variant={preservePathway ? 'success' : 'default'}>
                        {preservePathway ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {clientDataArtifactCount > 0 && clearClientFields && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">
                          Artifacts with data to clear
                        </span>
                        <Badge variant="warning">{clientDataArtifactCount}</Badge>
                      </div>
                    )}
                  </div>

                  {/* Warning */}
                  {clientDataArtifactCount > 0 && clearClientFields && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Client data will be cleared
                        </p>
                        <p className="text-sm text-amber-700">
                          {clientDataArtifactCount} artifact(s) contain client-specific
                          fields that will be emptied in the clone.
                        </p>
                      </div>
                    </div>
                  )}

                  {cloneNotes && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-500 mb-1">Notes</div>
                      <div className="text-sm text-slate-700">{cloneNotes}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={currentStepIndex === 0 ? onClose : handleBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {currentStepIndex === 0 ? 'Cancel' : 'Back'}
            </Button>

            {currentStep === 'review-confirm' ? (
              <Button onClick={handleSubmit} disabled={submitting || !canProceed()}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Clone Engagement
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
