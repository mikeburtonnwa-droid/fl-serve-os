/**
 * Intake Wizard Component
 *
 * Main wizard for conducting intake assessments.
 *
 * User Stories: US-028, US-029
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  CheckCircle,
  ClipboardList,
} from 'lucide-react'
import type {
  IntakeQuestion,
  FollowUpQuestion,
  IntakeAnswer,
  AssessmentScores,
} from '@/lib/intake'
import {
  calculateAssessmentScore,
  isAssessmentComplete,
  INTAKE_QUESTIONS,
  FOLLOW_UP_QUESTIONS,
} from '@/lib/intake'
import { QuestionCard } from './question-card'
import { ScoreBreakdown } from './score-breakdown'
import { PathwayOverride } from './pathway-override'

interface IntakeWizardProps {
  engagementId: string
  initialAnswers?: IntakeAnswer[]
  initialStatus?: 'in_progress' | 'completed' | 'reviewed'
  existingOverride?: {
    pathway: 'accelerated' | 'standard' | 'extended'
    justification: string
    overrideAt: string
  }
  onSave: (answers: IntakeAnswer[], status: string) => Promise<void>
  onOverride: (pathway: string, justification: string) => Promise<void>
}

export function IntakeWizard({
  initialAnswers = [],
  initialStatus = 'in_progress',
  existingOverride,
  onSave,
  onOverride,
}: IntakeWizardProps) {
  const [answers, setAnswers] = useState<IntakeAnswer[]>(initialAnswers)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [scores, setScores] = useState<AssessmentScores | null>(null)
  const [showResults, setShowResults] = useState(initialStatus === 'completed')
  const [saving, setSaving] = useState(false)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // Get all questions including triggered follow-ups
  const getAllQuestions = useCallback((): (IntakeQuestion | FollowUpQuestion)[] => {
    const allQuestions: (IntakeQuestion | FollowUpQuestion)[] = [...INTAKE_QUESTIONS]

    // Add triggered follow-up questions
    for (const answer of answers) {
      const question = INTAKE_QUESTIONS.find((q) => q.id === answer.questionId)
      if (!question?.options) continue

      const selectedValues = Array.isArray(answer.value) ? answer.value : [answer.value]

      for (const value of selectedValues) {
        const option = question.options.find((o) => o.value === value)
        if (option?.triggersFollowUp) {
          const triggered = FOLLOW_UP_QUESTIONS.filter(
            (fq) =>
              option.triggersFollowUp?.includes(fq.id) &&
              !allQuestions.some((q) => q.id === fq.id)
          )
          allQuestions.push(...triggered)
        }
      }
    }

    return allQuestions
  }, [answers])

  // Calculate scores whenever answers change
  useEffect(() => {
    const newScores = calculateAssessmentScore(answers)
    setScores(newScores)
  }, [answers])

  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    const timeout = setTimeout(async () => {
      try {
        await onSave(answers, 'in_progress')
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 5000) // Auto-save after 5 seconds of inactivity

    setAutoSaveTimeout(timeout)
  }, [answers, autoSaveTimeout, onSave])

  // Handle answer submission
  const handleAnswer = (answer: IntakeAnswer) => {
    const existingIndex = answers.findIndex((a) => a.questionId === answer.questionId)
    let newAnswers: IntakeAnswer[]

    if (existingIndex >= 0) {
      newAnswers = [...answers]
      newAnswers[existingIndex] = answer
    } else {
      newAnswers = [...answers, answer]
    }

    setAnswers(newAnswers)
    scheduleAutoSave()

    // Check if there are more questions
    const allQuestions = getAllQuestions()
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (isAssessmentComplete(newAnswers)) {
      setShowResults(true)
    }
  }

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  // Navigate to next question
  const handleNext = () => {
    const allQuestions = getAllQuestions()
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // Save and complete assessment
  const handleComplete = async () => {
    setSaving(true)
    try {
      await onSave(answers, 'completed')
      setShowResults(true)
    } catch (error) {
      console.error('Failed to complete assessment:', error)
    } finally {
      setSaving(false)
    }
  }

  // Save progress
  const handleSaveProgress = async () => {
    setSaving(true)
    try {
      await onSave(answers, 'in_progress')
    } catch (error) {
      console.error('Failed to save progress:', error)
    } finally {
      setSaving(false)
    }
  }

  // Back to questions from results
  const handleBackToQuestions = () => {
    setShowResults(false)
  }

  const allQuestions = getAllQuestions()
  const currentQuestion = allQuestions[currentQuestionIndex]
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id)
  const isComplete = isAssessmentComplete(answers)

  // Show results view
  if (showResults && scores) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Assessment Results</h2>
            <p className="text-slate-500">
              Review your assessment scores and pathway recommendation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackToQuestions}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Edit Answers
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ScoreBreakdown scores={scores} />
          </div>
          <div>
            <PathwayOverride
              currentPathway={existingOverride?.pathway || scores.pathwayRecommendation.pathway}
              recommendedPathway={scores.pathwayRecommendation.pathway}
              existingOverride={existingOverride}
              onOverride={onOverride}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show question wizard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Intake Assessment</h2>
          <p className="text-slate-500">
            Answer the following questions to determine the best implementation pathway
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveProgress} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Progress
          </Button>
          {isComplete && (
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Complete Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">
              Progress: {answers.length} of {allQuestions.length} questions
            </span>
            <span className="text-sm font-medium">
              {Math.round((answers.length / allQuestions.length) * 100)}% complete
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(answers.length / allQuestions.length) * 100}%` }}
            />
          </div>

          {/* Category progress indicators */}
          <div className="flex flex-wrap gap-2 mt-4">
            {Array.from(new Set(INTAKE_QUESTIONS.map((q) => q.category))).map((category) => {
              const categoryQuestions = allQuestions.filter((q) => q.category === category)
              const answeredCount = answers.filter((a) =>
                categoryQuestions.some((q) => q.id === a.questionId)
              ).length
              const isComplete = answeredCount === categoryQuestions.length

              return (
                <Badge
                  key={category}
                  variant={isComplete ? 'success' : 'default'}
                  size="sm"
                >
                  {category.replace('_', ' ')}: {answeredCount}/{categoryQuestions.length}
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {currentQuestion ? (
        <QuestionCard
          question={currentQuestion}
          answer={currentAnswer}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={allQuestions.length}
          isFollowUp={'parentQuestionId' in currentQuestion}
        />
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No questions available</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {/* Question dots */}
        <div className="flex items-center gap-1">
          {allQuestions.slice(0, 10).map((q, i) => {
            const isAnswered = answers.some((a) => a.questionId === q.id)
            const isCurrent = i === currentQuestionIndex

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  isCurrent
                    ? 'w-4 bg-blue-500'
                    : isAnswered
                    ? 'bg-emerald-500'
                    : 'bg-slate-300'
                }`}
              />
            )
          })}
          {allQuestions.length > 10 && (
            <span className="text-xs text-slate-400 ml-2">
              +{allQuestions.length - 10} more
            </span>
          )}
        </div>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentQuestionIndex === allQuestions.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Live Score Preview */}
      {scores && answers.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Current Score</p>
                <p className="text-2xl font-bold text-slate-900">
                  {scores.overallScore}/100
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Projected Pathway</p>
                <Badge variant={scores.pathwayRecommendation.pathway === 'accelerated' ? 'success' : scores.pathwayRecommendation.pathway === 'standard' ? 'info' : 'warning'}>
                  {scores.pathwayRecommendation.pathway.charAt(0).toUpperCase() +
                    scores.pathwayRecommendation.pathway.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
