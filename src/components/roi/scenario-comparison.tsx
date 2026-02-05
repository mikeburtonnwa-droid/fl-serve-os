/**
 * Scenario Comparison Component (F6.4)
 *
 * Side-by-side comparison of multiple ROI scenarios.
 *
 * User Stories: US-027
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Clock,
  TrendingUp,
  DollarSign,
  Star,
  Check,
} from 'lucide-react'
import type { ROIScenario } from '@/lib/roi'
import { formatCurrency, formatPercent, formatPayback } from '@/lib/roi'

interface ScenarioComparisonProps {
  scenarios: ROIScenario[]
  onSetRecommended: (scenarioId: string) => void
}

export function ScenarioComparison({
  scenarios,
  onSetRecommended,
}: ScenarioComparisonProps) {
  // Calculate best/worst for each metric
  const analysis = useMemo(() => {
    if (scenarios.length < 2) return null

    const metrics = {
      roi: {
        label: 'ROI',
        values: scenarios.map((s) => ({ id: s.id, value: s.results.roi })),
        format: formatPercent,
        higherIsBetter: true,
      },
      payback: {
        label: 'Payback Period',
        values: scenarios.map((s) => ({
          id: s.id,
          value: s.results.paybackMonths,
        })),
        format: formatPayback,
        higherIsBetter: false, // Lower payback is better
      },
      totalSavings: {
        label: 'Total Savings',
        values: scenarios.map((s) => ({
          id: s.id,
          value: s.results.totalSavings,
        })),
        format: formatCurrency,
        higherIsBetter: true,
      },
      netBenefit: {
        label: 'Net Benefit',
        values: scenarios.map((s) => ({
          id: s.id,
          value: s.results.netBenefit,
        })),
        format: formatCurrency,
        higherIsBetter: true,
      },
      monthlySavings: {
        label: 'Monthly Savings',
        values: scenarios.map((s) => ({
          id: s.id,
          value: s.results.monthlySavings,
        })),
        format: formatCurrency,
        higherIsBetter: true,
      },
    }

    // Find best/worst for each metric
    const analyzed = Object.entries(metrics).map(([key, metric]) => {
      const sorted = [...metric.values].sort((a, b) =>
        metric.higherIsBetter ? b.value - a.value : a.value - b.value
      )
      return {
        key,
        ...metric,
        best: sorted[0].id,
        worst: sorted[sorted.length - 1].id,
      }
    })

    return analyzed
  }, [scenarios])

  if (scenarios.length < 2) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-slate-500">
            Save at least 2 scenarios to compare them
          </p>
        </CardContent>
      </Card>
    )
  }

  const recommendedScenario = scenarios.find((s) => s.isRecommended)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Scenario Comparison
          </h3>
          <p className="text-sm text-slate-500">
            Comparing {scenarios.length} scenarios
          </p>
        </div>
        {recommendedScenario && (
          <Badge variant="success" className="gap-1">
            <Star className="h-3 w-3 fill-current" />
            Recommended: {recommendedScenario.name}
          </Badge>
        )}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-slate-500 pb-4 pr-4">
                  Metric
                </th>
                {scenarios.map((scenario) => (
                  <th
                    key={scenario.id}
                    className="text-center text-sm font-medium text-slate-900 pb-4 px-4 min-w-[140px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{scenario.name}</span>
                      {scenario.isRecommended && (
                        <Badge variant="success" size="sm">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysis?.map((metric) => (
                <tr key={metric.key} className="border-t border-slate-100">
                  <td className="py-4 pr-4">
                    <span className="text-sm font-medium text-slate-700">
                      {metric.label}
                    </span>
                  </td>
                  {scenarios.map((scenario) => {
                    const value = metric.values.find(
                      (v) => v.id === scenario.id
                    )?.value
                    const isBest = metric.best === scenario.id
                    const isWorst = metric.worst === scenario.id

                    return (
                      <td key={scenario.id} className="py-4 px-4 text-center">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                            isBest
                              ? 'bg-emerald-50 text-emerald-700'
                              : isWorst
                              ? 'bg-red-50 text-red-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {isBest && <Trophy className="h-3 w-3" />}
                          <span className="text-sm font-medium">
                            {metric.format(value ?? 0)}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Input comparison */}
              <tr className="border-t-2 border-slate-200">
                <td className="pt-6 pb-2 pr-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Key Inputs
                  </span>
                </td>
                {scenarios.map((scenario) => (
                  <td key={scenario.id} className="pt-6 pb-2 px-4" />
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <span className="text-sm text-slate-600">Automation Level</span>
                </td>
                {scenarios.map((scenario) => (
                  <td
                    key={scenario.id}
                    className="py-2 px-4 text-center text-sm text-slate-600"
                  >
                    {scenario.inputs.automationLevel}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <span className="text-sm text-slate-600">
                    Implementation Cost
                  </span>
                </td>
                {scenarios.map((scenario) => (
                  <td
                    key={scenario.id}
                    className="py-2 px-4 text-center text-sm text-slate-600"
                  >
                    {formatCurrency(scenario.inputs.implementationCost)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <span className="text-sm text-slate-600">Hours/Week</span>
                </td>
                {scenarios.map((scenario) => (
                  <td
                    key={scenario.id}
                    className="py-2 px-4 text-center text-sm text-slate-600"
                  >
                    {scenario.inputs.hoursPerWeek} hrs
                  </td>
                ))}
              </tr>

              {/* Action row */}
              <tr className="border-t border-slate-200">
                <td className="pt-4 pr-4">
                  <span className="text-sm text-slate-600">Set as Recommended</span>
                </td>
                {scenarios.map((scenario) => (
                  <td key={scenario.id} className="pt-4 px-4 text-center">
                    <Button
                      variant={scenario.isRecommended ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => onSetRecommended(scenario.id)}
                      className={
                        scenario.isRecommended
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : ''
                      }
                    >
                      {scenario.isRecommended ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Selected
                        </>
                      ) : (
                        'Select'
                      )}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparison Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryItem
              icon={TrendingUp}
              label="Best ROI"
              scenarioName={
                scenarios.find((s) => s.id === analysis?.[0].best)?.name || ''
              }
              value={formatPercent(
                scenarios.find((s) => s.id === analysis?.[0].best)?.results
                  .roi || 0
              )}
              color="emerald"
            />
            <SummaryItem
              icon={Clock}
              label="Fastest Payback"
              scenarioName={
                scenarios.find((s) => s.id === analysis?.[1].best)?.name || ''
              }
              value={formatPayback(
                scenarios.find((s) => s.id === analysis?.[1].best)?.results
                  .paybackMonths || 0
              )}
              color="blue"
            />
            <SummaryItem
              icon={DollarSign}
              label="Highest Savings"
              scenarioName={
                scenarios.find((s) => s.id === analysis?.[2].best)?.name || ''
              }
              value={formatCurrency(
                scenarios.find((s) => s.id === analysis?.[2].best)?.results
                  .totalSavings || 0
              )}
              color="purple"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Summary Item Component
// =============================================================================

interface SummaryItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  scenarioName: string
  value: string
  color: 'emerald' | 'blue' | 'purple'
}

function SummaryItem({
  icon: Icon,
  label,
  scenarioName,
  value,
  color,
}: SummaryItemProps) {
  const colorStyles = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
      <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-semibold text-slate-900">{scenarioName}</p>
        <p className="text-sm text-slate-600">{value}</p>
      </div>
    </div>
  )
}
