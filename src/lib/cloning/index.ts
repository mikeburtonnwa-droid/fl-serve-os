/**
 * Engagement Cloning Module Exports (E9)
 */

// Types
export * from './types'

// Field Processing
export {
  identifyClientFields,
  identifyPreservableFields,
  clearClientFields,
  processArtifactForClone,
  getFieldDefinitionsForTemplate,
  getFieldActionSummary,
} from './field-processor'
