import { PASSWORD_RULES } from '@/config/constants.js'

/**
 * Shared frontend validation rules (SRS requires frontend validation with clear
 * messages). These mirror the backend; the backend remains the security boundary.
 */

export function isValidEmail(value) {
  if (typeof value !== 'string') return false
  if (value.length > 254) return false
  // Exactly one '@', no spaces, non-empty local and domain parts.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** Returns a list of unmet password rules; empty means valid. */
export function checkPasswordRules(value = '') {
  const failed = []
  if (value.length < PASSWORD_RULES.minLength) failed.push('minLength')
  if (PASSWORD_RULES.requireNumber && !/\d/.test(value)) failed.push('requireNumber')
  if (PASSWORD_RULES.requireSpecial && !/[^A-Za-z0-9]/.test(value)) failed.push('requireSpecial')
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(value)) failed.push('requireUppercase')
  return failed
}

/** Tax code: 10–13 digits (donor registration). */
export function isValidTaxCode(value) {
  return /^\d{10,13}$/.test(String(value ?? ''))
}
