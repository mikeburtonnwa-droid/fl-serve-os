/**
 * Template Viewer Component (F8.2)
 *
 * Displays full template content with preview and use options.
 *
 * User Stories: US-031
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  X,
  Copy,
  Star,
  StarOff,
  Clock,
  User,
  Tag,
  Building,
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import type { Template } from '@/lib/template-library'

interface TemplateViewerProps {
  template: Template
  onClose: () => void
  onUse: (templateId: string) => void
  onRate?: (templateId: string, rating: number) => void
  currentRating?: number
}

export function TemplateViewer({
  template,
  onClose,
  onUse,
  onRate,
  currentRating,
}: TemplateViewerProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const categoryLabel = template.category.charAt(0).toUpperCase() + template.category.slice(1)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">{categoryLabel}</Badge>
                {template.source === 'system' && (
                  <Badge variant="info">Official</Badge>
                )}
                {template.isAnonymized && (
                  <Badge variant="success" size="sm">
                    Anonymized
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <p className="text-slate-500 mt-1">{template.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
            {template.createdByName && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {template.createdByName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDate(template.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Copy className="h-4 w-4" />
              {template.usageCount} uses
            </span>
            {template.rating !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {template.rating.toFixed(1)} ({template.ratingCount} ratings)
              </span>
            )}
          </div>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Tag className="h-4 w-4 text-slate-400" />
              {template.tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Industry/Use Case */}
          {(template.industry || template.useCase) && (
            <div className="flex items-center gap-4 mt-3 text-sm">
              {template.industry && (
                <span className="flex items-center gap-1 text-slate-500">
                  <Building className="h-4 w-4" />
                  {template.industry}
                </span>
              )}
              {template.useCase && (
                <span className="text-slate-500">
                  Use case: {template.useCase}
                </span>
              )}
            </div>
          )}
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-y-auto p-6">
          {template.contentFormat === 'markdown' ? (
            <MarkdownRenderer content={template.content} />
          ) : (
            <pre className="whitespace-pre-wrap text-sm font-mono bg-slate-50 p-4 rounded-lg">
              {template.content}
            </pre>
          )}
        </CardContent>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center justify-between">
            {/* Rating */}
            {onRate && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Rate this template:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const filled =
                      hoveredRating !== null
                        ? rating <= hoveredRating
                        : currentRating !== undefined && rating <= currentRating
                    return (
                      <button
                        key={rating}
                        type="button"
                        onMouseEnter={() => setHoveredRating(rating)}
                        onMouseLeave={() => setHoveredRating(null)}
                        onClick={() => onRate(template.id, rating)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        {filled ? (
                          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        ) : (
                          <StarOff className="h-5 w-5 text-slate-300" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => onUse(template.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
