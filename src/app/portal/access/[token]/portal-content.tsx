/**
 * Portal Content Component
 *
 * Main content area for the client portal.
 *
 * User Stories: US-037, US-038
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building,
  Calendar,
  FileText,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Target,
  Briefcase,
} from 'lucide-react'
import { ProgressTimeline } from '@/components/portal/progress-timeline'

interface PortalData {
  engagement: {
    id: string
    name: string
    status: string
    startDate?: string
    endDate?: string
    description?: string
    progress?: number
  }
  client: {
    id: string
    name: string
    industry?: string
  }
  artifacts: VisibleArtifact[]
  accessInfo: {
    clientEmail: string
    clientName?: string
    expiresAt: string
    accessCount: number
  }
}

interface VisibleArtifact {
  id: string
  name: string
  type: string
  status: string
  updatedAt: string
  description?: string
  downloadUrl?: string
}

interface PortalContentProps {
  token: string
}

export function PortalContent({ token }: PortalContentProps) {
  const [portalData, setPortalData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const validateAndFetch = async () => {
      try {
        // Validate token and create session
        const validateResponse = await fetch('/api/portal/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const validateData = await validateResponse.json()

        if (!validateData.success) {
          setError(validateData.error || 'Invalid or expired link')
          setLoading(false)
          return
        }

        setSessionId(validateData.sessionId)

        // Fetch portal data
        const engagementId = validateData.engagementId
        const portalResponse = await fetch(
          `/api/portal/engagement/${engagementId}`,
          {
            headers: {
              'X-Portal-Session': validateData.sessionId,
            },
          }
        )

        const portalDataResult = await portalResponse.json()

        if (portalDataResult.success) {
          setPortalData(portalDataResult.data)
        } else {
          setError(portalDataResult.error || 'Failed to load portal')
        }
      } catch {
        setError('Unable to connect to the portal')
      } finally {
        setLoading(false)
      }
    }

    validateAndFetch()
  }, [token])

  // Track artifact views
  const trackArtifactView = async (artifactId: string) => {
    if (!sessionId) return

    try {
      await fetch('/api/portal/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal-Session': sessionId,
        },
        body: JSON.stringify({
          action: 'artifact_view',
          artifactId,
        }),
      })
    } catch {
      // Silently fail tracking
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <PortalError error={error} />
  }

  if (!portalData) {
    return <PortalError error="Portal data not available" />
  }

  const { engagement, client, artifacts, accessInfo } = portalData

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {engagement.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Building className="h-4 w-4" />
                  {client.name}
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-slate-500">
                Welcome, {accessInfo.clientName || accessInfo.clientEmail}
              </div>
              <div className="text-slate-400 text-xs">
                Link expires {formatDate(accessInfo.expiresAt)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Engagement Info & Progress */}
          <div className="lg:col-span-1 space-y-6">
            {/* Engagement Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Engagement Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Status</span>
                  <EngagementStatusBadge status={engagement.status} />
                </div>

                {engagement.progress !== undefined && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-medium">{engagement.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${engagement.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {engagement.startDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Start Date</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(engagement.startDate)}
                    </span>
                  </div>
                )}

                {engagement.endDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Target End</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(engagement.endDate)}
                    </span>
                  </div>
                )}

                {engagement.description && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-sm text-slate-600">
                      {engagement.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Timeline */}
            <ProgressTimeline engagementId={engagement.id} isPortalView />
          </div>

          {/* Right Column - Artifacts */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Deliverables
                  </CardTitle>
                  <Badge variant="default">{artifacts.length} available</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {artifacts.length > 0 ? (
                  <div className="space-y-3">
                    {artifacts.map((artifact) => (
                      <ArtifactCard
                        key={artifact.id}
                        artifact={artifact}
                        onView={() => trackArtifactView(artifact.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      No deliverables are available yet.
                    </p>
                    <p className="text-sm text-slate-400">
                      Check back later for updates.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Powered by SERVE OS</span>
            <span>
              Questions? Contact your account manager.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function PortalError({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="pt-6 text-center">
          <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <p className="text-sm text-slate-500">
            If you believe this is an error, please contact your account manager
            to request a new access link.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface ArtifactCardProps {
  artifact: VisibleArtifact
  onView: () => void
}

function ArtifactCard({ artifact, onView }: ArtifactCardProps) {
  const typeIcons: Record<string, React.ElementType> = {
    document: FileText,
    report: FileText,
    presentation: FileText,
    spreadsheet: FileText,
  }

  const Icon = typeIcons[artifact.type] || FileText

  return (
    <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900">{artifact.name}</h4>
            {artifact.description && (
              <p className="text-sm text-slate-500 mt-1">
                {artifact.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {formatRelativeTime(artifact.updatedAt)}
              </span>
              <ArtifactStatusBadge status={artifact.status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {artifact.downloadUrl && (
            <a
              href={artifact.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onView}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </a>
          )}
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </div>
    </div>
  )
}

function EngagementStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: 'success' | 'info' | 'warning' | 'default'; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    in_progress: { variant: 'info', label: 'In Progress' },
    pending: { variant: 'warning', label: 'Pending' },
    completed: { variant: 'success', label: 'Completed' },
    on_hold: { variant: 'default', label: 'On Hold' },
  }

  const config = statusConfig[status] || { variant: 'default' as const, label: status }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

function ArtifactStatusBadge({ status }: { status: string }) {
  if (status === 'approved' || status === 'final') {
    return (
      <span className="flex items-center gap-1 text-green-600">
        <CheckCircle className="h-3 w-3" />
        {status === 'approved' ? 'Approved' : 'Final'}
      </span>
    )
  }
  return null
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

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return formatDate(dateString)
}
