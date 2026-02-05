/**
 * Anonymization Preview Component (F8.4)
 *
 * Shows preview of anonymization before saving as template.
 *
 * User Stories: US-032
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Plus,
  X,
  Check,
  RefreshCw,
} from 'lucide-react'
import { anonymizeContent } from '@/lib/template-library'

interface AnonymizationPreviewProps {
  content: string
  onAnonymize: (anonymizedContent: string) => void
  onSkip: () => void
}

export function AnonymizationPreview({
  content,
  onAnonymize,
  onSkip,
}: AnonymizationPreviewProps) {
  const [showOriginal, setShowOriginal] = useState(false)

  // Custom names to anonymize
  const [customCompanyNames, setCustomCompanyNames] = useState<string[]>([])
  const [customPersonNames, setCustomPersonNames] = useState<string[]>([])
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newPersonName, setNewPersonName] = useState('')

  // Compute anonymization result using useMemo
  const anonymizationResult = useMemo(() => {
    return anonymizeContent(content, [], {
      detectCompanyNames: true,
      detectPersonNames: true,
      customCompanyNames,
      customPersonNames,
    })
  }, [content, customCompanyNames, customPersonNames])

  const anonymizedContent = anonymizationResult.anonymizedContent
  const replacements = anonymizationResult.replacements
  const confidenceScore = anonymizationResult.confidenceScore

  // Manual re-run function (for button click)
  const runAnonymization = useCallback(() => {
    // Since useMemo already recomputes on dependency change, this is mostly a no-op
    // but provided for explicit button click
  }, [])

  const addCompanyName = () => {
    if (newCompanyName.trim()) {
      setCustomCompanyNames((prev) => [...prev, newCompanyName.trim()])
      setNewCompanyName('')
    }
  }

  const addPersonName = () => {
    if (newPersonName.trim()) {
      setCustomPersonNames((prev) => [...prev, newPersonName.trim()])
      setNewPersonName('')
    }
  }

  const getReplacementColor = (type: string) => {
    const colors: Record<string, string> = {
      email: 'bg-blue-100 text-blue-700',
      phone: 'bg-green-100 text-green-700',
      name: 'bg-purple-100 text-purple-700',
      company: 'bg-orange-100 text-orange-700',
      address: 'bg-cyan-100 text-cyan-700',
      custom: 'bg-slate-100 text-slate-700',
    }
    return colors[type] || colors.custom
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Anonymization Preview
            </h3>
            <p className="text-sm text-slate-500">
              Review and customize before saving as template
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={confidenceScore >= 80 ? 'success' : confidenceScore >= 60 ? 'warning' : 'danger'}
          >
            {confidenceScore}% Confidence
          </Badge>
        </div>
      </div>

      {/* Replacements Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detected Items ({replacements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {replacements.length === 0 ? (
            <p className="text-sm text-slate-500">No sensitive information detected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {replacements.map((replacement, i) => (
                <div
                  key={i}
                  className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${getReplacementColor(
                    replacement.type
                  )}`}
                >
                  <span className="line-through opacity-60">{replacement.original}</span>
                  <span>→</span>
                  <span className="font-medium">{replacement.replacement}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Names */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Custom Names to Anonymize</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company Names */}
          <div>
            <label className="text-sm font-medium text-slate-700">Company Names</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Enter company name"
                onKeyDown={(e) => e.key === 'Enter' && addCompanyName()}
              />
              <Button variant="outline" onClick={addCompanyName}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {customCompanyNames.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {customCompanyNames.map((name) => (
                  <Badge key={name} variant="default" className="gap-1">
                    {name}
                    <button
                      type="button"
                      onClick={() =>
                        setCustomCompanyNames((prev) => prev.filter((n) => n !== name))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Person Names */}
          <div>
            <label className="text-sm font-medium text-slate-700">Person Names</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Enter person name"
                onKeyDown={(e) => e.key === 'Enter' && addPersonName()}
              />
              <Button variant="outline" onClick={addPersonName}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {customPersonNames.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {customPersonNames.map((name) => (
                  <Badge key={name} variant="default" className="gap-1">
                    {name}
                    <button
                      type="button"
                      onClick={() =>
                        setCustomPersonNames((prev) => prev.filter((n) => n !== name))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" onClick={runAnonymization} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-run Anonymization
          </Button>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Content Preview</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOriginal(!showOriginal)}
            >
              {showOriginal ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Show Anonymized
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Show Original
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto bg-slate-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm">
              {showOriginal ? content : anonymizedContent}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      {confidenceScore < 80 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Review Recommended
            </p>
            <p className="text-sm text-amber-700">
              The confidence score is below 80%. Please review the anonymized content
              carefully and add any custom names that should be removed.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onSkip}>
          Skip Anonymization
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowOriginal(!showOriginal)}>
            {showOriginal ? 'Preview Anonymized' : 'Preview Original'}
          </Button>
          <Button onClick={() => onAnonymize(anonymizedContent)}>
            <Check className="h-4 w-4 mr-2" />
            Use Anonymized Content
          </Button>
        </div>
      </div>
    </div>
  )
}
