/**
 * AI-to-Template Field Mapper (F2.1)
 *
 * Intelligently maps AI-generated suggestions to template fields with:
 * - Type coercion (string to number, etc.)
 * - Fuzzy matching for select options
 * - Validation for required fields
 * - Warning generation for manual review
 *
 * User Stories: US-006, US-007, US-008
 */

import { TemplateField, Template, getTemplate } from './templates'
import { TemplateId } from './workflow'

// =============================================================================
// Types
// =============================================================================

export interface FieldMappingResult {
  fieldId: string
  fieldName: string
  originalValue: unknown
  mappedValue: unknown
  wasCoerced: boolean
  coercionType?: 'string_to_number' | 'number_to_string' | 'fuzzy_match' | 'array_join' | 'boolean_parse'
  warning?: string
  isValid: boolean
  errorMessage?: string
}

export interface MappingResult {
  templateId: TemplateId
  isValid: boolean
  mappedContent: Record<string, unknown>
  fieldResults: FieldMappingResult[]
  missingRequired: string[]
  warnings: string[]
  errors: string[]
}

export interface MappingOptions {
  strictMode?: boolean  // If true, don't auto-coerce values
  fuzzyThreshold?: number  // 0-1 threshold for fuzzy matching (default 0.6)
}

// =============================================================================
// Fuzzy String Matching
// =============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1

  const maxLen = Math.max(s1.length, s2.length)
  if (maxLen === 0) return 1

  const distance = levenshteinDistance(s1, s2)
  return 1 - distance / maxLen
}

/**
 * Find best matching option for a value
 */
function findBestMatch(
  value: string,
  options: string[],
  threshold: number = 0.6
): { match: string | null; similarity: number; isExact: boolean } {
  const normalizedValue = value.toLowerCase().trim()

  // Check for exact match first
  const exactMatch = options.find(opt => opt.toLowerCase().trim() === normalizedValue)
  if (exactMatch) {
    return { match: exactMatch, similarity: 1, isExact: true }
  }

  // Check for contains match
  const containsMatch = options.find(opt =>
    opt.toLowerCase().includes(normalizedValue) ||
    normalizedValue.includes(opt.toLowerCase())
  )
  if (containsMatch) {
    return { match: containsMatch, similarity: 0.9, isExact: false }
  }

  // Fuzzy match
  let bestMatch: string | null = null
  let bestSimilarity = 0

  for (const option of options) {
    const similarity = stringSimilarity(value, option)
    if (similarity > bestSimilarity && similarity >= threshold) {
      bestSimilarity = similarity
      bestMatch = option
    }
  }

  return { match: bestMatch, similarity: bestSimilarity, isExact: false }
}

// =============================================================================
// Type Coercion
// =============================================================================

/**
 * Coerce a value to the expected field type
 */
function coerceValue(
  value: unknown,
  field: TemplateField,
  options: MappingOptions
): { value: unknown; coerced: boolean; coercionType?: FieldMappingResult['coercionType']; warning?: string } {
  if (value === null || value === undefined) {
    return { value: null, coerced: false }
  }

  const threshold = options.fuzzyThreshold ?? 0.6

  switch (field.type) {
    case 'number': {
      if (typeof value === 'number') {
        return { value, coerced: false }
      }
      if (typeof value === 'string') {
        // Remove common non-numeric characters
        const cleaned = value.replace(/[$,\s%]/g, '')
        const parsed = parseFloat(cleaned)
        if (!isNaN(parsed)) {
          return {
            value: parsed,
            coerced: true,
            coercionType: 'string_to_number',
            warning: `Converted "${value}" to ${parsed}`
          }
        }
      }
      return {
        value: null,
        coerced: false,
        warning: `Could not convert "${value}" to number`
      }
    }

    case 'text':
    case 'textarea':
    case 'rich_text': {
      if (typeof value === 'string') {
        return { value: value.trim(), coerced: false }
      }
      if (typeof value === 'number') {
        return {
          value: String(value),
          coerced: true,
          coercionType: 'number_to_string'
        }
      }
      if (Array.isArray(value)) {
        return {
          value: value.join('\n'),
          coerced: true,
          coercionType: 'array_join',
          warning: `Joined array of ${value.length} items into text`
        }
      }
      if (typeof value === 'object') {
        return {
          value: JSON.stringify(value, null, 2),
          coerced: true,
          warning: 'Converted object to JSON string'
        }
      }
      return { value: String(value), coerced: true, coercionType: 'number_to_string' }
    }

    case 'select': {
      if (!field.options || field.options.length === 0) {
        return { value, coerced: false }
      }

      const stringValue = String(value).trim()
      const { match, similarity, isExact } = findBestMatch(stringValue, field.options, threshold)

      if (match) {
        if (isExact) {
          return { value: match, coerced: false }
        }
        return {
          value: match,
          coerced: true,
          coercionType: 'fuzzy_match',
          warning: `AI suggested "${value}", mapped to closest match "${match}" (${Math.round(similarity * 100)}% match)`
        }
      }

      // No good match found
      return {
        value: null,
        coerced: false,
        warning: `"${value}" does not match any option. Available: ${field.options.join(', ')}`
      }
    }

    case 'multiselect': {
      if (!field.options || field.options.length === 0) {
        return { value, coerced: false }
      }

      // Handle array input
      let values: string[] = []
      if (Array.isArray(value)) {
        values = value.map(v => String(v).trim())
      } else if (typeof value === 'string') {
        // Split by common delimiters
        values = value.split(/[,;|\n]/).map(v => v.trim()).filter(Boolean)
      } else {
        return { value: [], coerced: false, warning: 'Could not parse multiselect value' }
      }

      const mappedValues: string[] = []
      const warnings: string[] = []

      for (const v of values) {
        const { match, isExact } = findBestMatch(v, field.options, threshold)
        if (match) {
          if (!mappedValues.includes(match)) {
            mappedValues.push(match)
            if (!isExact) {
              warnings.push(`"${v}" → "${match}"`)
            }
          }
        } else {
          warnings.push(`"${v}" not matched`)
        }
      }

      return {
        value: mappedValues,
        coerced: warnings.length > 0,
        coercionType: warnings.length > 0 ? 'fuzzy_match' : undefined,
        warning: warnings.length > 0 ? `Multiselect mapping: ${warnings.join(', ')}` : undefined
      }
    }

    case 'checkbox': {
      if (typeof value === 'boolean') {
        return { value, coerced: false }
      }
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim()
        if (['true', 'yes', '1', 'on', 'checked'].includes(lower)) {
          return { value: true, coerced: true, coercionType: 'boolean_parse' }
        }
        if (['false', 'no', '0', 'off', 'unchecked'].includes(lower)) {
          return { value: false, coerced: true, coercionType: 'boolean_parse' }
        }
      }
      if (typeof value === 'number') {
        return { value: value !== 0, coerced: true, coercionType: 'boolean_parse' }
      }
      return { value: null, coerced: false, warning: `Could not parse "${value}" as boolean` }
    }

    case 'date': {
      if (typeof value === 'string') {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return { value: date.toISOString().split('T')[0], coerced: false }
        }
      }
      if (value instanceof Date) {
        return { value: value.toISOString().split('T')[0], coerced: false }
      }
      return { value: null, coerced: false, warning: `Could not parse "${value}" as date` }
    }

    default:
      return { value, coerced: false }
  }
}

// =============================================================================
// Main Mapping Function
// =============================================================================

/**
 * Map AI suggestion content to template fields
 */
export function mapAISuggestionToTemplate(
  templateId: TemplateId,
  suggestedContent: Record<string, unknown>,
  options: MappingOptions = {}
): MappingResult {
  const template = getTemplate(templateId)

  if (!template) {
    return {
      templateId,
      isValid: false,
      mappedContent: {},
      fieldResults: [],
      missingRequired: [],
      warnings: [],
      errors: [`Template ${templateId} not found`]
    }
  }

  const fieldResults: FieldMappingResult[] = []
  const mappedContent: Record<string, unknown> = {}
  const missingRequired: string[] = []
  const warnings: string[] = []
  const errors: string[] = []

  // Process each template field
  for (const field of template.fields) {
    // Find the value in suggestion (check both id and name)
    let originalValue = suggestedContent[field.id] ?? suggestedContent[field.name]

    // Also check for camelCase/snake_case variations
    if (originalValue === undefined) {
      const camelKey = field.id.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      const snakeKey = field.id.replace(/([A-Z])/g, '_$1').toLowerCase()
      originalValue = suggestedContent[camelKey] ?? suggestedContent[snakeKey]
    }

    // Check if field is missing
    if (originalValue === undefined || originalValue === null || originalValue === '') {
      if (field.required) {
        missingRequired.push(field.id)
        fieldResults.push({
          fieldId: field.id,
          fieldName: field.name,
          originalValue: undefined,
          mappedValue: null,
          wasCoerced: false,
          isValid: false,
          errorMessage: `Required field "${field.label}" not provided by AI`
        })
      } else {
        fieldResults.push({
          fieldId: field.id,
          fieldName: field.name,
          originalValue: undefined,
          mappedValue: null,
          wasCoerced: false,
          isValid: true
        })
      }
      continue
    }

    // Coerce the value
    const coercionResult = coerceValue(originalValue, field, options)

    const fieldResult: FieldMappingResult = {
      fieldId: field.id,
      fieldName: field.name,
      originalValue,
      mappedValue: coercionResult.value,
      wasCoerced: coercionResult.coerced,
      coercionType: coercionResult.coercionType,
      warning: coercionResult.warning,
      isValid: coercionResult.value !== null || !field.required,
    }

    if (!fieldResult.isValid) {
      fieldResult.errorMessage = `Invalid value for "${field.label}"`
      errors.push(fieldResult.errorMessage)
    }

    if (coercionResult.warning) {
      warnings.push(`${field.label}: ${coercionResult.warning}`)
    }

    fieldResults.push(fieldResult)

    if (coercionResult.value !== null) {
      mappedContent[field.id] = coercionResult.value
    }
  }

  // Check for extra fields in suggestion that don't match template
  const templateFieldIds = new Set(template.fields.map(f => f.id))
  const templateFieldNames = new Set(template.fields.map(f => f.name))

  for (const key of Object.keys(suggestedContent)) {
    if (!templateFieldIds.has(key) && !templateFieldNames.has(key)) {
      // Check camelCase/snake_case variations
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()

      if (!templateFieldIds.has(camelKey) && !templateFieldIds.has(snakeKey)) {
        warnings.push(`AI provided extra field "${key}" that doesn't exist in template`)
      }
    }
  }

  const isValid = missingRequired.length === 0 && errors.length === 0

  return {
    templateId,
    isValid,
    mappedContent,
    fieldResults,
    missingRequired,
    warnings,
    errors
  }
}

/**
 * Validate if a mapped result can be used to create an artifact
 */
export function canCreateArtifact(result: MappingResult): {
  canCreate: boolean
  blockers: string[]
  warnings: string[]
} {
  const blockers: string[] = []

  if (result.missingRequired.length > 0) {
    blockers.push(`Missing required fields: ${result.missingRequired.join(', ')}`)
  }

  if (result.errors.length > 0) {
    blockers.push(...result.errors)
  }

  return {
    canCreate: blockers.length === 0,
    blockers,
    warnings: result.warnings
  }
}

/**
 * Get a summary of the mapping for display
 */
export function getMappingSummary(result: MappingResult): {
  totalFields: number
  mappedFields: number
  coercedFields: number
  missingFields: number
  invalidFields: number
} {
  const mapped = result.fieldResults.filter(f => f.mappedValue !== null)
  const coerced = result.fieldResults.filter(f => f.wasCoerced)
  const missing = result.fieldResults.filter(f => f.mappedValue === null)
  const invalid = result.fieldResults.filter(f => !f.isValid)

  return {
    totalFields: result.fieldResults.length,
    mappedFields: mapped.length,
    coercedFields: coerced.length,
    missingFields: missing.length,
    invalidFields: invalid.length
  }
}
