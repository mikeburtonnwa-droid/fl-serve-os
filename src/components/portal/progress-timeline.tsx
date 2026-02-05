/**
 * Progress Timeline Component (F10.5)
 *
 * Shows engagement progress timeline for client portal view.
 *
 * User Stories: US-037
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Clock,
  Circle,
  AlertCircle,
  Loader2,
  Calendar,
  Target,
} from 'lucide-react'

interface Phase {
  id: string
  name: string
  status: 'completed' | 'in_progress' | 'upcoming' | 'blocked'
  startDate?: string
  endDate?: string
  completedDate?: string
  description?: string
  milestones?: Milestone[]
}

interface Milestone {
  id: string
  name: string
  status: 'completed' | 'pending'
  date?: string
}

interface EngagementProgress {
  currentPhase: string
  phases: Phase[]
  overallProgress: number
  estimatedCompletion?: string
}

interface ProgressTimelineProps {
  engagementId: string
  isPortalView?: boolean
}

export function ProgressTimeline({
  engagementId,
  isPortalView = false,
}: ProgressTimelineProps) {
  const [progress, setProgress] = useState<EngagementProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const baseUrl = isPortalView ? '/api/portal' : '/api'
        const response = await fetch(
          `${baseUrl}/engagements/${engagementId}/progress`
        )
        const data = await response.json()

        if (data.success) {
          setProgress(data.progress)
        } else {
          setError(data.error)
        }
      } catch {
        setError('Failed to load progress')
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [engagementId, isPortalView])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (error || !progress) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-slate-500">
            {error || 'No progress data available'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Engagement Progress
          </CardTitle>
          <Badge variant="info">{progress.overallProgress}% Complete</Badge>
        </div>
        {progress.estimatedCompletion && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
            <Calendar className="h-4 w-4" />
            Estimated completion: {formatDate(progress.estimatedCompletion)}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {progress.phases.map((phase, index) => (
            <PhaseItem
              key={phase.id}
              phase={phase}
              isLast={index === progress.phases.length - 1}
              isCurrent={phase.id === progress.currentPhase}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Phase Item Sub-component
// =============================================================================

interface PhaseItemProps {
  phase: Phase
  isLast: boolean
  isCurrent: boolean
}

function PhaseItem({ phase, isLast, isCurrent }: PhaseItemProps) {
  const statusConfig = {
    completed: {
      icon: CheckCircle,
      iconClass: 'text-green-500',
      lineClass: 'bg-green-300',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200',
    },
    in_progress: {
      icon: Clock,
      iconClass: 'text-blue-500 animate-pulse',
      lineClass: 'bg-blue-300',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200',
    },
    upcoming: {
      icon: Circle,
      iconClass: 'text-slate-300',
      lineClass: 'bg-slate-200',
      bgClass: 'bg-slate-50',
      borderClass: 'border-slate-200',
    },
    blocked: {
      icon: AlertCircle,
      iconClass: 'text-red-500',
      lineClass: 'bg-red-300',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200',
    },
  }

  const config = statusConfig[phase.status]
  const Icon = config.icon

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line */}
      {!isLast && (
        <div
          className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${config.lineClass}`}
        />
      )}

      {/* Icon */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgClass}`}
        >
          <Icon className={`h-5 w-5 ${config.iconClass}`} />
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
        <div
          className={`p-4 rounded-lg border ${config.borderClass} ${config.bgClass} ${
            isCurrent ? 'ring-2 ring-blue-200' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-slate-900">{phase.name}</h4>
            <StatusBadge status={phase.status} />
          </div>

          {phase.description && (
            <p className="text-sm text-slate-600 mb-3">{phase.description}</p>
          )}

          {/* Dates */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {phase.startDate && (
              <span>Started: {formatDate(phase.startDate)}</span>
            )}
            {phase.completedDate && (
              <span>Completed: {formatDate(phase.completedDate)}</span>
            )}
            {phase.endDate && phase.status !== 'completed' && (
              <span>Target: {formatDate(phase.endDate)}</span>
            )}
          </div>

          {/* Milestones */}
          {phase.milestones && phase.milestones.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-2">
                Milestones
              </div>
              <div className="space-y-1">
                {phase.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {milestone.status === 'completed' ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span
                      className={
                        milestone.status === 'completed'
                          ? 'text-slate-600 line-through'
                          : 'text-slate-700'
                      }
                    >
                      {milestone.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Status Badge Sub-component
// =============================================================================

interface StatusBadgeProps {
  status: Phase['status']
}

function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<Phase['status'], 'success' | 'info' | 'default' | 'danger'> = {
    completed: 'success',
    in_progress: 'info',
    upcoming: 'default',
    blocked: 'danger',
  }

  const labels: Record<Phase['status'], string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    upcoming: 'Upcoming',
    blocked: 'Blocked',
  }

  return (
    <Badge variant={variants[status]} size="sm">
      {labels[status]}
    </Badge>
  )
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// =============================================================================
// Compact Progress Bar (for lists)
// =============================================================================

interface CompactProgressProps {
  progress: number
  status?: 'on_track' | 'at_risk' | 'delayed'
}

export function CompactProgress({ progress, status = 'on_track' }: CompactProgressProps) {
  const statusColors = {
    on_track: 'bg-green-500',
    at_risk: 'bg-amber-500',
    delayed: 'bg-red-500',
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${statusColors[status]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-slate-500">{progress}%</span>
    </div>
  )
}
