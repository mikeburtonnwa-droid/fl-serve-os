/**
 * ROI Results Component (F6.1)
 *
 * Displays calculated ROI metrics in a clear format.
 *
 * User Stories: US-024
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import type { ROIResults } from '@/lib/roi'
import { formatCurrency, formatPercent, formatPayback } from '@/lib/roi'

interface ROIResultsDisplayProps {
  results: ROIResults
}

export function ROIResultsDisplay({ results }: ROIResultsDisplayProps) {
  const {
    monthlySavings,
    annualSavings,
    totalSavings,
    totalCosts,
    netBenefit,
    roi,
    paybackMonths,
  } = results

  const isPositiveROI = roi > 0
  const isProfitable = netBenefit > 0

  return (
    <div className="space-y-4">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={TrendingUp}
          label="ROI"
          value={formatPercent(roi)}
          trend={isPositiveROI ? 'up' : 'down'}
          color={isPositiveROI ? 'emerald' : 'red'}
        />
        <MetricCard
          icon={Clock}
          label="Payback Period"
          value={formatPayback(paybackMonths)}
          trend={paybackMonths > 0 && paybackMonths <= 12 ? 'up' : 'neutral'}
          color={paybackMonths > 0 && paybackMonths <= 12 ? 'emerald' : 'amber'}
        />
        <MetricCard
          icon={DollarSign}
          label="Net Benefit"
          value={formatCurrency(netBenefit)}
          trend={isProfitable ? 'up' : 'down'}
          color={isProfitable ? 'emerald' : 'red'}
        />
        <MetricCard
          icon={Target}
          label="Total Savings"
          value={formatCurrency(totalSavings)}
          trend="up"
          color="blue"
        />
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <DetailItem
              label="Monthly Savings"
              value={formatCurrency(monthlySavings)}
              subtext="At full automation"
            />
            <DetailItem
              label="Annual Savings"
              value={formatCurrency(annualSavings)}
              subtext="Projected yearly"
            />
            <DetailItem
              label="Total Investment"
              value={formatCurrency(totalCosts)}
              subtext="Implementation + maintenance"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Metric Card Component
// =============================================================================

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  color: 'emerald' | 'red' | 'amber' | 'blue'
}

function MetricCard({ icon: Icon, label, value, trend, color }: MetricCardProps) {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      text: 'text-emerald-700',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-700',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      text: 'text-amber-700',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-700',
    },
  }

  const styles = colorStyles[color]

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${styles.bg}`}>
            <Icon className={`h-5 w-5 ${styles.icon}`} />
          </div>
          {trend !== 'neutral' && (
            <div
              className={`flex items-center ${
                trend === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className={`text-2xl font-bold ${styles.text}`}>{value}</p>
          <p className="text-sm text-slate-500 mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Detail Item Component
// =============================================================================

interface DetailItemProps {
  label: string
  value: string
  subtext?: string
}

function DetailItem({ label, value, subtext }: DetailItemProps) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
    </div>
  )
}

// =============================================================================
// Compact Results (for comparison view)
// =============================================================================

interface CompactResultsProps {
  results: ROIResults
  highlight?: 'roi' | 'payback' | 'savings' | 'benefit'
}

export function CompactResults({ results, highlight }: CompactResultsProps) {
  const metrics = [
    {
      key: 'roi',
      label: 'ROI',
      value: formatPercent(results.roi),
      isPositive: results.roi > 0,
    },
    {
      key: 'payback',
      label: 'Payback',
      value: formatPayback(results.paybackMonths),
      isPositive: results.paybackMonths > 0 && results.paybackMonths <= 24,
    },
    {
      key: 'savings',
      label: 'Total Savings',
      value: formatCurrency(results.totalSavings),
      isPositive: true,
    },
    {
      key: 'benefit',
      label: 'Net Benefit',
      value: formatCurrency(results.netBenefit),
      isPositive: results.netBenefit > 0,
    },
  ]

  return (
    <div className="space-y-2">
      {metrics.map((metric) => (
        <div
          key={metric.key}
          className={`flex justify-between items-center p-2 rounded ${
            highlight === metric.key
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-slate-50'
          }`}
        >
          <span className="text-sm text-slate-600">{metric.label}</span>
          <span
            className={`text-sm font-semibold ${
              metric.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  )
}
