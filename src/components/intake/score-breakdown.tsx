/**
 * Score Breakdown Component
 *
 * Displays assessment scores by category with visual indicators.
 *
 * User Stories: US-028, US-029
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Target,
} from 'lucide-react'
import type { AssessmentScores, CategoryScore, RiskLevel } from '@/lib/intake'
import { formatScore, getScoreColor, getPathwayVariant } from '@/lib/intake'

interface ScoreBreakdownProps {
  scores: AssessmentScores
  showDetails?: boolean
}

export function ScoreBreakdown({ scores, showDetails = true }: ScoreBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Overall Readiness Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${getScoreColor(scores.overallScore)}`}>
                  {scores.overallScore}
                </span>
                <span className="text-xl text-slate-400">/100</span>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={getPathwayVariant(scores.pathwayRecommendation.pathway)}>
                {scores.pathwayRecommendation.pathway.charAt(0).toUpperCase() +
                  scores.pathwayRecommendation.pathway.slice(1)}{' '}
                Pathway
              </Badge>
              <p className="text-sm text-slate-500 mt-2">
                {scores.pathwayRecommendation.estimatedDuration.label}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  scores.overallScore >= 75
                    ? 'bg-emerald-500'
                    : scores.overallScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${scores.overallScore}%` }}
              />
            </div>
          </div>

          {/* Completion status */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-slate-500">
              {scores.answeredQuestions} of {scores.totalQuestions} questions answered
            </span>
            <span className="font-medium">
              {scores.completionPercentage}% complete
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scores.categoryScores.map((category) => (
                <CategoryScoreItem key={category.category} category={category} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">Risk Level</span>
            <RiskBadge level={scores.riskProfile.level} />
          </div>

          {scores.riskProfile.factors.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Risk Factors:</p>
              <ul className="space-y-1">
                {scores.riskProfile.factors.map((factor, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-600 flex items-start gap-2"
                  >
                    <span className="text-red-500 mt-1">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              No significant risk factors identified
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5" />
            Pathway Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">
                {scores.pathwayRecommendation.rationale}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Confidence Level</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${scores.pathwayRecommendation.confidence}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {scores.pathwayRecommendation.confidence}%
                </span>
              </div>
            </div>

            {scores.pathwayRecommendation.focusAreas.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Recommended Focus Areas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {scores.pathwayRecommendation.focusAreas.map((area) => (
                    <Badge key={area} variant="warning" size="sm">
                      {area.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Helper Components
// =============================================================================

function CategoryScoreItem({ category }: { category: CategoryScore }) {
  const getTrendIcon = () => {
    if (category.score >= 70) return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (category.score >= 50) return <Minus className="h-4 w-4 text-slate-400" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const displayName = category.category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className="text-sm font-medium text-slate-700">{displayName}</span>
          <span className="text-xs text-slate-400">
            (weight: {category.weight.toFixed(1)}x)
          </span>
        </div>
        <span className={`text-sm font-semibold ${getScoreColor(category.score)}`}>
          {formatScore(category.score)}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            category.score >= 70
              ? 'bg-emerald-500'
              : category.score >= 50
              ? 'bg-amber-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${category.score}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">
        {category.answeredCount} of {category.totalQuestions} questions answered
      </p>
    </div>
  )
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = {
    low: { label: 'Low Risk', variant: 'success' as const, icon: CheckCircle },
    medium: { label: 'Medium Risk', variant: 'warning' as const, icon: AlertTriangle },
    high: { label: 'High Risk', variant: 'danger' as const, icon: AlertTriangle },
    critical: { label: 'Critical Risk', variant: 'danger' as const, icon: AlertTriangle },
  }

  const { label, variant, icon: Icon } = config[level]

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}
