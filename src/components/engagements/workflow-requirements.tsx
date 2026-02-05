'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import {
  STATION_REQUIREMENTS,
  TEMPLATE_METADATA,
  validateStationPrerequisites,
  getCurrentStage,
  type StationId,
  type TemplateId,
  type Pathway,
} from '@/lib/workflow'

interface Artifact {
  id: string
  template_id: string
  name: string
  status: string
}

interface StationRun {
  station_id: string
  status: string
}

interface WorkflowRequirementsProps {
  pathway: Pathway
  engagementId: string
  artifacts: Artifact[]
  stationRuns: StationRun[]
  onStationSelect?: (stationId: StationId) => void
}

export function WorkflowRequirements({
  pathway,
  engagementId,
  artifacts,
  stationRuns,
  onStationSelect,
}: WorkflowRequirementsProps) {
  // Get current workflow stage
  const stageInfo = useMemo(() => {
    const existingArtifacts = artifacts.map((a) => ({
      template_id: a.template_id,
      status: a.status,
    }))
    return getCurrentStage(pathway, existingArtifacts)
  }, [pathway, artifacts])

  // Validate each station
  const stationValidations = useMemo(() => {
    const existingArtifacts = artifacts.map((a) => ({
      template_id: a.template_id,
      status: a.status,
    }))
    const completedStations = stationRuns.map((r) => ({
      station_id: r.station_id,
      status: r.status,
    }))

    return (['S-01', 'S-02', 'S-03'] as StationId[]).map((stationId) => ({
      stationId,
      requirements: STATION_REQUIREMENTS[stationId],
      validation: validateStationPrerequisites(stationId, existingArtifacts, completedStations),
    }))
  }, [artifacts, stationRuns])

  // Get artifact by template ID
  const getArtifact = (templateId: TemplateId): Artifact | undefined => {
    return artifacts.find((a) => a.template_id === templateId)
  }

  // Check if a template is fulfilled
  const isTemplateFulfilled = (templateId: TemplateId): boolean => {
    const artifact = getArtifact(templateId)
    return !!artifact && ['draft', 'approved', 'pending_review'].includes(artifact.status)
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-600" />
          <CardTitle>Workflow Requirements</CardTitle>
        </div>
        <CardDescription>
          Current stage: <span className="font-medium text-slate-700">{stageInfo.stageName}</span>
          {' • '}
          {stageInfo.completedArtifacts.length} of {Object.keys(TEMPLATE_METADATA).length} templates completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {stationValidations.map(({ stationId, requirements, validation }) => {
          const isStationComplete = stationRuns.some(
            (r) => r.station_id === stationId && ['complete', 'approved'].includes(r.status)
          )

          return (
            <div
              key={stationId}
              className={`rounded-lg border p-4 ${
                validation.canRun
                  ? 'border-green-200 bg-green-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              {/* Station Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isStationComplete
                        ? 'bg-green-100'
                        : validation.canRun
                        ? 'bg-teal-100'
                        : 'bg-slate-200'
                    }`}
                  >
                    {validation.canRun ? (
                      <Unlock className={`h-4 w-4 ${isStationComplete ? 'text-green-600' : 'text-teal-600'}`} />
                    ) : (
                      <Lock className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-teal-600">{stationId}</span>
                      <span className="font-medium text-slate-900">{requirements.name}</span>
                      {isStationComplete && (
                        <Badge variant="success" size="sm">
                          Complete
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{requirements.description}</p>
                  </div>
                </div>
                {validation.canRun && !isStationComplete && onStationSelect && (
                  <Button
                    size="sm"
                    onClick={() => onStationSelect(stationId)}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Run Station
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Required Artifacts */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Required Artifacts
                </p>
                <div className="flex flex-wrap gap-2">
                  {requirements.requiredArtifacts.map((templateId) => {
                    const fulfilled = isTemplateFulfilled(templateId)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const _artifact = getArtifact(templateId) // Reserved for future link functionality
                    const meta = TEMPLATE_METADATA[templateId]

                    return (
                      <div
                        key={templateId}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                          fulfilled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-white border border-dashed border-slate-300 text-slate-500'
                        }`}
                      >
                        {fulfilled ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        <span>{meta.name}</span>
                        <span className="text-xs opacity-60">({templateId})</span>
                        {!fulfilled && (
                          <Link
                            href={`/dashboard/artifacts/new?engagement=${engagementId}&template=${templateId}`}
                          >
                            <Button variant="ghost" size="sm" className="h-5 px-1.5 ml-1">
                              Create
                            </Button>
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Optional Artifacts */}
              {requirements.optionalArtifacts.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Optional (enhances output)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {requirements.optionalArtifacts.map((templateId) => {
                      const fulfilled = isTemplateFulfilled(templateId)
                      const meta = TEMPLATE_METADATA[templateId]

                      return (
                        <div
                          key={templateId}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                            fulfilled
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-white border border-dashed border-slate-200 text-slate-400'
                          }`}
                        >
                          {fulfilled ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                          <span>{meta.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Output Artifacts */}
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Generates
                </p>
                <div className="flex flex-wrap gap-2">
                  {requirements.outputArtifacts.map((templateId) => {
                    const meta = TEMPLATE_METADATA[templateId]
                    const existing = getArtifact(templateId)

                    return (
                      <div
                        key={templateId}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                          existing
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>{meta.name}</span>
                        {existing && (
                          <Badge variant="default" size="sm">
                            Exists
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Previous Station Requirement */}
              {requirements.previousStation && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  {(() => {
                    const prevComplete = stationRuns.some(
                      (r) =>
                        r.station_id === requirements.previousStation &&
                        r.status === 'approved'
                    )
                    return (
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          prevComplete ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {prevComplete ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <span>
                          Requires {requirements.previousStation} to be{' '}
                          {prevComplete ? 'approved ✓' : 'approved first'}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  {validation.warnings.map((warning, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
