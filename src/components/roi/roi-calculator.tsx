/**
 * ROI Calculator Main Component (F6.1-F6.5)
 *
 * Interactive ROI calculator with real-time updates, scenarios, and comparison.
 *
 * User Stories: US-024, US-025, US-026, US-027
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calculator,
  BarChart3,
  GitCompare,
  LineChart,
  RefreshCw,
  Settings2,
} from 'lucide-react'
import {
  type ROIInputs,
  type ROIResults,
  type ROIScenario,
  DEFAULT_ROI_INPUTS,
  SLIDER_CONFIGS,
  calculateROI,
} from '@/lib/roi'
import { ROISlider } from './roi-slider'
import { ROIChart, PaybackChart } from './roi-chart'
import { ROIResultsDisplay } from './roi-results'
import { ScenarioManager } from './scenario-manager'
import { ScenarioComparison } from './scenario-comparison'
import { SensitivityAnalysis } from './sensitivity-analysis'

interface ROICalculatorProps {
  engagementId: string
  initialInputs?: Partial<ROIInputs>
}

type TabId = 'calculator' | 'scenarios' | 'compare' | 'sensitivity'

export function ROICalculator({
  engagementId,
  initialInputs,
}: ROICalculatorProps) {
  // State
  const [inputs, setInputs] = useState<ROIInputs>({
    ...DEFAULT_ROI_INPUTS,
    ...initialInputs,
  })
  const [activeTab, setActiveTab] = useState<TabId>('calculator')
  const [scenarios, setScenarios] = useState<ROIScenario[]>([])
  const [, setLoading] = useState(true)

  // Calculate results (memoized for performance)
  const results = useMemo(() => calculateROI(inputs), [inputs])

  // Fetch scenarios on mount
  const fetchScenarios = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/engagements/${engagementId}/scenarios`
      )
      const data = await response.json()
      if (data.success) {
        setScenarios(
          data.scenarios.map((s: Record<string, unknown>) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            inputs: s.inputs as ROIInputs,
            results: s.results as ROIResults,
            isRecommended: s.is_recommended,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error)
    } finally {
      setLoading(false)
    }
  }, [engagementId])

  useEffect(() => {
    fetchScenarios()
  }, [fetchScenarios])

  // Input change handler
  const handleInputChange = (name: keyof ROIInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [name]: value }))
  }

  // Reset to defaults
  const handleReset = () => {
    setInputs(DEFAULT_ROI_INPUTS)
  }

  // Save scenario
  const handleSaveScenario = async (name: string, description?: string) => {
    const response = await fetch(`/api/engagements/${engagementId}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, inputs }),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to save scenario')
    }
  }

  // Load scenario
  const handleLoadScenario = (scenario: ROIScenario) => {
    setInputs(scenario.inputs)
    setActiveTab('calculator')
  }

  // Delete scenario
  const handleDeleteScenario = async (scenarioId: string) => {
    await fetch(
      `/api/engagements/${engagementId}/scenarios?scenarioId=${scenarioId}`,
      { method: 'DELETE' }
    )
  }

  // Set recommended scenario
  const handleSetRecommended = async (
    scenarioId: string,
    isRecommended: boolean
  ) => {
    await fetch(`/api/engagements/${engagementId}/scenarios`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, isRecommended }),
    })
  }

  // Tabs configuration
  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'scenarios', label: 'Scenarios', icon: BarChart3 },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'sensitivity', label: 'Sensitivity', icon: LineChart },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">ROI Calculator</h2>
          <p className="text-slate-500">
            Model automation ROI with real-time calculations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'scenarios' && scenarios.length > 0 && (
                  <Badge variant="default" size="sm">
                    {scenarios.length}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-slate-500" />
                  <CardTitle>Assumptions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {SLIDER_CONFIGS.map((config) => (
                  <ROISlider
                    key={config.name}
                    config={config}
                    value={inputs[config.name]}
                    onChange={(value) => handleInputChange(config.name, value)}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Results and Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <ROIResultsDisplay results={results} />

            {/* Cumulative Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Savings vs Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <ROIChart results={results} />
              </CardContent>
            </Card>

            {/* Payback Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Net Benefit Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <PaybackChart results={results} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'scenarios' && (
        <ScenarioManager
          engagementId={engagementId}
          currentInputs={inputs}
          scenarios={scenarios}
          onLoad={handleLoadScenario}
          onSave={handleSaveScenario}
          onDelete={handleDeleteScenario}
          onSetRecommended={handleSetRecommended}
          onRefresh={fetchScenarios}
        />
      )}

      {activeTab === 'compare' && (
        <ScenarioComparison
          scenarios={scenarios}
          onSetRecommended={async (id) => {
            await handleSetRecommended(id, true)
            await fetchScenarios()
          }}
        />
      )}

      {activeTab === 'sensitivity' && <SensitivityAnalysis inputs={inputs} />}
    </div>
  )
}
