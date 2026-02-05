/**
 * Template Anonymization System (F8.4)
 *
 * Detects and replaces PII in artifact content before saving as templates.
 *
 * User Stories: US-032
 */

import type {
  AnonymizationRule,
  AnonymizationResult,
  AnonymizationReplacement,
} from './types'

// =============================================================================
// Default Anonymization Rules
// =============================================================================

export const DEFAULT_ANONYMIZATION_RULES: AnonymizationRule[] = [
  {
    id: 'email',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    type: 'email',
    replacement: '[EMAIL]',
    isEnabled: true,
  },
  {
    id: 'phone_us',
    pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
    type: 'phone',
    replacement: '[PHONE]',
    isEnabled: true,
  },
  {
    id: 'phone_intl',
    pattern: '\\+\\d{1,3}[-.\\s]?\\d{1,14}',
    type: 'phone',
    replacement: '[PHONE]',
    isEnabled: true,
  },
  {
    id: 'ssn',
    pattern: '\\d{3}-\\d{2}-\\d{4}',
    type: 'custom',
    replacement: '[SSN]',
    isEnabled: true,
  },
  {
    id: 'credit_card',
    pattern: '\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}',
    type: 'custom',
    replacement: '[CARD]',
    isEnabled: true,
  },
  {
    id: 'date_full',
    pattern: '\\b(January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+\\d{4}\\b',
    type: 'custom',
    replacement: '[DATE]',
    isEnabled: true,
  },
  {
    id: 'address_zip',
    pattern: '\\b\\d{5}(-\\d{4})?\\b',
    type: 'address',
    replacement: '[ZIP]',
    isEnabled: true,
  },
  {
    id: 'ip_address',
    pattern: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b',
    type: 'custom',
    replacement: '[IP]',
    isEnabled: true,
  },
  {
    id: 'url',
    pattern: 'https?://[^\\s<>"{}|\\\\^`\\[\\]]+',
    type: 'custom',
    replacement: '[URL]',
    isEnabled: true,
  },
]

// Common company name patterns to detect
const COMPANY_INDICATORS = [
  'Inc\\.?',
  'LLC',
  'Corp\\.?',
  'Corporation',
  'Company',
  'Co\\.?',
  'Ltd\\.?',
  'Limited',
  'Group',
  'Holdings',
  'Partners',
  'Associates',
  'Solutions',
  'Services',
  'Technologies',
  'Enterprises',
]

// Common name titles
const NAME_TITLES = ['Mr\\.?', 'Mrs\\.?', 'Ms\\.?', 'Dr\\.?', 'Prof\\.?']

// =============================================================================
// Anonymization Functions
// =============================================================================

/**
 * Anonymize content using default and custom rules
 */
export function anonymizeContent(
  content: string,
  customRules: AnonymizationRule[] = [],
  options: {
    detectCompanyNames?: boolean
    detectPersonNames?: boolean
    customCompanyNames?: string[]
    customPersonNames?: string[]
  } = {}
): AnonymizationResult {
  const {
    detectCompanyNames = true,
    detectPersonNames = true,
    customCompanyNames = [],
    customPersonNames = [],
  } = options

  let anonymizedContent = content
  const replacements: AnonymizationReplacement[] = []

  // Combine default and custom rules
  const allRules = [...DEFAULT_ANONYMIZATION_RULES, ...customRules]
  const enabledRules = allRules.filter((rule) => rule.isEnabled)

  // Apply each rule
  for (const rule of enabledRules) {
    const regex = new RegExp(rule.pattern, 'gi')
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      // Check if we already have a replacement at this position
      const existingReplacement = replacements.find(
        (r) => r.startIndex <= match!.index && r.endIndex >= match!.index + match![0].length
      )

      if (!existingReplacement) {
        replacements.push({
          original: match[0],
          replacement: rule.replacement,
          type: rule.type,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        })
      }
    }
  }

  // Detect company names
  if (detectCompanyNames) {
    const companyPattern = `\\b[A-Z][a-zA-Z]*(?:\\s+[A-Z][a-zA-Z]*)*\\s+(?:${COMPANY_INDICATORS.join('|')})\\b`
    const companyRegex = new RegExp(companyPattern, 'g')
    let match: RegExpExecArray | null

    while ((match = companyRegex.exec(content)) !== null) {
      if (!replacements.some((r) => r.startIndex === match!.index)) {
        replacements.push({
          original: match[0],
          replacement: '[COMPANY]',
          type: 'company',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        })
      }
    }
  }

  // Add custom company names
  for (const companyName of customCompanyNames) {
    const escapedName = escapeRegex(companyName)
    const regex = new RegExp(`\\b${escapedName}\\b`, 'gi')
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      if (!replacements.some((r) => r.startIndex === match!.index)) {
        replacements.push({
          original: match[0],
          replacement: '[COMPANY]',
          type: 'company',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        })
      }
    }
  }

  // Detect person names (basic pattern - title followed by name)
  if (detectPersonNames) {
    const namePattern = `(?:${NAME_TITLES.join('|')})\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?`
    const nameRegex = new RegExp(namePattern, 'g')
    let match: RegExpExecArray | null

    while ((match = nameRegex.exec(content)) !== null) {
      if (!replacements.some((r) => r.startIndex === match!.index)) {
        replacements.push({
          original: match[0],
          replacement: '[NAME]',
          type: 'name',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        })
      }
    }
  }

  // Add custom person names
  for (const personName of customPersonNames) {
    const escapedName = escapeRegex(personName)
    const regex = new RegExp(`\\b${escapedName}\\b`, 'gi')
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      if (!replacements.some((r) => r.startIndex === match!.index)) {
        replacements.push({
          original: match[0],
          replacement: '[NAME]',
          type: 'name',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        })
      }
    }
  }

  // Sort replacements by position (descending) to replace from end to start
  replacements.sort((a, b) => b.startIndex - a.startIndex)

  // Apply replacements
  for (const replacement of replacements) {
    anonymizedContent =
      anonymizedContent.slice(0, replacement.startIndex) +
      replacement.replacement +
      anonymizedContent.slice(replacement.endIndex)
  }

  // Calculate confidence score based on replacements found
  const confidenceScore = calculateConfidenceScore(replacements, content.length)

  return {
    originalContent: content,
    anonymizedContent,
    replacements: replacements.sort((a, b) => a.startIndex - b.startIndex),
    confidenceScore,
  }
}

/**
 * Preview anonymization without applying
 */
export function previewAnonymization(
  content: string,
  customRules: AnonymizationRule[] = []
): AnonymizationReplacement[] {
  const result = anonymizeContent(content, customRules)
  return result.replacements
}

/**
 * Validate that content is properly anonymized
 */
export function validateAnonymization(content: string): {
  isClean: boolean
  potentialIssues: Array<{ type: string; match: string; position: number }>
} {
  const potentialIssues: Array<{ type: string; match: string; position: number }> = []

  // Check for potential remaining PII
  for (const rule of DEFAULT_ANONYMIZATION_RULES) {
    const regex = new RegExp(rule.pattern, 'gi')
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      // Skip if it's already a placeholder
      if (!match[0].startsWith('[') || !match[0].endsWith(']')) {
        potentialIssues.push({
          type: rule.type,
          match: match[0],
          position: match.index,
        })
      }
    }
  }

  return {
    isClean: potentialIssues.length === 0,
    potentialIssues,
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function calculateConfidenceScore(
  replacements: AnonymizationReplacement[],
  contentLength: number
): number {
  if (replacements.length === 0) return 100

  // Higher confidence if fewer replacements relative to content length
  // and if replacements are mostly high-confidence patterns
  const highConfidenceTypes: AnonymizationReplacement['type'][] = ['email', 'phone']
  const highConfidenceCount = replacements.filter((r) =>
    highConfidenceTypes.includes(r.type)
  ).length

  const totalCharsReplaced = replacements.reduce(
    (sum, r) => sum + r.original.length,
    0
  )
  const replacementRatio = totalCharsReplaced / contentLength

  // Base confidence decreases with more replacements and lower confidence matches
  let confidence = 100
  confidence -= replacementRatio * 30 // Penalize high replacement ratio
  confidence -= (replacements.length - highConfidenceCount) * 2 // Penalize low-confidence matches

  return Math.max(0, Math.min(100, Math.round(confidence)))
}

/**
 * Generate placeholder values for common patterns
 */
export function generatePlaceholders(): Record<string, string> {
  return {
    '[EMAIL]': 'example@company.com',
    '[PHONE]': '(555) 000-0000',
    '[NAME]': 'John Smith',
    '[COMPANY]': 'Acme Corporation',
    '[ADDRESS]': '123 Main Street',
    '[ZIP]': '00000',
    '[DATE]': 'January 1, 2025',
    '[SSN]': '000-00-0000',
    '[CARD]': '0000-0000-0000-0000',
    '[IP]': '0.0.0.0',
    '[URL]': 'https://example.com',
  }
}
