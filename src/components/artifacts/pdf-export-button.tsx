'use client'

/**
 * PDF Export Button Component (F4.1)
 *
 * Provides a button to export artifacts as branded PDFs.
 * Supports single and batch export with progress feedback.
 *
 * User Stories: US-018, US-019
 */

import { useState } from 'react'
import { FileText, Download, Loader2, Check, AlertCircle, Settings } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface PDFExportButtonProps {
  artifactId?: string
  artifactIds?: string[]
  artifactName?: string
  variant?: 'default' | 'outline' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  showSettings?: boolean
  onExportStart?: () => void
  onExportComplete?: (result: ExportResult) => void
  onExportError?: (error: string) => void
}

interface ExportResult {
  success: boolean
  filename?: string
  pageCount?: number
  sizeBytes?: number
  generationTimeMs?: number
  downloadUrl?: string
}

interface ExportOptions {
  template?: string
  pageSize: 'letter' | 'a4' | 'legal'
  orientation: 'portrait' | 'landscape'
  includeWatermark: boolean
  branding?: {
    companyName?: string
    watermark?: {
      text: string
      opacity: number
      position: 'center' | 'diagonal'
    }
  }
}

// =============================================================================
// Component
// =============================================================================

export function PDFExportButton({
  artifactId,
  artifactIds,
  artifactName,
  variant = 'default',
  size = 'md',
  showSettings = false,
  onExportStart,
  onExportComplete,
  onExportError,
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showOptions, setShowOptions] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    pageSize: 'letter',
    orientation: 'portrait',
    includeWatermark: false,
  })

  const isBatch = artifactIds && artifactIds.length > 1

  // ===========================================================================
  // Export Handler
  // ===========================================================================

  const handleExport = async () => {
    setIsExporting(true)
    setExportStatus('idle')
    onExportStart?.()

    try {
      const requestBody = isBatch
        ? { artifactIds, options }
        : { artifactId, options }

      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Export failed')
      }

      // Handle download
      if (isBatch) {
        // Download each PDF in batch
        for (const item of result.results) {
          if (item.success && item.pdfBase64) {
            downloadPDF(item.pdfBase64, item.filename)
          }
        }
      } else {
        // Download single PDF
        if (result.pdfBase64) {
          downloadPDF(result.pdfBase64, result.filename)
        }
      }

      setExportStatus('success')
      onExportComplete?.({
        success: true,
        filename: result.filename,
        pageCount: result.pageCount,
        sizeBytes: result.sizeBytes,
        generationTimeMs: result.generationTimeMs,
      })

      // Reset status after 2 seconds
      setTimeout(() => setExportStatus('idle'), 2000)

    } catch (error) {
      console.error('Export error:', error)
      setExportStatus('error')
      onExportError?.(error instanceof Error ? error.message : 'Export failed')

      // Reset status after 3 seconds
      setTimeout(() => setExportStatus('idle'), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  // ===========================================================================
  // Download Helper
  // ===========================================================================

  const downloadPDF = (dataUri: string, filename: string) => {
    const link = document.createElement('a')
    link.href = dataUri
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ===========================================================================
  // Styles
  // ===========================================================================

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  const variantClasses = {
    default: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    icon: 'p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  }

  const statusClasses = {
    idle: '',
    success: 'bg-green-600 hover:bg-green-600',
    error: 'bg-red-600 hover:bg-red-600',
  }

  // ===========================================================================
  // Render
  // ===========================================================================

  if (variant === 'icon') {
    return (
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses.icon}
          ${statusClasses[exportStatus]}
        `}
        title={`Export ${isBatch ? `${artifactIds?.length} artifacts` : artifactName || 'artifact'} as PDF`}
      >
        {isExporting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : exportStatus === 'success' ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : exportStatus === 'error' ? (
          <AlertCircle className="h-5 w-5 text-red-600" />
        ) : (
          <FileText className="h-5 w-5" />
        )}
      </button>
    )
  }

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${exportStatus !== 'idle' ? statusClasses[exportStatus] : ''}
        `}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : exportStatus === 'success' ? (
          <>
            <Check className="h-4 w-4" />
            <span>Downloaded!</span>
          </>
        ) : exportStatus === 'error' ? (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Failed</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>{isBatch ? `Export ${artifactIds?.length} PDFs` : 'Export PDF'}</span>
          </>
        )}
      </button>

      {showSettings && (
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="ml-1 p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          title="Export settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      )}

      {/* Options Dropdown */}
      {showOptions && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50">
          <h4 className="font-medium text-sm text-slate-900 mb-3">Export Options</h4>

          {/* Page Size */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Page Size
            </label>
            <select
              value={options.pageSize}
              onChange={(e) => setOptions({ ...options, pageSize: e.target.value as ExportOptions['pageSize'] })}
              className="w-full h-8 px-2 text-sm border border-slate-200 rounded-md"
            >
              <option value="letter">Letter (8.5&quot; × 11&quot;)</option>
              <option value="a4">A4 (210mm × 297mm)</option>
              <option value="legal">Legal (8.5&quot; × 14&quot;)</option>
            </select>
          </div>

          {/* Orientation */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Orientation
            </label>
            <select
              value={options.orientation}
              onChange={(e) => setOptions({ ...options, orientation: e.target.value as ExportOptions['orientation'] })}
              className="w-full h-8 px-2 text-sm border border-slate-200 rounded-md"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          {/* Watermark */}
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={options.includeWatermark}
                onChange={(e) => setOptions({ ...options, includeWatermark: e.target.checked })}
                className="rounded border-slate-300"
              />
              Include watermark
            </label>
          </div>

          {options.includeWatermark && (
            <div className="mb-3 pl-6">
              <input
                type="text"
                placeholder="Watermark text"
                value={options.branding?.watermark?.text || 'CONFIDENTIAL'}
                onChange={(e) => setOptions({
                  ...options,
                  branding: {
                    ...options.branding,
                    watermark: {
                      text: e.target.value,
                      opacity: 0.1,
                      position: 'diagonal',
                    },
                  },
                })}
                className="w-full h-8 px-2 text-sm border border-slate-200 rounded-md"
              />
            </div>
          )}

          <button
            onClick={() => setShowOptions(false)}
            className="w-full h-8 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Batch Export Panel Component
// =============================================================================

interface BatchExportPanelProps {
  selectedArtifactIds: string[]
  onClearSelection?: () => void
}

export function BatchExportPanel({
  selectedArtifactIds,
  onClearSelection,
}: BatchExportPanelProps) {
  if (selectedArtifactIds.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
      <span className="text-sm">
        {selectedArtifactIds.length} artifact{selectedArtifactIds.length !== 1 ? 's' : ''} selected
      </span>

      <PDFExportButton
        artifactIds={selectedArtifactIds}
        variant="default"
        size="sm"
      />

      {onClearSelection && (
        <button
          onClick={onClearSelection}
          className="text-sm text-slate-400 hover:text-white"
        >
          Clear
        </button>
      )}
    </div>
  )
}
