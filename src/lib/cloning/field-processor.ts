/**
 * Field Processor for Engagement Cloning (F9.3)
 *
 * Handles the identification and clearing of client-specific fields
 * while preserving process and methodology data.
 *
 * User Stories: US-034
 */

import {
  CLIENT_SENSITIVE_FIELDS,
  PRESERVABLE_FIELDS,
  type FieldDefinition,
} from './types'

// =============================================================================
// Field Identification
// =============================================================================

/**
 * Identifies client-sensitive fields in artifact content
 */
export function identifyClientFields(
  content: Record<string, unknown>,
  templateId?: string
): string[] {
  const clientFields: string[] = []

  // Get fields that apply to this template
  const applicableFields = templateId
    ? CLIENT_SENSITIVE_FIELDS.filter(
        (f) => f.templateIds.includes(templateId) || f.templateIds.length === 0
      )
    : CLIENT_SENSITIVE_FIELDS

  // Check which fields exist in the content
  for (const field of applicableFields) {
    if (content[field.id] !== undefined && content[field.id] !== null) {
      clientFields.push(field.id)
    }
  }

  // Also check for fields matching common patterns
  const clientPatterns = [
    /company/i,
    /client/i,
    /stakeholder/i,
    /contact/i,
    /budget/i,
    /testimonial/i,
    /name$/i,
  ]

  for (const key of Object.keys(content)) {
    if (clientPatterns.some((pattern) => pattern.test(key))) {
      if (!clientFields.includes(key)) {
        clientFields.push(key)
      }
    }
  }

  return clientFields
}

/**
 * Identifies preservable process/methodology fields
 */
export function identifyPreservableFields(
  content: Record<string, unknown>,
  templateId?: string
): string[] {
  const preservableFields: string[] = []

  // Get fields that apply to this template
  const applicableFields = templateId
    ? PRESERVABLE_FIELDS.filter(
        (f) => f.templateIds.includes(templateId) || f.templateIds.length === 0
      )
    : PRESERVABLE_FIELDS

  // Check which fields exist in the content
  for (const field of applicableFields) {
    if (content[field.id] !== undefined && content[field.id] !== null) {
      preservableFields.push(field.id)
    }
  }

  // Also check for fields matching process patterns
  const processPatterns = [
    /process/i,
    /workflow/i,
    /criteria/i,
    /automation/i,
    /phase/i,
    /implementation/i,
    /technical/i,
    /integration/i,
  ]

  for (const key of Object.keys(content)) {
    if (processPatterns.some((pattern) => pattern.test(key))) {
      if (!preservableFields.includes(key)) {
        preservableFields.push(key)
      }
    }
  }

  return preservableFields
}

// =============================================================================
// Field Processing
// =============================================================================

/**
 * Clears client-specific fields from content
 */
export function clearClientFields(
  content: Record<string, unknown>,
  fieldsToClear?: string[]
): {
  processedContent: Record<string, unknown>
  clearedFields: string[]
  preservedFields: string[]
} {
  const processedContent = { ...content }
  const clearedFields: string[] = []
  const preservedFields: string[] = []

  // If specific fields provided, clear only those
  if (fieldsToClear && fieldsToClear.length > 0) {
    for (const field of fieldsToClear) {
      if (processedContent[field] !== undefined) {
        processedContent[field] = ''
        clearedFields.push(field)
      }
    }

    // Mark all other fields as preserved
    for (const key of Object.keys(content)) {
      if (!fieldsToClear.includes(key)) {
        preservedFields.push(key)
      }
    }
  } else {
    // Auto-detect and clear client fields
    const clientFields = identifyClientFields(content)

    for (const field of clientFields) {
      processedContent[field] = ''
      clearedFields.push(field)
    }

    // Mark non-client fields as preserved
    for (const key of Object.keys(content)) {
      if (!clientFields.includes(key)) {
        preservedFields.push(key)
      }
    }
  }

  return {
    processedContent,
    clearedFields,
    preservedFields,
  }
}

/**
 * Processes artifact content for cloning
 */
export function processArtifactForClone(
  artifact: {
    id: string
    name: string
    type: string
    content: string | Record<string, unknown>
    metadata?: Record<string, unknown>
  },
  clearClientData: boolean,
  specificFieldsToClear?: string[]
): {
  processedArtifact: {
    name: string
    type: string
    content: string | Record<string, unknown>
    metadata?: Record<string, unknown>
  }
  clearedFields: string[]
  preservedFields: string[]
} {
  let content = artifact.content
  let clearedFields: string[] = []
  let preservedFields: string[] = []

  // Parse content if it's a string (JSON)
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content) as Record<string, unknown>
    } catch {
      // Not JSON, treat as raw text
      // For raw text, we can do simple pattern replacement
      const textContent = content as string
      const processedText = clearClientData
        ? clearClientPatternsFromText(textContent)
        : textContent

      if (clearClientData) {
        clearedFields.push('text_content')
      }

      return {
        processedArtifact: {
          name: artifact.name,
          type: artifact.type,
          content: processedText,
          metadata: artifact.metadata,
        },
        clearedFields,
        preservedFields: ['text_content'],
      }
    }
  }

  // Process structured content
  if (clearClientData && typeof content === 'object' && content !== null) {
    const result = clearClientFields(
      content as Record<string, unknown>,
      specificFieldsToClear
    )
    content = result.processedContent
    clearedFields = result.clearedFields
    preservedFields = result.preservedFields
  } else if (typeof content === 'object' && content !== null) {
    // Not clearing, but still identify for reporting
    clearedFields = []
    preservedFields = Object.keys(content)
  }

  return {
    processedArtifact: {
      name: artifact.name,
      type: artifact.type,
      content,
      metadata: {
        ...artifact.metadata,
        clonedFrom: artifact.id,
        clonedAt: new Date().toISOString(),
      },
    },
    clearedFields,
    preservedFields,
  }
}

// =============================================================================
// Text Processing
// =============================================================================

/**
 * Clears client-specific patterns from raw text content
 */
function clearClientPatternsFromText(text: string): string {
  let processed = text

  // Clear email addresses
  processed = processed.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL]'
  )

  // Clear phone numbers
  processed = processed.replace(
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    '[PHONE]'
  )

  // Clear common company patterns (Inc., LLC, etc.)
  processed = processed.replace(
    /\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\s+(?:Inc\.?|LLC|Corp\.?|Ltd\.?)\b/g,
    '[COMPANY]'
  )

  return processed
}

// =============================================================================
// Field Definition Helpers
// =============================================================================

/**
 * Gets all field definitions for a template
 */
export function getFieldDefinitionsForTemplate(
  templateId: string
): FieldDefinition[] {
  const clientFields = CLIENT_SENSITIVE_FIELDS.filter(
    (f) => f.templateIds.includes(templateId) || f.templateIds.length === 0
  )
  const preservableFields = PRESERVABLE_FIELDS.filter(
    (f) => f.templateIds.includes(templateId) || f.templateIds.length === 0
  )

  return [...clientFields, ...preservableFields]
}

/**
 * Gets a summary of field actions for preview
 */
export function getFieldActionSummary(
  content: Record<string, unknown>,
  templateId?: string
): {
  willClear: FieldDefinition[]
  willPreserve: FieldDefinition[]
  unknown: string[]
} {
  const clientFields = identifyClientFields(content, templateId)
  const preservableFields = identifyPreservableFields(content, templateId)

  const willClear = CLIENT_SENSITIVE_FIELDS.filter((f) =>
    clientFields.includes(f.id)
  )
  const willPreserve = PRESERVABLE_FIELDS.filter((f) =>
    preservableFields.includes(f.id)
  )

  // Find fields that don't match any known definition
  const knownFieldIds = [
    ...CLIENT_SENSITIVE_FIELDS.map((f) => f.id),
    ...PRESERVABLE_FIELDS.map((f) => f.id),
  ]
  const unknown = Object.keys(content).filter((k) => !knownFieldIds.includes(k))

  return { willClear, willPreserve, unknown }
}
