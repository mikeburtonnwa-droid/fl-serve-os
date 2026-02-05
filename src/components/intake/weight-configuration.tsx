/**
 * Weight Configuration Component (F7.4)
 *
 * Admin interface for configuring question and category weights.
 *
 * User Stories: US-030
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Save,
  RefreshCw,
  Loader2,
  Settings2,
  Sliders,
  AlertCircle,
  Check,
} from 'lucide-react'
import { INTAKE_QUESTIONS, SCORING_WEIGHTS } from '@/lib/intake'

interface QuestionWeight {
  questionId: string
  category: string
  weight: number
  isActive: boolean
}

interface CategoryWeight {
  category: string
  weight: number
  displayName: string
  description?: string
  displayOrder: number
}

interface WeightConfigurationProps {
  onSave?: (weights: { questions: QuestionWeight[]; categories: CategoryWeight[] }) => Promise<void>
}

export function WeightConfiguration({ onSave }: WeightConfigurationProps) {
  const [questionWeights, setQuestionWeights] = useState<QuestionWeight[]>([])
  const [categoryWeights, setCategoryWeights] = useState<CategoryWeight[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'categories' | 'questions'>('categories')

  // Load weights on mount
  useEffect(() => {
    loadWeights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadWeights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/intake-weights')
      const data = await response.json()

      if (data.success) {
        setQuestionWeights(data.weights.questions)
        setCategoryWeights(data.weights.categories)
      } else {
        // Initialize with defaults if no saved weights
        initializeDefaults()
      }
    } catch (err) {
      console.error('Error loading weights:', err)
      initializeDefaults()
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaults = () => {
    // Initialize question weights from default questions
    const defaultQuestionWeights: QuestionWeight[] = INTAKE_QUESTIONS.map((q) => ({
      questionId: q.id,
      category: q.category,
      weight: q.weight,
      isActive: true,
    }))
    setQuestionWeights(defaultQuestionWeights)

    // Initialize category weights
    const defaultCategoryWeights: CategoryWeight[] = Object.entries(SCORING_WEIGHTS).map(
      ([category, categoryWeight], index) => ({
        category,
        weight: categoryWeight,
        displayName: category
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        displayOrder: index,
      })
    )
    setCategoryWeights(defaultCategoryWeights)
  }

  const handleQuestionWeightChange = (questionId: string, weight: number) => {
    setQuestionWeights((prev) =>
      prev.map((qw) =>
        qw.questionId === questionId ? { ...qw, weight: Math.max(1, Math.min(5, weight)) } : qw
      )
    )
  }

  const handleQuestionToggle = (questionId: string) => {
    setQuestionWeights((prev) =>
      prev.map((qw) =>
        qw.questionId === questionId ? { ...qw, isActive: !qw.isActive } : qw
      )
    )
  }

  const handleCategoryWeightChange = (category: string, weight: number) => {
    setCategoryWeights((prev) =>
      prev.map((cw) =>
        cw.category === category
          ? { ...cw, weight: Math.max(0.1, Math.min(2.0, weight)) }
          : cw
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      if (onSave) {
        await onSave({ questions: questionWeights, categories: categoryWeights })
      } else {
        const response = await fetch('/api/admin/intake-weights', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionWeights: questionWeights.map((qw) => ({
              questionId: qw.questionId,
              category: qw.category,
              weight: qw.weight,
              isActive: qw.isActive,
            })),
            categoryWeights: categoryWeights.map((cw) => ({
              category: cw.category,
              weight: cw.weight,
              displayName: cw.displayName,
              description: cw.description,
              displayOrder: cw.displayOrder,
            })),
          }),
        })

        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || 'Failed to save weights')
        }
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save weights')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    initializeDefaults()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Weight Configuration</h2>
          <p className="text-slate-500">
            Configure scoring weights for intake assessment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700">
          <Check className="h-5 w-5" />
          Weights saved successfully
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Category Weights
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings2 className="h-4 w-4" />
            Question Weights
          </button>
        </nav>
      </div>

      {/* Category Weights */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Weights</CardTitle>
            <p className="text-sm text-slate-500">
              Adjust the relative importance of each category (0.1x - 2.0x multiplier)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryWeights.map((cw) => (
                <div
                  key={cw.category}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900">{cw.displayName}</p>
                    {cw.description && (
                      <p className="text-sm text-slate-500">{cw.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={cw.weight}
                      onChange={(e) =>
                        handleCategoryWeightChange(cw.category, parseFloat(e.target.value))
                      }
                      className="w-32"
                    />
                    <Input
                      type="number"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={cw.weight}
                      onChange={(e) =>
                        handleCategoryWeightChange(cw.category, parseFloat(e.target.value))
                      }
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-slate-500 w-8">x</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Weights */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {Array.from(new Set(questionWeights.map((qw) => qw.category))).map((category) => {
            const categoryQuestions = questionWeights.filter((qw) => qw.category === category)
            const displayName = category
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-base">{displayName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryQuestions.map((qw) => {
                      const questionData = INTAKE_QUESTIONS.find(
                        (q) => q.id === qw.questionId
                      )
                      if (!questionData) return null

                      return (
                        <div
                          key={qw.questionId}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            qw.isActive
                              ? 'bg-white border-slate-200'
                              : 'bg-slate-100 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex-1 mr-4">
                            <p
                              className={`text-sm ${
                                qw.isActive ? 'text-slate-700' : 'text-slate-500'
                              }`}
                            >
                              {questionData.text}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {/* Weight selector */}
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((w) => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => handleQuestionWeightChange(qw.questionId, w)}
                                  disabled={!qw.isActive}
                                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                                    qw.weight === w
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  } ${!qw.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {w}
                                </button>
                              ))}
                            </div>

                            {/* Active toggle */}
                            <button
                              type="button"
                              onClick={() => handleQuestionToggle(qw.questionId)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                qw.isActive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {qw.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
