/**
 * ROI Chart Component (F6.2)
 *
 * Real-time updating charts for ROI visualization.
 *
 * User Stories: US-024
 */

'use client'

import { useMemo } from 'react'
import type { ROIResults, MonthlyData } from '@/lib/roi'
import { formatCurrency } from '@/lib/roi'

interface ROIChartProps {
  results: ROIResults
  height?: number
}

export function ROIChart({ results, height = 300 }: ROIChartProps) {
  const { monthlyBreakdown, paybackMonths } = results

  // Calculate chart dimensions
  const chartData = useMemo(() => {
    const maxSavings = Math.max(
      ...monthlyBreakdown.map((m) => m.cumulativeSavings)
    )
    const maxCosts = Math.max(...monthlyBreakdown.map((m) => m.cumulativeCosts))
    const maxValue = Math.max(maxSavings, maxCosts) * 1.1 // Add 10% padding

    const minBenefit = Math.min(...monthlyBreakdown.map((m) => m.netBenefit))
    const maxBenefit = Math.max(...monthlyBreakdown.map((m) => m.netBenefit))

    return {
      maxValue,
      minBenefit,
      maxBenefit,
      dataPoints: monthlyBreakdown,
    }
  }, [monthlyBreakdown])

  // Chart dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 60 }
  const width = 600
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Scale functions
  const xScale = (month: number) =>
    padding.left + (month / monthlyBreakdown.length) * chartWidth

  const yScale = (value: number) =>
    padding.top + chartHeight - (value / chartData.maxValue) * chartHeight

  // Generate path for a line
  const generatePath = (
    data: MonthlyData[],
    getValue: (d: MonthlyData) => number
  ) => {
    return data
      .map((d, i) => {
        const x = xScale(d.month)
        const y = yScale(getValue(d))
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  // Generate area path (for fill)
  const generateAreaPath = (
    data: MonthlyData[],
    getValue: (d: MonthlyData) => number
  ) => {
    const linePath = generatePath(data, getValue)
    const lastX = xScale(data[data.length - 1].month)
    const firstX = xScale(data[0].month)
    const baseline = yScale(0)
    return `${linePath} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`
  }

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const tickCount = 5
    const ticks: number[] = []
    for (let i = 0; i <= tickCount; i++) {
      ticks.push((chartData.maxValue / tickCount) * i)
    }
    return ticks
  }, [chartData.maxValue])

  // X-axis ticks (every 6 months)
  const xTicks = useMemo(() => {
    const ticks: number[] = []
    for (let i = 0; i <= monthlyBreakdown.length; i += 6) {
      if (i > 0) ticks.push(i)
    }
    return ticks
  }, [monthlyBreakdown.length])

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        <g className="text-slate-200">
          {yTicks.map((tick) => (
            <line
              key={tick}
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke="currentColor"
              strokeDasharray="4 4"
            />
          ))}
        </g>

        {/* Payback line */}
        {paybackMonths > 0 && paybackMonths <= monthlyBreakdown.length && (
          <g>
            <line
              x1={xScale(paybackMonths)}
              y1={padding.top}
              x2={xScale(paybackMonths)}
              y2={height - padding.bottom}
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text
              x={xScale(paybackMonths)}
              y={padding.top - 5}
              textAnchor="middle"
              className="text-xs fill-emerald-600 font-medium"
            >
              Payback
            </text>
          </g>
        )}

        {/* Costs area */}
        <path
          d={generateAreaPath(chartData.dataPoints, (d) => d.cumulativeCosts)}
          fill="rgba(239, 68, 68, 0.1)"
        />

        {/* Savings area */}
        <path
          d={generateAreaPath(chartData.dataPoints, (d) => d.cumulativeSavings)}
          fill="rgba(59, 130, 246, 0.1)"
        />

        {/* Costs line */}
        <path
          d={generatePath(chartData.dataPoints, (d) => d.cumulativeCosts)}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
        />

        {/* Savings line */}
        <path
          d={generatePath(chartData.dataPoints, (d) => d.cumulativeSavings)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {/* Y-axis */}
        <g>
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#94a3b8"
            strokeWidth="1"
          />
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left - 5}
                y1={yScale(tick)}
                x2={padding.left}
                y2={yScale(tick)}
                stroke="#94a3b8"
              />
              <text
                x={padding.left - 10}
                y={yScale(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-slate-500"
              >
                {formatCurrency(tick)}
              </text>
            </g>
          ))}
        </g>

        {/* X-axis */}
        <g>
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#94a3b8"
            strokeWidth="1"
          />
          {xTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={xScale(tick)}
                y1={height - padding.bottom}
                x2={xScale(tick)}
                y2={height - padding.bottom + 5}
                stroke="#94a3b8"
              />
              <text
                x={xScale(tick)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-slate-500"
              >
                Month {tick}
              </text>
            </g>
          ))}
        </g>

        {/* Legend */}
        <g transform={`translate(${width - padding.right - 150}, ${padding.top})`}>
          <rect
            x="0"
            y="0"
            width="150"
            height="60"
            fill="white"
            stroke="#e2e8f0"
            rx="4"
          />
          <g transform="translate(10, 15)">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#3b82f6" strokeWidth="2" />
            <text x="30" y="4" className="text-xs fill-slate-600">
              Cumulative Savings
            </text>
          </g>
          <g transform="translate(10, 35)">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#ef4444" strokeWidth="2" />
            <text x="30" y="4" className="text-xs fill-slate-600">
              Cumulative Costs
            </text>
          </g>
        </g>
      </svg>
    </div>
  )
}

// =============================================================================
// Payback Timeline Chart
// =============================================================================

interface PaybackChartProps {
  results: ROIResults
  height?: number
}

export function PaybackChart({ results, height = 200 }: PaybackChartProps) {
  const { monthlyBreakdown, paybackMonths } = results

  const width = 600
  const padding = { top: 20, right: 20, bottom: 40, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate max/min for net benefit
  const maxBenefit = Math.max(...monthlyBreakdown.map((m) => m.netBenefit))
  const minBenefit = Math.min(...monthlyBreakdown.map((m) => m.netBenefit))
  const range = Math.max(Math.abs(maxBenefit), Math.abs(minBenefit)) * 1.1

  const xScale = (month: number) =>
    padding.left + (month / monthlyBreakdown.length) * chartWidth

  const yScale = (value: number) =>
    padding.top + chartHeight / 2 - (value / range) * (chartHeight / 2)

  const zeroY = yScale(0)

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Zero line */}
        <line
          x1={padding.left}
          y1={zeroY}
          x2={width - padding.right}
          y2={zeroY}
          stroke="#94a3b8"
          strokeWidth="1"
        />

        {/* Negative area (below zero) */}
        <path
          d={monthlyBreakdown
            .map((d, i) => {
              const x = xScale(d.month)
              const y = d.netBenefit < 0 ? yScale(d.netBenefit) : zeroY
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
            })
            .join(' ') + ` L ${xScale(monthlyBreakdown.length)} ${zeroY} L ${xScale(1)} ${zeroY} Z`}
          fill="rgba(239, 68, 68, 0.2)"
        />

        {/* Positive area (above zero) */}
        <path
          d={monthlyBreakdown
            .map((d, i) => {
              const x = xScale(d.month)
              const y = d.netBenefit > 0 ? yScale(d.netBenefit) : zeroY
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
            })
            .join(' ') + ` L ${xScale(monthlyBreakdown.length)} ${zeroY} L ${xScale(1)} ${zeroY} Z`}
          fill="rgba(16, 185, 129, 0.2)"
        />

        {/* Net benefit line */}
        <path
          d={monthlyBreakdown
            .map((d, i) => {
              const x = xScale(d.month)
              const y = yScale(d.netBenefit)
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
            })
            .join(' ')}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
        />

        {/* Payback marker */}
        {paybackMonths > 0 && paybackMonths <= monthlyBreakdown.length && (
          <g>
            <circle
              cx={xScale(paybackMonths)}
              cy={zeroY}
              r="6"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={xScale(paybackMonths)}
              y={zeroY - 15}
              textAnchor="middle"
              className="text-xs fill-emerald-600 font-semibold"
            >
              Break-even
            </text>
          </g>
        )}

        {/* Labels */}
        <text
          x={padding.left + 10}
          y={padding.top + 15}
          className="text-xs fill-emerald-600"
        >
          Profit
        </text>
        <text
          x={padding.left + 10}
          y={height - padding.bottom - 10}
          className="text-xs fill-red-500"
        >
          Loss
        </text>
      </svg>
    </div>
  )
}
