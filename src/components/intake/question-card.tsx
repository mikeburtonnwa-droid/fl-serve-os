/**
 * Question Card Component
 *
 * Renders individual intake questions with various input types.
 *
 * User Stories: US-028
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Check, AlertTriangle, Info, ChevronRight } from 'lucide-react'
import type { IntakeQuestion, QuestionOption, IntakeAnswer } from '@/lib/intake'

interface QuestionCardProps {
  question: IntakeQuestion
  answer?: IntakeAnswer
  onAnswer: (answer: IntakeAnswer) => void
  questionNumber: number
  totalQuestions: number
  isFollowUp?: boolean
}

export function QuestionCard({
  question,
  answer,
  onAnswer,
  questionNumber,
  totalQuestions,
  isFollowUp = false,
}: QuestionCardProps) {
  const [selectedValue, setSelectedValue] = useState<string | string[] | number | undefined>(
    answer?.value
  )
  const [notes, setNotes] = useState(answer?.notes || '')

  const handleOptionSelect = (value: string) => {
    if (question.type === 'multiple_choice') {
      // Multi-select logic
      const current = Array.isArray(selectedValue) ? selectedValue : []
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      setSelectedValue(updated)
    } else {
      // Single select
      setSelectedValue(value)
    }
  }

  const handleSubmit = () => {
    if (selectedValue === undefined) return

    onAnswer({
      questionId: question.id,
      value: selectedValue,
      notes: notes || undefined,
      answeredAt: new Date().toISOString(),
    })
  }

  const getOptionRiskBadge = (option: QuestionOption) => {
    if (!option.riskLevel || option.riskLevel === 'low') return null

    const variants: Record<string, 'warning' | 'danger'> = {
      medium: 'warning',
      high: 'danger',
      critical: 'danger',
    }

    return (
      <Badge variant={variants[option.riskLevel]} size="sm" className="ml-2">
        {option.riskLevel === 'critical' ? 'Critical Risk' : 'Risk Factor'}
      </Badge>
    )
  }

  const isSelected = (value: string) => {
    if (Array.isArray(selectedValue)) {
      return selectedValue.includes(value)
    }
    return selectedValue === value
  }

  const canSubmit =
    selectedValue !== undefined &&
    (Array.isArray(selectedValue) ? selectedValue.length > 0 : true)

  return (
    <Card className={isFollowUp ? 'border-blue-200 bg-blue-50/30' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isFollowUp && (
              <Badge variant="info" size="sm" className="mb-2">
                Follow-up Question
              </Badge>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <span>
                Question {questionNumber} of {totalQuestions}
              </span>
              <span>•</span>
              <span className="capitalize">{question.category.replace('_', ' ')}</span>
            </div>
            <CardTitle className="text-lg">{question.text}</CardTitle>
            {question.helpText && (
              <p className="text-sm text-slate-500 mt-2 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {question.helpText}
              </p>
            )}
          </div>
          <Badge variant="default" size="sm">
            Weight: {question.weight}/5
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Options for choice questions */}
        {(question.type === 'single_choice' || question.type === 'multiple_choice') &&
          question.options && (
            <div className="space-y-2">
              {question.type === 'multiple_choice' && (
                <p className="text-sm text-slate-500 mb-3">
                  Select all that apply
                </p>
              )}
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionSelect(option.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected(option.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded-${
                        question.type === 'multiple_choice' ? 'md' : 'full'
                      } border-2 flex items-center justify-center ${
                        isSelected(option.value)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected(option.value) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-slate-900">
                          {option.label}
                        </span>
                        {getOptionRiskBadge(option)}
                      </div>
                      {option.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

        {/* Scale input */}
        {question.type === 'scale' && (
          <div className="space-y-4">
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedValue(num)}
                  className={`w-10 h-10 rounded-lg border-2 font-medium transition-all ${
                    selectedValue === num
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}

        {/* Text input */}
        {question.type === 'text' && (
          <Textarea
            value={typeof selectedValue === 'string' ? selectedValue : ''}
            onChange={(e) => setSelectedValue(e.target.value)}
            placeholder="Enter your response..."
            rows={4}
          />
        )}

        {/* Number input */}
        {question.type === 'number' && (
          <Input
            type="number"
            value={typeof selectedValue === 'number' ? selectedValue : ''}
            onChange={(e) => setSelectedValue(parseInt(e.target.value) || 0)}
            placeholder="Enter a number..."
          />
        )}

        {/* Optional notes */}
        <div className="pt-4 border-t border-slate-100">
          <label className="text-sm font-medium text-slate-700">
            Additional Notes (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context or comments..."
            rows={2}
            className="mt-2"
          />
        </div>

        {/* Risk warning */}
        {question.options?.some(
          (o) =>
            isSelected(o.value) &&
            (o.riskLevel === 'high' || o.riskLevel === 'critical')
        ) && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Risk Factor Identified
              </p>
              <p className="text-sm text-amber-700">
                This selection may impact the recommended pathway. Additional mitigation
                strategies may be recommended.
              </p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
