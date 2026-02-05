/**
 * Sensitivity Analysis Component (F6.5)
 *
 * Shows how changes in key variables affect ROI outcomes.
 *
 * User Stories: US-027 (related)
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp, Minus } from 'lucide-react'
import type { ROIInputs } from '@/lib/roi'
import {
  performSensitivityAnalysis,
  formatCurrency,
  formatPercent,
} from '@/lib/roi'

interface SensitivityAnalysisProps {
  inputs: ROIInputs
}

export function SensitivityAnalysis({ inputs }: SensitivityAnalysisProps) {
  const analysis = useMemo(
    () => performSensitivityAnalysis(inputs),
    [inputs]
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Sensitivity Analysis
        </h3>
        <p className="text-sm text-slate-500">
          See how changes in key variables affect your ROI
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.results.map((result) => {
          const variable = analysis.variables.find(
            (v) => v.name === result.variable
          )
          if (!variable) return null

          const baseIndex = 2 // Middle of the 5-point range
          const baseROI = result.roiValues[baseIndex]
          const lowROI = result.roiValues[0]
          const highROI = result.roiValues[4]

          const sensitivity = Math.abs(highROI - lowROI)
          const isHighlySensitive = sensitivity > 50

          return (
            <Card
              key={result.variable}
              className={isHighlySensitive ? 'border-amber-200' : ''}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{variable.label}</CardTitle>
                  {isHighlySensitive && (
                    <Badge variant="warning" size="sm" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      High Impact
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Visual range */}
                <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-red-400 via-slate-300 to-emerald-400"
                    style={{ left: '10%', right: '10%' }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow"
                    style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
                  />
                </div>

                {/* Range values */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-500">-20%</p>
                    <p className="text-sm font-medium text-red-600">
                      {formatPercent(lowROI)} ROI
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatValue(result.values[0], variable.unit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Base</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatPercent(baseROI)} ROI
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatValue(result.values[2], variable.unit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">+20%</p>
                    <p className="text-sm font-medium text-emerald-600">
                      {formatPercent(highROI)} ROI
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatValue(result.values[4], variable.unit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Sensitivity Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">
                    Variable
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2">
                    -20%
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2">
                    -10%
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2 bg-slate-50">
                    Base
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2">
                    +10%
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 pb-3 px-2">
                    +20%
                  </th>
                  <th className="text-center text-xs font-medium text-slate-500 pb-3 pl-4">
                    Impact
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysis.results.map((result) => {
                  const variable = analysis.variables.find(
                    (v) => v.name === result.variable
                  )
                  if (!variable) return null

                  const baseROI = result.roiValues[2]
                  const impact = result.roiValues[4] - result.roiValues[0]

                  return (
                    <tr key={result.variable} className="border-b border-slate-100">
                      <td className="py-3 pr-4">
                        <span className="text-sm font-medium text-slate-700">
                          {variable.label}
                        </span>
                      </td>
                      {result.roiValues.map((roi, i) => (
                        <td
                          key={i}
                          className={`py-3 px-2 text-center ${
                            i === 2 ? 'bg-slate-50' : ''
                          }`}
                        >
                          <ROICell value={roi} baseValue={baseROI} isBase={i === 2} />
                        </td>
                      ))}
                      <td className="py-3 pl-4 text-center">
                        <ImpactIndicator impact={impact} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {generateInsights(analysis.results, analysis.variables).map(
              (insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-blue-500 mt-1">•</span>
                  {insight}
                </li>
              )
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Helper Components
// =============================================================================

function ROICell({
  value,
  baseValue,
  isBase,
}: {
  value: number
  baseValue: number
  isBase: boolean
}) {
  const diff = value - baseValue

  if (isBase) {
    return (
      <span className="text-sm font-semibold text-slate-900">
        {formatPercent(value)}
      </span>
    )
  }

  const color =
    diff > 5 ? 'text-emerald-600' : diff < -5 ? 'text-red-600' : 'text-slate-600'

  return <span className={`text-sm ${color}`}>{formatPercent(value)}</span>
}

function ImpactIndicator({ impact }: { impact: number }) {
  const absImpact = Math.abs(impact)

  if (absImpact > 50) {
    return (
      <div className="flex items-center justify-center gap-1 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs font-medium">High</span>
      </div>
    )
  }

  if (absImpact > 20) {
    return (
      <div className="flex items-center justify-center gap-1 text-amber-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-xs font-medium">Medium</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-1 text-slate-400">
      <Minus className="h-4 w-4" />
      <span className="text-xs font-medium">Low</span>
    </div>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatValue(value: number, unit: string): string {
  switch (unit) {
    case 'dollars':
      return formatCurrency(value)
    case 'percent':
      return `${value}%`
    case 'hours':
      return `${value} hrs`
    case 'months':
      return `${value} mo`
    default:
      return value.toLocaleString()
  }
}

function generateInsights(
  results: { variable: string; roiValues: number[] }[],
  variables: { name: string; label: string }[]
): string[] {
  const insights: string[] = []

  // Find most sensitive variable
  const sensitivities = results.map((r) => ({
    variable: r.variable,
    sensitivity: Math.abs(r.roiValues[4] - r.roiValues[0]),
  }))
  const mostSensitive = sensitivities.sort(
    (a, b) => b.sensitivity - a.sensitivity
  )[0]
  const mostSensitiveVar = variables.find(
    (v) => v.name === mostSensitive.variable
  )

  if (mostSensitiveVar) {
    insights.push(
      `${mostSensitiveVar.label} has the highest impact on ROI - a ±20% change affects ROI by ${formatPercent(mostSensitive.sensitivity)}`
    )
  }

  // Find least sensitive variable
  const leastSensitive = sensitivities[sensitivities.length - 1]
  const leastSensitiveVar = variables.find(
    (v) => v.name === leastSensitive.variable
  )

  if (leastSensitiveVar && leastSensitive.sensitivity < 20) {
    insights.push(
      `${leastSensitiveVar.label} has minimal impact on ROI - estimates here can be less precise`
    )
  }

  // Check for negative scenarios
  const hasNegativeROI = results.some((r) => r.roiValues.some((v) => v < 0))
  if (hasNegativeROI) {
    insights.push(
      `Some scenarios result in negative ROI - review assumptions carefully before proceeding`
    )
  } else {
    insights.push(
      `All tested scenarios maintain positive ROI, indicating a robust business case`
    )
  }

  return insights
}
