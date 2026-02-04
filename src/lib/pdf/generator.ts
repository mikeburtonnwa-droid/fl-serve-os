/**
 * PDF Generation Service (F4.1)
 *
 * Core PDF generation engine using jsPDF with support for:
 * - Custom branding and templates
 * - Charts and visualizations
 * - Tables with styling
 * - Watermarks and footers
 * - Accessibility features
 *
 * User Stories: US-018, US-019, US-020
 * Test Cases: TC-401, TC-402
 */

import { jsPDF } from 'jspdf'
import type {
  PDFGenerationOptions,
  PDFGenerationResult,
  BrandingConfig,
  ArtifactPDFData,
  PDFSection,
  ChartConfig,
} from './types'
import { DEFAULT_BRANDING, DEFAULT_OPTIONS } from './types'
import { getPDFTemplate, artifactTemplateToPDFTemplate } from './templates'

// =============================================================================
// Constants
// =============================================================================

const PAGE_SIZES = {
  letter: { width: 612, height: 792 } as const,
  a4: { width: 595, height: 842 } as const,
  legal: { width: 612, height: 1008 } as const,
}

// Points per inch constant (72pt = 1 inch) - used for margin calculations
const _POINTS_PER_INCH = 72
void _POINTS_PER_INCH // Suppress unused warning, reserved for future use

// =============================================================================
// PDF Generator Class
// =============================================================================

export class PDFGenerator {
  private doc: jsPDF
  private branding: BrandingConfig
  private options: PDFGenerationOptions
  private currentY: number
  private pageWidth: number
  private pageHeight: number
  private contentWidth: number
  private pageNumber: number
  private startTime: number

  constructor(options: PDFGenerationOptions = {} as PDFGenerationOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.branding = { ...DEFAULT_BRANDING, ...options.branding }
    this.startTime = performance.now()
    this.pageNumber = 1

    // Initialize jsPDF
    const pageSize = PAGE_SIZES[this.options.pageSize || 'letter']
    this.pageWidth = this.options.orientation === 'landscape' ? pageSize.height : pageSize.width
    this.pageHeight = this.options.orientation === 'landscape' ? pageSize.width : pageSize.height

    this.doc = new jsPDF({
      orientation: this.options.orientation || 'portrait',
      unit: 'pt',
      format: this.options.pageSize || 'letter',
    })

    // Calculate content area
    const margins = this.options.margins || { top: 72, right: 72, bottom: 72, left: 72 }
    this.contentWidth = this.pageWidth - margins.left - margins.right
    this.currentY = margins.top

    // Set default font
    this.doc.setFont('helvetica', 'normal')
  }

  // ===========================================================================
  // Main Generation Methods
  // ===========================================================================

  /**
   * Generate PDF from artifact data
   */
  async generate(artifact: ArtifactPDFData): Promise<PDFGenerationResult> {
    try {
      // Determine template
      const templateType = this.options.template || artifactTemplateToPDFTemplate(artifact.templateId)
      const template = getPDFTemplate(templateType)

      // Add watermark if enabled
      if (this.options.includeWatermark && this.branding.watermark) {
        this.addWatermark()
      }

      // Process each section
      for (const section of template.sections) {
        await this.renderSection(section, artifact)
      }

      // Add footer to all pages
      this.addFooterToAllPages()

      // Generate output
      const pdfBuffer = Buffer.from(this.doc.output('arraybuffer'))
      const pdfBase64 = this.doc.output('datauristring')

      return {
        success: true,
        pdfBuffer,
        pdfBase64,
        filename: this.generateFilename(artifact),
        pageCount: this.pageNumber,
        sizeBytes: pdfBuffer.length,
        generationTimeMs: Math.round(performance.now() - this.startTime),
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        pageCount: 0,
        sizeBytes: 0,
        generationTimeMs: Math.round(performance.now() - this.startTime),
        error: error instanceof Error ? error.message : 'PDF generation failed',
      }
    }
  }

  // ===========================================================================
  // Section Rendering
  // ===========================================================================

  private async renderSection(section: PDFSection, artifact: ArtifactPDFData): Promise<void> {
    // Check if we need a new page
    this.checkPageBreak(50)

    switch (section.type) {
      case 'header':
        this.renderHeader(section, artifact)
        break
      case 'text':
        this.renderText(section, artifact)
        break
      case 'table':
        this.renderTable(section, artifact)
        break
      case 'chart':
        await this.renderChart(section, artifact)
        break
      case 'list':
        this.renderList(section, artifact)
        break
      case 'metrics':
        this.renderMetrics(section, artifact)
        break
      case 'signature':
        this.renderSignature(section)
        break
      case 'image':
        await this.renderImage(section, artifact)
        break
    }
  }

  // ===========================================================================
  // Header Section
  // ===========================================================================

  private renderHeader(section: PDFSection, artifact: ArtifactPDFData): void {
    const margins = this.options.margins || { top: 72, left: 72, right: 72, bottom: 72 }

    // Company branding bar
    this.doc.setFillColor(this.hexToRgb(this.branding.colors.primary).r, this.hexToRgb(this.branding.colors.primary).g, this.hexToRgb(this.branding.colors.primary).b)
    this.doc.rect(0, 0, this.pageWidth, 60, 'F')

    // Company name
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(this.branding.companyName, margins.left, 38)

    this.currentY = 80

    // Document title
    this.doc.setTextColor(this.hexToRgb(this.branding.colors.text).r, this.hexToRgb(this.branding.colors.text).g, this.hexToRgb(this.branding.colors.text).b)
    this.doc.setFontSize(24)
    this.doc.text(section.title || artifact.name, margins.left, this.currentY)
    this.currentY += 30

    // Client and date info
    const config = section.config as { includeClientName?: boolean; includeDate?: boolean } || {}
    if (config.includeClientName || config.includeDate) {
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(this.hexToRgb(this.branding.colors.secondary).r, this.hexToRgb(this.branding.colors.secondary).g, this.hexToRgb(this.branding.colors.secondary).b)

      const infoLines: string[] = []
      if (config.includeClientName) {
        infoLines.push(`Client: ${artifact.engagement.client.name}`)
        infoLines.push(`Engagement: ${artifact.engagement.name}`)
      }
      if (config.includeDate) {
        infoLines.push(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)
      }

      for (const line of infoLines) {
        this.doc.text(line, margins.left, this.currentY)
        this.currentY += 16
      }
    }

    // Divider line
    this.currentY += 10
    this.doc.setDrawColor(this.hexToRgb(this.branding.colors.primary).r, this.hexToRgb(this.branding.colors.primary).g, this.hexToRgb(this.branding.colors.primary).b)
    this.doc.setLineWidth(2)
    this.doc.line(margins.left, this.currentY, this.pageWidth - margins.right, this.currentY)
    this.currentY += 30
  }

  // ===========================================================================
  // Text Section
  // ===========================================================================

  private renderText(section: PDFSection, artifact: ArtifactPDFData): void {
    const margins = this.options.margins || { top: 72, left: 72, right: 72, bottom: 72 }
    const content = this.getContent(section.dataKey, artifact)

    if (!content) return

    // Section title
    this.renderSectionTitle(section.title)

    // Text content
    const config = section.config as { style?: string; fontSize?: number } || {}
    const fontSize = config.fontSize || 11
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(this.hexToRgb(this.branding.colors.text).r, this.hexToRgb(this.branding.colors.text).g, this.hexToRgb(this.branding.colors.text).b)

    // Handle highlight style
    if (config.style === 'highlight') {
      const padding = 10
      const textLines = this.doc.splitTextToSize(String(content), this.contentWidth - padding * 2)
      const boxHeight = textLines.length * fontSize * 1.5 + padding * 2

      this.checkPageBreak(boxHeight)

      // Draw highlight box
      const primaryColor = this.hexToRgb(this.branding.colors.primary)
      this.doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b, 0.1)
      this.doc.roundedRect(margins.left, this.currentY, this.contentWidth, boxHeight, 5, 5, 'F')

      // Draw left accent bar
      this.doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
      this.doc.rect(margins.left, this.currentY, 4, boxHeight, 'F')

      // Add text
      this.currentY += padding + fontSize
      this.doc.text(textLines, margins.left + padding + 8, this.currentY)
      this.currentY += (textLines.length - 1) * fontSize * 1.5 + padding + 10
    } else if (config.style === 'quote') {
      // Quote style
      this.doc.setFontSize(fontSize + 2)
      this.doc.setFont('helvetica', 'italic')
      const textLines = this.doc.splitTextToSize(`"${content}"`, this.contentWidth - 40)

      this.checkPageBreak(textLines.length * (fontSize + 2) * 1.5 + 30)

      this.doc.text(textLines, margins.left + 20, this.currentY)
      this.currentY += textLines.length * (fontSize + 2) * 1.5 + 20
    } else {
      // Normal text
      const textLines = this.doc.splitTextToSize(String(content), this.contentWidth)

      this.checkPageBreak(textLines.length * fontSize * 1.5)

      this.doc.text(textLines, margins.left, this.currentY)
      this.currentY += textLines.length * fontSize * 1.5 + 15
    }
  }

  // ===========================================================================
  // Table Section
  // ===========================================================================

  private renderTable(section: PDFSection, artifact: ArtifactPDFData): void {
    const margins = this.options.margins || { top: 72, left: 72, right: 72, bottom: 72 }
    const data = this.getContent(section.dataKey, artifact) as Array<Record<string, unknown>> | undefined

    if (!data || !Array.isArray(data) || data.length === 0) return

    // Section title
    this.renderSectionTitle(section.title)

    const config = section.config as {
      columns?: Array<{ key: string; header: string; width: string; format?: string }>
      showTotals?: boolean
    } || {}

    const columns: Array<{ key: string; header: string; width: string; format?: string }> = config.columns || Object.keys(data[0]).map(key => ({
      key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      width: `${100 / Object.keys(data[0]).length}%`,
    }))

    // Calculate column widths
    const columnWidths = columns.map(col => {
      const percent = parseFloat(col.width) / 100
      return this.contentWidth * percent
    })

    const rowHeight = 25
    const headerHeight = 30

    // Check for page break
    this.checkPageBreak(headerHeight + rowHeight * Math.min(data.length, 5))

    // Draw header
    let x = margins.left
    this.doc.setFillColor(this.hexToRgb(this.branding.colors.primary).r, this.hexToRgb(this.branding.colors.primary).g, this.hexToRgb(this.branding.colors.primary).b)
    this.doc.rect(margins.left, this.currentY, this.contentWidth, headerHeight, 'F')

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')

    for (let i = 0; i < columns.length; i++) {
      this.doc.text(columns[i].header, x + 5, this.currentY + 18)
      x += columnWidths[i]
    }

    this.currentY += headerHeight

    // Draw rows
    this.doc.setTextColor(this.hexToRgb(this.branding.colors.text).r, this.hexToRgb(this.branding.colors.text).g, this.hexToRgb(this.branding.colors.text).b)
    this.doc.setFont('helvetica', 'normal')

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      this.checkPageBreak(rowHeight)

      // Alternate row background
      if (rowIndex % 2 === 1) {
        this.doc.setFillColor(248, 250, 252) // slate-50
        this.doc.rect(margins.left, this.currentY, this.contentWidth, rowHeight, 'F')
      }

      x = margins.left
      const row = data[rowIndex]

      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const col = columns[colIndex]
        let value = String(row[col.key] ?? '')

        // Format value
        if (col.format === 'currency' && !isNaN(Number(row[col.key]))) {
          value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(row[col.key]))
        } else if (col.format === 'percentage' && !isNaN(Number(row[col.key]))) {
          value = `${Number(row[col.key]).toFixed(1)}%`
        }

        // Truncate if too long
        const maxWidth = columnWidths[colIndex] - 10
        const truncated = this.truncateText(value, maxWidth)

        this.doc.text(truncated, x + 5, this.currentY + 16)
        x += columnWidths[colIndex]
      }

      this.currentY += rowHeight
    }

    // Draw totals row if configured
    if (config.showTotals) {
      this.doc.setFillColor(this.hexToRgb(this.branding.colors.secondary).r, this.hexToRgb(this.branding.colors.secondary).g, this.hexToRgb(this.branding.colors.secondary).b)
      this.doc.rect(margins.left, this.currentY, this.contentWidth, rowHeight, 'F')

      this.doc.setTextColor(255, 255, 255)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Total', margins.left + 5, this.currentY + 16)

      this.currentY += rowHeight
    }

    this.currentY += 15
  }

  // ===========================================================================
  // List Section
  // ===========================================================================

  private renderList(section: PDFSection, artifact: ArtifactPDFData): void {
    const margins = this.options.margins || { top: 72, left: 72, right: 72, bottom: 72 }
    const items = this.getContent(section.dataKey, artifact) as string[] | undefined

    if (!items || !Array.isArray(items) || items.length === 0) return

    // Section title
    this.renderSectionTitle(section.title)

    const config = section.config as { style?: string } || {}
    const style = config.style || 'bullet'

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(this.hexToRgb(this.branding.colors.text).r, this.hexToRgb(this.branding.colors.text).g, this.hexToRgb(this.branding.colors.text).b)

    const lineHeight = 20
    const indent = 20

    for (let i = 0; i < items.length; i++) {
      this.checkPageBreak(lineHeight)

      let marker: string
      switch (style) {
        case 'numbered':
          marker = `${i + 1}.`
          break
        case 'checkbox':
          marker = '☐'
          break
        default:
          marker = '•'
      }

      this.doc.text(marker, margins.left, this.currentY)

      const textLines = this.doc.splitTextToSize(items[i], this.contentWidth - indent)
      this.doc.text(textLines, margins.left + indent, this.currentY)

      this.currentY += textLines.length * lineHeight
    }

    this.currentY += 10
  }

  // ===========================================================================
  // Metrics Section
  // ===========================================================================

  private renderMetrics(section: PDFSection, artifact: ArtifactPDFData): void {
    const margins = this.options.margins || { top: 72, left: 72, right: 72, bottom: 72 }
    const data = this.getContent(section.dataKey, artifact) as Record<string, unknown> | undefined

    if (!data) return

    // Section title
    this.renderSectionTitle(section.title)

    const config = section.config as {
      layout?: string
      columns?: number
      metrics?: Array<{ key: string; label: string; format?: string }>
    } || {}

    const layout = config.layout || 'grid'
    const columns = config.columns || 3
    const metrics: Array<{ key: string; label: string; format?: string }> = config.metrics || Object.keys(data).map(key => ({
      key,
      label: key.replace(/([A-Z])/g, ' $1').trim(),
    }))

    if (layout === 'grid') {
      const cardWidth = (this.contentWidth - (columns - 1) * 15) / columns
      const cardHeight = 70

      this.checkPageBreak(cardHeight + 10)

      let x = margins.left

      for (let i = 0; i < metrics.length; i++) {
        const metric = metrics[i]
        const value = data[metric.key]

        if (i > 0 && i % columns === 0) {
          x = margins.left
          this.currentY += cardHeight + 10
          this.checkPageBreak(cardHeight)
        }

        // Card background
        this.doc.setFillColor(248, 250, 252) // slate-50
        this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 5, 5, 'F')

        // Left accent
        this.doc.setFillColor(this.hexToRgb(this.branding.colors.primary).r, this.hexToRgb(this.branding.colors.primary).g, this.hexToRgb(this.branding.colors.primary).b)
        this.doc.rect(x, this.currentY + 5, 3, cardHeight - 10, 'F')

        // Label
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(this.hexToRgb(this.branding.colors.secondary).r, this.hexToRgb(this.branding.colors.secondary).g, this.hexToRgb(this.branding.colors.secondary).b)
        this.doc.text(metric.label, x + 12, this.currentY + 20)

        // Value
        let formattedValue = String(value ?? '-')
        if (metric.format === 'currency' && !isNaN(Number(value))) {
          formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value))
        } else if (metric.format === 'percentage' && !isNaN(Number(value))) {
          formattedValue = `${Number(value).toFixed(1)}%`
        } else if (metric.format === 'months' && !isNaN(Number(value))) {
          formattedValue = `${Number(value)} months`
        }

        this.doc.setFontSize(18)
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(this.hexToRgb(this.branding.colors.text).r, this.hexToRgb(this.branding.colors.text).g, this.hexToRgb(this.branding.colors.text).b)
        this.doc.text(formattedValue, x + 12, this.currentY + 48)

        x += cardWidth + 15
      }

      this.currentY += cardHeight + 20
    }
  }

  // ===========================================================================
  // Chart Section (Placeholder - would use canvas rendering in production)
  // ===========================================================================

  private async renderChart(section: PDFSection, artifact: ArtifactPDFData): Promise<void> {
    const margins = this.options.margins || { top: 72, left: 72, right: 72, bottom: 72 }
    const data = this.getContent(section.dataKey, artifact) as ChartConfig | unknown[] | undefined

    if (!data) return

    // Section title
    this.renderSectionTitle(section.title)

    const chartHeight = 200
    this.checkPageBreak(chartHeight + 20)

    // Draw chart placeholder with sample visualization
    const config = section.config as { chartType?: string } || {}

    // Chart background
    this.doc.setFillColor(248, 250, 252)
    this.doc.roundedRect(margins.left, this.currentY, this.contentWidth, chartHeight, 5, 5, 'F')

    // Chart border
    this.doc.setDrawColor(this.hexToRgb(this.branding.colors.secondary).r, this.hexToRgb(this.branding.colors.secondary).g, this.hexToRgb(this.branding.colors.secondary).b)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(margins.left, this.currentY, this.contentWidth, chartHeight, 5, 5, 'S')

    // Simple bar chart visualization if data is array
    if (Array.isArray(data) && data.length > 0) {
      const barWidth = Math.min(40, (this.contentWidth - 60) / data.length)
      const chartItems = data as Array<{ value?: unknown; label?: unknown }>
      const maxValue = Math.max(...chartItems.map((d) => Number(d.value) || 0))
      const chartAreaHeight = chartHeight - 60

      let x = margins.left + 30

      for (const item of chartItems) {
        const value = Number(item.value) || 0
        const barHeight = (value / maxValue) * chartAreaHeight

        this.doc.setFillColor(this.hexToRgb(this.branding.colors.primary).r, this.hexToRgb(this.branding.colors.primary).g, this.hexToRgb(this.branding.colors.primary).b)
        this.doc.rect(x, this.currentY + chartHeight - 30 - barHeight, barWidth - 5, barHeight, 'F')

        // Label
        this.doc.setFontSize(8)
        this.doc.setTextColor(this.hexToRgb(this.branding.colors.secondary).r, this.hexToRgb(this.branding.colors.secondary).g, this.hexToRgb(this.branding.colors.secondary).b)
        const label = String(item.label || '').substring(0, 8)
        this.doc.text(label, x + (barWidth - 5) / 2, this.currentY + chartHeight - 15, { align: 'center' })

        x += barWidth
      }
    } else {
      // Placeholder text for complex charts
      this.doc.setFontSize(12)
      this.doc.setTextColor(this.hexToRgb(this.branding.colors.secondary).r, this.hexToRgb(this.branding.colors.secondary).g, this.hexToRgb(this.branding.colors.secondary).b)
      this.doc.text(`[${config.chartType || 'Chart'} Visualization]`, margins.left + this.contentWidth / 2, this.currentY + chartHeight / 2, { align: 'center' })
    }

    this.currentY += chartHeight + 20
  }

  // ===========================================================================
  // Signature Section
  // ===========================================================================

  private renderSignature(section: PDFSection): void {
    const margins = this.options.margins || { top: 72, left: 72, right: 72, bottom: 72 }

    this.renderSectionTitle(section.title)

    const config = section.config as {
      signatures?: Array<{ label: string; dateLabel: string }>
    } || {}

    const signatures = config.signatures || [
      { label: 'Signature', dateLabel: 'Date' },
    ]

    const signatureWidth = (this.contentWidth - 40) / signatures.length

    this.checkPageBreak(80)

    let x = margins.left

    for (const sig of signatures) {
      // Signature line
      this.doc.setDrawColor(this.hexToRgb(this.branding.colors.secondary).r, this.hexToRgb(this.branding.colors.secondary).g, this.hexToRgb(this.branding.colors.secondary).b)
      this.doc.setLineWidth(0.5)
      this.doc.line(x, this.currentY + 40, x + signatureWidth - 20, this.currentY + 40)

      // Label
      this.doc.setFontSize(10)
      this.doc.setTextColor(this.hexToRgb(this.branding.colors.secondary).r, this.hexToRgb(this.branding.colors.secondary).g, this.hexToRgb(this.branding.colors.secondary).b)
      this.doc.text(sig.label, x, this.currentY + 55)

      // Date line
      this.doc.line(x, this.currentY + 70, x + 100, this.currentY + 70)
      this.doc.text(sig.dateLabel, x, this.currentY + 85)

      x += signatureWidth + 20
    }

    this.currentY += 100
  }

  // ===========================================================================
  // Image Section
  // ===========================================================================

  private async renderImage(section: PDFSection, artifact: ArtifactPDFData): Promise<void> {
    const margins = this.options.margins || { top: 72, left: 72, right: 72, bottom: 72 }
    const imageData = this.getContent(section.dataKey, artifact) as string | undefined

    if (!imageData) return

    this.renderSectionTitle(section.title)

    // Placeholder for image rendering
    const imageHeight = 150
    this.checkPageBreak(imageHeight + 20)

    this.doc.setFillColor(240, 240, 240)
    this.doc.roundedRect(margins.left, this.currentY, this.contentWidth, imageHeight, 5, 5, 'F')

    this.doc.setFontSize(10)
    this.doc.setTextColor(128, 128, 128)
    this.doc.text('[Image Placeholder]', margins.left + this.contentWidth / 2, this.currentY + imageHeight / 2, { align: 'center' })

    this.currentY += imageHeight + 15
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private renderSectionTitle(title: string): void {
    const margins = this.options.margins || { top: 72, left: 72, right: 72, bottom: 72 }

    this.checkPageBreak(40)

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(this.hexToRgb(this.branding.colors.text).r, this.hexToRgb(this.branding.colors.text).g, this.hexToRgb(this.branding.colors.text).b)
    this.doc.text(title, margins.left, this.currentY)
    this.currentY += 25
  }

  private checkPageBreak(requiredSpace: number): void {
    const margins = this.options.margins || { top: 72, right: 72, bottom: 72, left: 72 }

    if (this.currentY + requiredSpace > this.pageHeight - margins.bottom) {
      this.doc.addPage()
      this.pageNumber++
      this.currentY = margins.top

      // Add watermark to new page
      if (this.options.includeWatermark && this.branding.watermark) {
        this.addWatermark()
      }
    }
  }

  private addWatermark(): void {
    if (!this.branding.watermark) return

    const { text, opacity, position } = this.branding.watermark

    this.doc.saveGraphicsState()
    // Use type assertion for GState which is a jsPDF extension
    const GStateClass = (this.doc as unknown as { GState: new (options: { opacity: number }) => unknown }).GState
    if (GStateClass) {
      this.doc.setGState(new GStateClass({ opacity: opacity }) as Parameters<typeof this.doc.setGState>[0])
    }
    this.doc.setFontSize(48)
    this.doc.setTextColor(200, 200, 200)

    if (position === 'diagonal') {
      this.doc.text(text, this.pageWidth / 2, this.pageHeight / 2, {
        angle: 45,
        align: 'center',
      })
    } else {
      this.doc.text(text, this.pageWidth / 2, this.pageHeight / 2, {
        align: 'center',
      })
    }

    this.doc.restoreGraphicsState()
  }

  private addFooterToAllPages(): void {
    const margins = this.options.margins || { top: 72, right: 72, bottom: 72, left: 72 }
    const totalPages = this.doc.getNumberOfPages()

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i)

      // Footer line
      this.doc.setDrawColor(this.hexToRgb(this.branding.colors.secondary).r, this.hexToRgb(this.branding.colors.secondary).g, this.hexToRgb(this.branding.colors.secondary).b)
      this.doc.setLineWidth(0.5)
      this.doc.line(margins.left, this.pageHeight - margins.bottom + 20, this.pageWidth - margins.right, this.pageHeight - margins.bottom + 20)

      this.doc.setFontSize(9)
      this.doc.setTextColor(this.hexToRgb(this.branding.colors.secondary).r, this.hexToRgb(this.branding.colors.secondary).g, this.hexToRgb(this.branding.colors.secondary).b)

      // Footer text
      if (this.branding.footer?.text) {
        this.doc.text(this.branding.footer.text, margins.left, this.pageHeight - margins.bottom + 35)
      }

      // Page numbers
      if (this.branding.footer?.includePageNumbers) {
        this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - margins.right, this.pageHeight - margins.bottom + 35, { align: 'right' })
      }
    }
  }

  private getContent(dataKey: string | undefined, artifact: ArtifactPDFData): unknown {
    if (!dataKey) return undefined
    return artifact.content[dataKey]
  }

  private generateFilename(artifact: ArtifactPDFData): string {
    const safeName = artifact.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const date = new Date().toISOString().split('T')[0]
    return `${safeName}_${date}.pdf`
  }

  private truncateText(text: string, maxWidth: number): string {
    const ellipsis = '...'
    let truncated = text

    while (this.doc.getTextWidth(truncated) > maxWidth && truncated.length > 3) {
      truncated = truncated.slice(0, -4) + ellipsis
    }

    return truncated
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Generate a PDF from artifact data
 */
export async function generatePDF(
  artifact: ArtifactPDFData,
  options?: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  const generator = new PDFGenerator(options)
  return generator.generate(artifact)
}

/**
 * Generate multiple PDFs in batch
 */
export async function generateBatchPDF(
  artifacts: ArtifactPDFData[],
  options?: PDFGenerationOptions
): Promise<PDFGenerationResult[]> {
  const results: PDFGenerationResult[] = []

  for (const artifact of artifacts) {
    const result = await generatePDF(artifact, options)
    results.push(result)
  }

  return results
}
