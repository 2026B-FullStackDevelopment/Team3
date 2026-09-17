import { PASSWORD_RULES } from '@/config/constants.js'

/**
 * Shared frontend validation rules (SRS requires frontend validation with clear
 * messages). These mirror the backend; the backend remains the security boundary.
 */

// Mirror the backend (auth.helper.js): rejected regardless of the general shape.
const PROHIBITED_EMAIL_CHARS = ['(', ')', ';', ':']

export function isValidEmail(value) {
  if (typeof value !== 'string') return false
  // Total length must be < 255 (SRS 1A.2.2c / 1B.2.2c).
  if (value.length >= 255) return false
  // No prohibited characters (SRS 1A.2.2d / 1B.2.2d).
  if (PROHIBITED_EMAIL_CHARS.some((ch) => value.includes(ch))) return false
  // Exactly one '@', a '.' after '@', no spaces, non-empty local and domain parts.
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

// Company name: Vietnamese letters, digits, space and hyphen (SRS 1B.2.3).
// Mirrors the backend COMPANY_NAME_RE (validators.helper.js) exactly.
const COMPANY_NAME_RE =
  /^[a-zA-Z0-9 àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ-]+$/u

export function isValidCompanyName(value) {
  return COMPANY_NAME_RE.test(String(value ?? '').trim())
}
