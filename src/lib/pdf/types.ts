/**
 * PDF Export Types (F4.1)
 *
 * Type definitions for the PDF generation service.
 *
 * User Stories: US-018, US-019, US-020
 */

// =============================================================================
// Branding Configuration
// =============================================================================

export interface BrandingConfig {
  companyName: string
  logo?: string // Base64 encoded or URL
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
    background: string
  }
  fonts?: {
    heading: string
    body: string
  }
  footer?: {
    text: string
    includePageNumbers: boolean
    includeDate: boolean
  }
  watermark?: {
    text: string
    opacity: number
    position: 'center' | 'diagonal'
  }
}

export const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'Frontier Logic',
  colors: {
    primary: '#0D9488', // Teal-600
    secondary: '#475569', // Slate-600
    accent: '#F59E0B', // Amber-500
    text: '#1E293B', // Slate-800
    background: '#FFFFFF',
  },
  fonts: {
    heading: 'Helvetica-Bold',
    body: 'Helvetica',
  },
  footer: {
    text: '© Frontier Logic - Confidential',
    includePageNumbers: true,
    includeDate: true,
  },
}

// =============================================================================
// PDF Template Types
// =============================================================================

export type PDFTemplateType =
  | 'roi_calculator'
  | 'implementation_plan'
  | 'future_state'
  | 'client_handoff'
  | 'case_study'
  | 'generic'

export interface PDFTemplate {
  id: PDFTemplateType
  name: string
  description: string
  sections: PDFSection[]
}

export interface PDFSection {
  id: string
  title: string
  type: 'header' | 'text' | 'table' | 'chart' | 'image' | 'list' | 'metrics' | 'signature'
  dataKey?: string // Key to extract data from artifact content
  config?: Record<string, unknown>
}

// =============================================================================
// Chart Types for PDF
// =============================================================================

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'timeline'

export interface ChartConfig {
  type: ChartType
  title?: string
  data: ChartDataPoint[]
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
  xAxisLabel?: string
  yAxisLabel?: string
}

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

// =============================================================================
// PDF Generation Options
// =============================================================================

export interface PDFGenerationOptions {
  template: PDFTemplateType
  branding?: Partial<BrandingConfig>
  pageSize?: 'letter' | 'a4' | 'legal'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  includeTableOfContents?: boolean
  includeWatermark?: boolean
  accessibility?: {
    tagStructure: boolean
    altText: boolean
    readingOrder: boolean
  }
}

export const DEFAULT_OPTIONS: PDFGenerationOptions = {
  template: 'generic',
  pageSize: 'letter',
  orientation: 'portrait',
  margins: {
    top: 72, // 1 inch
    right: 72,
    bottom: 72,
    left: 72,
  },
  includeTableOfContents: false,
  includeWatermark: false,
  accessibility: {
    tagStructure: true,
    altText: true,
    readingOrder: true,
  },
}

// =============================================================================
// PDF Generation Result
// =============================================================================

export interface PDFGenerationResult {
  success: boolean
  pdfBuffer?: Buffer
  pdfBase64?: string
  filename: string
  pageCount: number
  sizeBytes: number
  generationTimeMs: number
  error?: string
  warnings?: string[]
}

// =============================================================================
// Artifact Data for PDF
// =============================================================================

export interface ArtifactPDFData {
  id: string
  name: string
  templateId: string
  content: Record<string, unknown>
  engagement: {
    id: string
    name: string
    pathway: string
    client: {
      name: string
      industry?: string
    }
  }
  createdAt: string
  updatedAt: string
  approvedBy?: string
  approvedAt?: string
}

// =============================================================================
// Batch Export Types
// =============================================================================

export interface BatchExportRequest {
  artifacts: ArtifactPDFData[]
  options: PDFGenerationOptions
  outputFormat: 'individual' | 'merged' | 'zip'
}

export interface BatchExportResult {
  success: boolean
  totalArtifacts: number
  successfulExports: number
  failedExports: number
  results: Array<{
    artifactId: string
    artifactName: string
    success: boolean
    filename?: string
    error?: string
  }>
  mergedPdf?: PDFGenerationResult
  zipBuffer?: Buffer
  totalTimeMs: number
}
