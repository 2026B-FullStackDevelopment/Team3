import { MeasurementUnit, UNIT_LABELS } from '@/lib/donation.js'

const INVALID_VALUE = '—'
const vndFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function validDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatVnd(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `${vndFormatter.format(amount)} vnđ` : INVALID_VALUE
}

export function formatDate(value) {
  const date = validDate(value)
  return date ? dateFormatter.format(date) : INVALID_VALUE
}

export function formatDateTime(value) {
  const date = validDate(value)
  return date ? dateTimeFormatter.format(date) : INVALID_VALUE
}

export function formatQuantity(value, unit) {
  const quantity = Number(value)
  if (!Number.isFinite(quantity)) return INVALID_VALUE
  if (unit === MeasurementUnit.UNIT) return String(Math.trunc(quantity))
  return numberFormatter.format(quantity)
}

export function formatMeasurementUnit(unit) {
  return UNIT_LABELS[unit] ?? INVALID_VALUE
}

export function formatQuantityWithUnit(value, unit) {
  const quantity = formatQuantity(value, unit)
  if (quantity === INVALID_VALUE) return quantity

  if (unit === MeasurementUnit.UNIT) {
    return `${quantity} ${Number(value) === 1 ? 'unit' : 'units'}`
  }
  if (unit === MeasurementUnit.PER_REQUEST) return `${quantity} per request`
  return `${quantity} ${unit}`
}

export function calculatePercentage(value, total) {
  const numerator = Number(value)
  const denominator = Number(total)
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0
  }
  return Math.min(100, Math.max(0, (numerator / denominator) * 100))
}
