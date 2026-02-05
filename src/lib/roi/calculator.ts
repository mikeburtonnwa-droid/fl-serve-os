/**
 * ROI Calculator Engine (F6.1)
 *
 * Core calculation logic for ROI analysis.
 *
 * User Stories: US-024, US-025
 */

import type {
  ROIInputs,
  ROIResults,
  MonthlyData,
  SensitivityAnalysis,
  SensitivityResult,
  SensitivityVariable,
} from './types'
import { SLIDER_CONFIGS } from './types'

// =============================================================================
// Constants
// =============================================================================

const WEEKS_PER_MONTH = 4.33
const MONTHS_PER_YEAR = 12

// =============================================================================
// Core Calculation
// =============================================================================

/**
 * Calculate ROI metrics from input parameters
 */
export function calculateROI(inputs: ROIInputs): ROIResults {
  const {
    hoursPerWeek,
    hourlyRate,
    employeeCount,
    automationLevel,
    implementationCost,
    monthlyMaintenanceCost,
    rampUpMonths,
    projectionMonths,
  } = inputs

  // Calculate monthly labor cost (what they currently spend)
  const monthlyLaborCost =
    hoursPerWeek * WEEKS_PER_MONTH * hourlyRate * employeeCount

  // Calculate monthly savings at full automation
  const monthlySavings = monthlyLaborCost * (automationLevel / 100)

  // Net monthly savings after maintenance
  const netMonthlySavings = monthlySavings - monthlyMaintenanceCost

  // Annual metrics
  const annualSavings = monthlySavings * MONTHS_PER_YEAR
  const netAnnualSavings = netMonthlySavings * MONTHS_PER_YEAR

  // Generate monthly breakdown
  const monthlyBreakdown = generateMonthlyBreakdown(
    monthlySavings,
    monthlyMaintenanceCost,
    implementationCost,
    rampUpMonths,
    projectionMonths
  )

  // Calculate totals from breakdown
  const totalSavings = monthlyBreakdown.reduce((sum, m) => sum + m.savings, 0)
  const totalCosts =
    implementationCost + monthlyMaintenanceCost * projectionMonths
  const netBenefit = totalSavings - totalCosts

  // ROI percentage
  const roi = totalCosts > 0 ? ((totalSavings - totalCosts) / totalCosts) * 100 : 0

  // Calculate payback period
  const paybackMonths = calculatePaybackPeriod(monthlyBreakdown)

  return {
    monthlyLaborCost,
    monthlySavings,
    netMonthlySavings,
    annualSavings,
    netAnnualSavings,
    totalSavings,
    totalCosts,
    netBenefit,
    roi,
    paybackMonths,
    monthlyBreakdown,
  }
}

// =============================================================================
// Monthly Breakdown Generation
// =============================================================================

/**
 * Generate month-by-month breakdown with ramp-up
 */
function generateMonthlyBreakdown(
  fullMonthlySavings: number,
  monthlyMaintenanceCost: number,
  implementationCost: number,
  rampUpMonths: number,
  projectionMonths: number
): MonthlyData[] {
  const breakdown: MonthlyData[] = []
  let cumulativeSavings = 0
  let cumulativeCosts = implementationCost

  const startDate = new Date()

  for (let month = 1; month <= projectionMonths; month++) {
    // Calculate automation level during ramp-up
    const automationLevel =
      month <= rampUpMonths ? (month / rampUpMonths) * 100 : 100

    // Savings proportional to ramp-up
    const savings = fullMonthlySavings * (automationLevel / 100)

    // Costs for this month
    const costs = monthlyMaintenanceCost

    // Update cumulative
    cumulativeSavings += savings
    cumulativeCosts += costs

    // Calculate date
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + month)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    breakdown.push({
      month,
      date: dateStr,
      savings,
      cumulativeSavings,
      costs,
      cumulativeCosts,
      netBenefit: cumulativeSavings - cumulativeCosts,
      automationLevel,
    })
  }

  return breakdown
}

/**
 * Calculate the month when cumulative savings exceed total costs
 */
function calculatePaybackPeriod(
  breakdown: MonthlyData[]
): number {
  for (const data of breakdown) {
    if (data.cumulativeSavings >= data.cumulativeCosts) {
      return data.month
    }
  }
  // If never pays back within projection period
  return -1
}

// =============================================================================
// Sensitivity Analysis (F6.5)
// =============================================================================

/**
 * Perform sensitivity analysis on key variables
 */
export function performSensitivityAnalysis(
  baseInputs: ROIInputs,
  variablesToAnalyze?: (keyof ROIInputs)[]
): SensitivityAnalysis {
  const baseCase = calculateROI(baseInputs)

  // Default variables to analyze
  const defaultVariables: (keyof ROIInputs)[] = [
    'automationLevel',
    'hoursPerWeek',
    'hourlyRate',
    'implementationCost',
  ]

  const variableNames = variablesToAnalyze || defaultVariables

  // Build sensitivity variables from slider configs
  const variables: SensitivityVariable[] = variableNames
    .map((name) => {
      const config = SLIDER_CONFIGS.find((c) => c.name === name)
      if (!config) return null

      return {
        name,
        label: config.label,
        baseValue: baseInputs[name],
        minValue: config.min,
        maxValue: config.max,
        step: config.step,
        unit: config.unit,
      }
    })
    .filter((v): v is SensitivityVariable => v !== null)

  // Calculate results for each variable
  const results: SensitivityResult[] = variables.map((variable) => {
    const values: number[] = []
    const roiValues: number[] = []
    const paybackValues: number[] = []
    const savingsValues: number[] = []

    // Generate 5 points: -20%, -10%, base, +10%, +20%
    const percentages = [-0.2, -0.1, 0, 0.1, 0.2]

    for (const pct of percentages) {
      const value = variable.baseValue * (1 + pct)
      const clampedValue = Math.max(
        variable.minValue,
        Math.min(variable.maxValue, value)
      )

      // Calculate ROI with modified value
      const modifiedInputs = {
        ...baseInputs,
        [variable.name]: clampedValue,
      }
      const result = calculateROI(modifiedInputs)

      values.push(clampedValue)
      roiValues.push(result.roi)
      paybackValues.push(result.paybackMonths)
      savingsValues.push(result.totalSavings)
    }

    return {
      variable: variable.name,
      values,
      roiValues,
      paybackValues,
      savingsValues,
    }
  })

  return {
    baseCase,
    variables,
    results,
  }
}

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

/**
 * Format percentage value
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Format months to human-readable
 */
export function formatPayback(months: number): string {
  if (months < 0) {
    return 'No payback'
  } else if (months <= 1) {
    return '< 1 month'
  } else if (months < 12) {
    return `${months} months`
  } else {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`
    }
    return `${years}y ${remainingMonths}m`
  }
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate ROI inputs
 */
export function validateInputs(inputs: Partial<ROIInputs>): string[] {
  const errors: string[] = []

  if (inputs.hoursPerWeek !== undefined) {
    if (inputs.hoursPerWeek < 1 || inputs.hoursPerWeek > 168) {
      errors.push('Hours per week must be between 1 and 168')
    }
  }

  if (inputs.hourlyRate !== undefined) {
    if (inputs.hourlyRate < 0) {
      errors.push('Hourly rate cannot be negative')
    }
  }

  if (inputs.employeeCount !== undefined) {
    if (inputs.employeeCount < 1) {
      errors.push('At least one employee must be affected')
    }
  }

  if (inputs.automationLevel !== undefined) {
    if (inputs.automationLevel < 0 || inputs.automationLevel > 100) {
      errors.push('Automation level must be between 0% and 100%')
    }
  }

  if (inputs.implementationCost !== undefined) {
    if (inputs.implementationCost < 0) {
      errors.push('Implementation cost cannot be negative')
    }
  }

  if (inputs.monthlyMaintenanceCost !== undefined) {
    if (inputs.monthlyMaintenanceCost < 0) {
      errors.push('Monthly maintenance cost cannot be negative')
    }
  }

  return errors
}
