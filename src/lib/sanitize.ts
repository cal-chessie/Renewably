// ============================================================================
// RENEWABLY.IE — Input Sanitization Utilities
// ============================================================================
// Deep sanitizes objects before database persistence to prevent stored XSS,
// remove dangerous HTML/script content, and strip unexpected types.
// ============================================================================

/**
 * Recursively sanitize an object for safe database persistence.
 * - Trims strings and removes null bytes
 * - Strips HTML/script tags from strings
 * - Converts non-string primitives where appropriate
 * - Removes unknown keys (only allows string, number, boolean, null, arrays, plain objects)
 * - Returns a new object (does not mutate)
 */
export function sanitizeObject<T = Record<string, unknown>>(input: unknown): T {
  if (input === null || input === undefined) {
    return {} as T
  }

  // If it's a plain object, sanitize each key/value
  if (typeof input === 'object' && !Array.isArray(input)) {
    // Handle Date instances — keep as-is (Prisma handles these)
    if (input instanceof Date) {
      return input as unknown as T
    }

    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      // Only allow string keys (no prototype pollution)
      if (typeof key !== 'string') continue
      // Skip __proto__ and constructor keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue

      sanitized[key] = sanitizeValue(value)
    }
    return sanitized as T
  }

  // If it's an array, sanitize each element
  if (Array.isArray(input)) {
    return input.map(sanitizeValue) as unknown as T
  }

  // For primitives, sanitize directly
  return sanitizeValue(input) as unknown as T
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }

  switch (typeof value) {
    case 'string':
      return sanitizeString(value)
    case 'number':
      return Number.isFinite(value) ? value : null
    case 'boolean':
      return value
    case 'object':
      if (value instanceof Date) return value
      if (Array.isArray(value)) {
        return value.map(sanitizeValue)
      }
      if (Object.prototype.toString.call(value) === '[object Object]') {
        return sanitizeObject(value)
      }
      // Discard other object types (e.g., RegExp, Map, Set)
      return null
    default:
      return null
  }
}

function sanitizeString(str: string): string {
  // Remove null bytes
  let sanitized = str.replace(/\0/g, '')
  // Trim whitespace
  sanitized = sanitized.trim()
  // Strip HTML/script tags (basic protection)
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?(?:script|iframe|object|embed|form|input|textarea|select|button|link|style|meta|base)\b[^>]*>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*\S+/gi, '')
  return sanitized
}

/**
 * Sanitize a single string value (e.g., for query parameters, form fields).
 */
export function sanitizeStringField(input: unknown, maxLength = 10000): string {
  if (typeof input !== 'string') return ''
  let sanitized = sanitizeString(input)
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength)
  }
  return sanitized
}
