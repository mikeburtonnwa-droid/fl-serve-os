/**
 * Version Diff Utilities (F5.3)
 *
 * Provides comparison and diff functionality for artifact versions.
 * Supports field-level and word-level diffing.
 *
 * User Stories: US-022
 */

import type { FieldDiff, VersionDiff, DiffType } from './types'

// =============================================================================
// Word-Level Diff Algorithm
// =============================================================================

interface WordDiffSegment {
  type: 'added' | 'removed' | 'unchanged'
  value: string
}

/**
 * Compute word-level diff between two strings
 * Uses a simplified LCS (Longest Common Subsequence) approach
 */
export function computeWordDiff(oldText: string, newText: string): WordDiffSegment[] {
  if (!oldText && !newText) return []
  if (!oldText) return [{ type: 'added', value: newText }]
  if (!newText) return [{ type: 'removed', value: oldText }]

  const oldWords = tokenize(oldText)
  const newWords = tokenize(newText)

  // Simple diff using LCS
  const lcs = longestCommonSubsequence(oldWords, newWords)
  const result: WordDiffSegment[] = []

  let oldIdx = 0
  let newIdx = 0
  let lcsIdx = 0

  while (oldIdx < oldWords.length || newIdx < newWords.length) {
    // Check if current words match the LCS
    if (
      lcsIdx < lcs.length &&
      oldIdx < oldWords.length &&
      newIdx < newWords.length &&
      oldWords[oldIdx] === lcs[lcsIdx] &&
      newWords[newIdx] === lcs[lcsIdx]
    ) {
      // Unchanged word
      result.push({ type: 'unchanged', value: oldWords[oldIdx] })
      oldIdx++
      newIdx++
      lcsIdx++
    } else {
      // Check for removed words (in old but not matching LCS)
      if (
        oldIdx < oldWords.length &&
        (lcsIdx >= lcs.length || oldWords[oldIdx] !== lcs[lcsIdx])
      ) {
        result.push({ type: 'removed', value: oldWords[oldIdx] })
        oldIdx++
      }
      // Check for added words (in new but not matching LCS)
      else if (
        newIdx < newWords.length &&
        (lcsIdx >= lcs.length || newWords[newIdx] !== lcs[lcsIdx])
      ) {
        result.push({ type: 'added', value: newWords[newIdx] })
        newIdx++
      }
    }
  }

  // Merge adjacent segments of the same type
  return mergeAdjacentSegments(result)
}

/**
 * Tokenize text into words, preserving whitespace information
 */
function tokenize(text: string): string[] {
  // Split on whitespace but keep the structure
  return text.split(/(\s+)/).filter(Boolean)
}

/**
 * Find longest common subsequence of two arrays
 */
function longestCommonSubsequence(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length
  const n = arr2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  // Build the LCS table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find the LCS
  const lcs: string[] = []
  let i = m
  let j = n

  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1])
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return lcs
}

/**
 * Merge adjacent segments of the same type
 */
function mergeAdjacentSegments(segments: WordDiffSegment[]): WordDiffSegment[] {
  if (segments.length === 0) return []

  const merged: WordDiffSegment[] = []
  let current = { ...segments[0] }

  for (let i = 1; i < segments.length; i++) {
    if (segments[i].type === current.type) {
      current.value += segments[i].value
    } else {
      merged.push(current)
      current = { ...segments[i] }
    }
  }
  merged.push(current)

  return merged
}

// =============================================================================
// Field-Level Diff
// =============================================================================

/**
 * Compare two artifact content objects and generate field-level diff
 */
export function compareVersions(
  oldContent: Record<string, unknown>,
  newContent: Record<string, unknown>,
  oldName: string,
  newName: string,
  fieldLabels: Record<string, string> = {}
): VersionDiff {
  const fieldChanges: FieldDiff[] = []
  const allFieldIds = new Set([
    ...Object.keys(oldContent || {}),
    ...Object.keys(newContent || {}),
  ])

  let addedFields = 0
  let removedFields = 0
  let modifiedFields = 0

  for (const fieldId of allFieldIds) {
    const oldValue = oldContent?.[fieldId]
    const newValue = newContent?.[fieldId]
    const fieldLabel = fieldLabels[fieldId] || fieldId

    // Determine diff type
    let type: DiffType
    if (oldValue === undefined && newValue !== undefined) {
      type = 'added'
      addedFields++
    } else if (oldValue !== undefined && newValue === undefined) {
      type = 'removed'
      removedFields++
    } else if (!deepEqual(oldValue, newValue)) {
      type = 'modified'
      modifiedFields++
    } else {
      type = 'unchanged'
    }

    // Skip unchanged fields in the diff output
    if (type === 'unchanged') continue

    const fieldDiff: FieldDiff = {
      fieldId,
      fieldLabel,
      type,
      oldValue,
      newValue,
    }

    // Add word-level diff for text fields
    if (
      type === 'modified' &&
      typeof oldValue === 'string' &&
      typeof newValue === 'string'
    ) {
      fieldDiff.textDiff = computeWordDiff(oldValue, newValue)
    }

    fieldChanges.push(fieldDiff)
  }

  // Sort: added first, then modified, then removed
  fieldChanges.sort((a, b) => {
    const order: Record<DiffType, number> = {
      added: 0,
      modified: 1,
      removed: 2,
      unchanged: 3,
    }
    return order[a.type] - order[b.type]
  })

  return {
    versionFrom: 0, // Will be set by caller
    versionTo: 0, // Will be set by caller
    nameChanged: oldName !== newName,
    nameDiff: oldName !== newName ? { oldName, newName } : undefined,
    fieldChanges,
    totalChanges: addedFields + removedFields + modifiedFields,
    addedFields,
    removedFields,
    modifiedFields,
  }
}

/**
 * Deep equality check for any value
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false

  if (typeof a === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      return a.every((item, index) => deepEqual(item, b[index]))
    }

    if (Array.isArray(a) || Array.isArray(b)) return false

    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)

    if (aKeys.length !== bKeys.length) return false

    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]))
  }

  return false
}

// =============================================================================
// Diff Display Helpers
// =============================================================================

/**
 * Format a value for display in diff view
 */
export function formatValueForDisplay(value: unknown): string {
  if (value === null || value === undefined) return '(empty)'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

/**
 * Get a summary of changes for display
 */
export function getChangeSummary(diff: VersionDiff): string {
  const parts: string[] = []

  if (diff.nameChanged) {
    parts.push('name changed')
  }
  if (diff.addedFields > 0) {
    parts.push(`${diff.addedFields} field${diff.addedFields > 1 ? 's' : ''} added`)
  }
  if (diff.modifiedFields > 0) {
    parts.push(`${diff.modifiedFields} field${diff.modifiedFields > 1 ? 's' : ''} modified`)
  }
  if (diff.removedFields > 0) {
    parts.push(`${diff.removedFields} field${diff.removedFields > 1 ? 's' : ''} removed`)
  }

  if (parts.length === 0) {
    return 'No changes'
  }

  return parts.join(', ')
}
