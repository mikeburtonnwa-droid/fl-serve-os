/**
 * ROI Calculator Types (F6.1-F6.5)
 *
 * Type definitions for the interactive ROI calculator.
 */

// =============================================================================
// Input Parameters
// =============================================================================

export interface ROIInputs {
  // Labor costs
  hoursPerWeek: number // Hours spent on manual tasks per week
  hourlyRate: number // Fully loaded hourly rate ($)
  employeeCount: number // Number of employees affected

  // Automation parameters
  automationLevel: number // Percentage of tasks automated (0-100)
  implementationCost: number // One-time implementation cost ($)
  monthlyMaintenanceCost: number // Monthly ongoing costs ($)

  // Time factors
  rampUpMonths: number // Months to full automation
  projectionMonths: number // Total projection period (12, 24, 36, 48, 60)
}

export const DEFAULT_ROI_INPUTS: ROIInputs = {
  hoursPerWeek: 40,
  hourlyRate: 55,
  employeeCount: 1,
  automationLevel: 70,
  implementationCost: 50000,
  monthlyMaintenanceCost: 500,
  rampUpMonths: 3,
  projectionMonths: 36,
}

// =============================================================================
// Calculated Results
// =============================================================================

export interface ROIResults {
  // Monthly metrics
  monthlyLaborCost: number // Current monthly labor cost
  monthlySavings: number // Monthly savings at full automation
  netMonthlySavings: number // Savings minus maintenance

  // Annual metrics
  annualSavings: number // Annual savings at full automation
  netAnnualSavings: number // Annual savings minus maintenance

  // ROI metrics
  totalSavings: number // Total savings over projection period
  totalCosts: number // Implementation + maintenance over period
  netBenefit: number // Total savings minus total costs
  roi: number // Return on investment percentage
  paybackMonths: number // Months to break even

  // Monthly breakdown for charts
  monthlyBreakdown: MonthlyData[]
}

export interface MonthlyData {
  month: number
  date: string // YYYY-MM format
  savings: number
  cumulativeSavings: number
  costs: number
  cumulativeCosts: number
  netBenefit: number
  automationLevel: number // Ramp-up percentage
}

// =============================================================================
// Scenarios
// =============================================================================

export interface ROIScenario {
  id: string
  name: string
  description?: string
  inputs: ROIInputs
  results: ROIResults
  isRecommended: boolean
  createdAt: string
  updatedAt: string
}

export interface ScenarioComparison {
  scenarios: ROIScenario[]
  bestROI: string // scenario id
  fastestPayback: string // scenario id
  highestSavings: string // scenario id
  differences: ScenarioDifference[]
}

export interface ScenarioDifference {
  metric: string
  values: Record<string, number> // scenario id -> value
  best: string // scenario id with best value
  worst: string // scenario id with worst value
}

// =============================================================================
// Sensitivity Analysis
// =============================================================================

export interface SensitivityVariable {
  name: keyof ROIInputs
  label: string
  baseValue: number
  minValue: number
  maxValue: number
  step: number
  unit: string
}

export interface SensitivityResult {
  variable: string
  values: number[]
  roiValues: number[]
  paybackValues: number[]
  savingsValues: number[]
}

export interface SensitivityAnalysis {
  baseCase: ROIResults
  variables: SensitivityVariable[]
  results: SensitivityResult[]
}

// =============================================================================
// Slider Configuration
// =============================================================================

export interface SliderConfig {
  name: keyof ROIInputs
  label: string
  min: number
  max: number
  step: number
  unit: string
  prefix?: string
  suffix?: string
  helpText?: string
}

export const SLIDER_CONFIGS: SliderConfig[] = [
  {
    name: 'hoursPerWeek',
    label: 'Hours per Week',
    min: 1,
    max: 80,
    step: 1,
    unit: 'hours',
    suffix: ' hrs/week',
    helpText: 'Hours spent on manual tasks that can be automated',
  },
  {
    name: 'hourlyRate',
    label: 'Hourly Rate',
    min: 20,
    max: 200,
    step: 5,
    unit: 'dollars',
    prefix: '$',
    suffix: '/hour',
    helpText: 'Fully loaded cost per hour (salary + benefits + overhead)',
  },
  {
    name: 'employeeCount',
    label: 'Employees Affected',
    min: 1,
    max: 50,
    step: 1,
    unit: 'people',
    helpText: 'Number of employees who will benefit from automation',
  },
  {
    name: 'automationLevel',
    label: 'Automation Level',
    min: 10,
    max: 100,
    step: 5,
    unit: 'percent',
    suffix: '%',
    helpText: 'Percentage of tasks that will be automated',
  },
  {
    name: 'implementationCost',
    label: 'Implementation Cost',
    min: 0,
    max: 500000,
    step: 5000,
    unit: 'dollars',
    prefix: '$',
    helpText: 'One-time cost to implement automation solution',
  },
  {
    name: 'monthlyMaintenanceCost',
    label: 'Monthly Maintenance',
    min: 0,
    max: 10000,
    step: 100,
    unit: 'dollars',
    prefix: '$',
    suffix: '/month',
    helpText: 'Ongoing monthly costs (licenses, support, etc.)',
  },
  {
    name: 'rampUpMonths',
    label: 'Ramp-up Period',
    min: 1,
    max: 12,
    step: 1,
    unit: 'months',
    suffix: ' months',
    helpText: 'Time to reach full automation level',
  },
  {
    name: 'projectionMonths',
    label: 'Projection Period',
    min: 12,
    max: 60,
    step: 12,
    unit: 'months',
    suffix: ' months',
    helpText: 'Total time period for ROI calculation',
  },
]
