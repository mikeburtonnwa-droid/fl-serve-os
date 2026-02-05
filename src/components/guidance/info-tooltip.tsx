'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { HelpCircle, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ARTIFACT_GUIDANCE,
  STATION_GUIDANCE,
  PATHWAY_GUIDANCE,
  SERVE_FRAMEWORK,
  INTAKE_ASSESSMENT,
} from '@/lib/guidance-content'
import type { TemplateId, StationId, Pathway } from '@/lib/workflow'

// =============================================================================
// GENERIC INFO TOOLTIP
// =============================================================================

interface InfoTooltipProps {
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  width?: 'sm' | 'md' | 'lg' | 'xl'
  children?: ReactNode
  iconSize?: 'sm' | 'md'
}

export function InfoTooltip({
  content,
  position = 'right',
  width = 'md',
  children,
  iconSize = 'sm',
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const widthClasses = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-[28rem]',
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-flex" ref={tooltipRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center text-slate-400 hover:text-teal-600 transition-colors"
      >
        {children || (
          <HelpCircle className={iconSize === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 ${positionClasses[position]} ${widthClasses[width]} bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden`}
        >
          <div className="p-4">
            {content}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ARTIFACT INFO TOOLTIP
// =============================================================================

interface ArtifactInfoTooltipProps {
  templateId: TemplateId
  position?: 'top' | 'bottom' | 'left' | 'right'
  showLearnMore?: boolean
  onLearnMore?: () => void
}

export function ArtifactInfoTooltip({
  templateId,
  position = 'right',
  showLearnMore = false,
  onLearnMore,
}: ArtifactInfoTooltipProps) {
  const guidance = ARTIFACT_GUIDANCE[templateId]

  if (!guidance) return null

  return (
    <InfoTooltip
      position={position}
      width="lg"
      content={
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-teal-600">{templateId}</span>
                <Badge
                  variant={guidance.tier === 'T2' ? 'warning' : 'default'}
                  size="sm"
                >
                  {guidance.tier}
                </Badge>
              </div>
              <h4 className="font-semibold text-slate-900">{guidance.name}</h4>
            </div>
          </div>

          <p className="text-sm text-slate-600">{guidance.purpose}</p>

          <div className="bg-slate-50 rounded-lg p-3">
            <h5 className="text-xs font-medium text-slate-500 uppercase mb-2">
              Key Components
            </h5>
            <ul className="text-xs text-slate-600 space-y-1">
              {guidance.keyComponents.slice(0, 4).map((component, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-teal-500">•</span>
                  {component}
                </li>
              ))}
              {guidance.keyComponents.length > 4 && (
                <li className="text-slate-400 italic">
                  +{guidance.keyComponents.length - 4} more...
                </li>
              )}
            </ul>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              ⏱️ Est. time: {guidance.estimatedTime}
            </span>
            <span className="text-slate-500">
              Stage: {guidance.stage}
            </span>
          </div>

          {showLearnMore && (
            <Button
              size="sm"
              variant="outline"
              onClick={onLearnMore}
              className="w-full mt-2"
            >
              Learn More
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      }
    />
  )
}

// =============================================================================
// STATION INFO TOOLTIP
// =============================================================================

interface StationInfoTooltipProps {
  stationId: StationId
  position?: 'top' | 'bottom' | 'left' | 'right'
  showLearnMore?: boolean
  onLearnMore?: () => void
}

export function StationInfoTooltip({
  stationId,
  position = 'right',
  showLearnMore = false,
  onLearnMore,
}: StationInfoTooltipProps) {
  const guidance = STATION_GUIDANCE[stationId]

  if (!guidance) return null

  return (
    <InfoTooltip
      position={position}
      width="lg"
      content={
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-teal-600">{stationId}</span>
            </div>
            <h4 className="font-semibold text-slate-900">{guidance.name}</h4>
          </div>

          <p className="text-sm text-slate-600">{guidance.purpose}</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-lg p-2">
              <h5 className="text-xs font-medium text-blue-700 mb-1">Inputs</h5>
              <ul className="text-xs text-blue-600 space-y-0.5">
                {guidance.inputRequirements.slice(0, 2).map((input, i) => (
                  <li key={i}>• {input}</li>
                ))}
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <h5 className="text-xs font-medium text-green-700 mb-1">Outputs</h5>
              <ul className="text-xs text-green-600 space-y-0.5">
                {guidance.outputExpectations.slice(0, 2).map((output, i) => (
                  <li key={i}>• {output}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
            <h5 className="text-xs font-medium text-amber-700 mb-1">💡 Best Practice</h5>
            <p className="text-xs text-amber-600">{guidance.bestPractices[0]}</p>
          </div>

          {showLearnMore && (
            <Button
              size="sm"
              variant="outline"
              onClick={onLearnMore}
              className="w-full mt-2"
            >
              View Full Guide
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      }
    />
  )
}

// =============================================================================
// PATHWAY INFO TOOLTIP
// =============================================================================

interface PathwayInfoTooltipProps {
  pathway: Pathway
  position?: 'top' | 'bottom' | 'left' | 'right'
  showLearnMore?: boolean
  onLearnMore?: () => void
}

export function PathwayInfoTooltip({
  pathway,
  position = 'right',
  showLearnMore = false,
  onLearnMore,
}: PathwayInfoTooltipProps) {
  const guidance = PATHWAY_GUIDANCE[pathway]

  if (!guidance) return null

  return (
    <InfoTooltip
      position={position}
      width="lg"
      content={
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" size="sm">
                Score: {guidance.scoreRange}
              </Badge>
              <Badge variant="default" size="sm">
                {guidance.duration}
              </Badge>
            </div>
            <h4 className="font-semibold text-slate-900">{guidance.name}</h4>
          </div>

          <p className="text-sm text-slate-600">{guidance.targetClient}</p>

          <div className="bg-teal-50 rounded-lg p-3">
            <h5 className="text-xs font-medium text-teal-700 mb-2">
              Jobs to Be Done
            </h5>
            <ul className="text-xs text-teal-600 space-y-1">
              {guidance.jobsToBeDone.slice(0, 3).map((job, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span>✓</span>
                  {job}
                </li>
              ))}
            </ul>
          </div>

          {showLearnMore && (
            <Button
              size="sm"
              variant="outline"
              onClick={onLearnMore}
              className="w-full mt-2"
            >
              Pathway Deep Dive
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      }
    />
  )
}

// =============================================================================
// SERVE PHASE INFO TOOLTIP
// =============================================================================

interface PhaseInfoTooltipProps {
  phaseLetter: 'S' | 'E' | 'R' | 'V' | 'E2'
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function PhaseInfoTooltip({
  phaseLetter,
  position = 'bottom',
}: PhaseInfoTooltipProps) {
  const phaseMap: Record<string, number> = {
    S: 0,
    E: 1,
    R: 2,
    V: 3,
    E2: 4,
  }
  const phase = SERVE_FRAMEWORK.phases[phaseMap[phaseLetter]]

  if (!phase) return null

  return (
    <InfoTooltip
      position={position}
      width="md"
      content={
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-100 text-teal-700 font-bold text-lg">
              {phase.letter}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">{phase.name}</h4>
              <p className="text-xs text-slate-500">{phase.description}</p>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-medium text-slate-500 uppercase mb-1.5">
              Key Activities
            </h5>
            <ul className="text-sm text-slate-600 space-y-1">
              {phase.keyActivities.map((activity, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-teal-500">•</span>
                  {activity}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-50 rounded-lg p-2">
            <h5 className="text-xs font-medium text-slate-500 mb-1">Outcome</h5>
            <p className="text-sm text-slate-700">{phase.outcome}</p>
          </div>
        </div>
      }
    />
  )
}

// =============================================================================
// INTAKE DIMENSION INFO TOOLTIP
// =============================================================================

interface IntakeDimensionTooltipProps {
  dimensionIndex: number
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function IntakeDimensionTooltip({
  dimensionIndex,
  position = 'right',
}: IntakeDimensionTooltipProps) {
  const dimension = INTAKE_ASSESSMENT.dimensions[dimensionIndex]

  if (!dimension) return null

  return (
    <InfoTooltip
      position={position}
      width="lg"
      content={
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900">{dimension.name}</h4>
          <p className="text-sm text-slate-600">{dimension.question}</p>

          <div className="space-y-2">
            <h5 className="text-xs font-medium text-slate-500 uppercase">
              Scoring Guide
            </h5>
            {Object.entries(dimension.scoring).map(([score, description]) => (
              <div
                key={score}
                className="flex items-start gap-2 text-sm"
              >
                <Badge variant="default" size="sm" className="flex-shrink-0">
                  {score}
                </Badge>
                <span className="text-slate-600">{description}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Guidance:</strong> {dimension.guidance}
            </p>
          </div>
        </div>
      }
    />
  )
}

// =============================================================================
// TIER INFO TOOLTIP
// =============================================================================

interface TierInfoTooltipProps {
  tier: 'T1' | 'T2'
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function TierInfoTooltip({
  tier,
  position = 'bottom',
}: TierInfoTooltipProps) {
  const tierInfo = {
    T1: {
      name: 'Tier 1 - Internal',
      description: 'Internal working documents that do not require client approval',
      examples: ['TPL-01 Client Discovery Brief', 'TPL-02 Current State Map'],
      color: 'bg-slate-100 text-slate-700',
    },
    T2: {
      name: 'Tier 2 - Client-Facing',
      description: 'Deliverables intended for client presentation that require QA approval',
      examples: ['TPL-03 Future State Design', 'TPL-05 Implementation Plan', 'TPL-09 ROI Calculator'],
      color: 'bg-amber-100 text-amber-700',
    },
  }

  const info = tierInfo[tier]

  return (
    <InfoTooltip
      position={position}
      width="md"
      content={
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={tier === 'T2' ? 'warning' : 'default'}>{tier}</Badge>
            <h4 className="font-semibold text-slate-900">{info.name}</h4>
          </div>

          <p className="text-sm text-slate-600">{info.description}</p>

          <div>
            <h5 className="text-xs font-medium text-slate-500 uppercase mb-1.5">
              Examples
            </h5>
            <ul className="text-sm text-slate-600 space-y-0.5">
              {info.examples.map((example, i) => (
                <li key={i}>• {example}</li>
              ))}
            </ul>
          </div>

          {tier === 'T2' && (
            <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
              <p className="text-xs text-amber-700">
                ⚠️ T2 artifacts require QA Station review and manager approval before client delivery
              </p>
            </div>
          )}
        </div>
      }
    />
  )
}
