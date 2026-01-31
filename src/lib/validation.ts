// Form validation utilities

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
}

export interface FieldError {
  field: string
  message: string
}

export function validateField(value: string, rules: ValidationRule, fieldName: string): string | null {
  if (rules.required && (!value || value.trim() === '')) {
    return `${fieldName} is required`
  }

  if (value && rules.minLength && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`
  }

  if (value && rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName} must be less than ${rules.maxLength} characters`
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    return `${fieldName} is invalid`
  }

  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

export function validateForm(
  values: Record<string, string>,
  schema: Record<string, ValidationRule>
): FieldError[] {
  const errors: FieldError[] = []

  for (const [field, rules] of Object.entries(schema)) {
    const value = values[field] || ''
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')
    const error = validateField(value, rules, fieldName)
    if (error) {
      errors.push({ field, message: error })
    }
  }

  return errors
}

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-+()]{10,}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
}

// Pre-built validation schemas
export const clientSchema: Record<string, ValidationRule> = {
  name: { required: true, minLength: 2, maxLength: 100 },
  industry: { required: true },
  contactEmail: { pattern: patterns.email },
  contactPhone: { pattern: patterns.phone },
}

export const engagementSchema: Record<string, ValidationRule> = {
  name: { required: true, minLength: 2, maxLength: 200 },
  clientId: { required: true },
}

export const artifactSchema: Record<string, ValidationRule> = {
  name: { required: true, minLength: 2, maxLength: 200 },
  templateId: { required: true },
  engagementId: { required: true },
}
