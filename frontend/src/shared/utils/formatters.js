const INVALID_VALUE = '—'
const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
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
  if (value === null || value === undefined || value === '') return INVALID_VALUE
  const amount = Number(value)
  return Number.isFinite(amount) ? vndFormatter.format(amount) : INVALID_VALUE
}

export function vndToUsd(value, rate = 25000) {
  const amount = Number(value)
  const exchangeRate = Number(rate)
  if (!Number.isFinite(amount) || !Number.isFinite(exchangeRate) || exchangeRate <= 0) return 0
  return Math.round((amount / exchangeRate) * 100) / 100
}

export function formatDate(value) {
  const date = validDate(value)
  return date ? dateFormatter.format(date) : INVALID_VALUE
}

export function formatShortDate(value) {
  const date = validDate(value)
  return date ? shortDateFormatter.format(date) : INVALID_VALUE
}

export function formatDateTime(value) {
  const date = validDate(value)
  return date ? dateTimeFormatter.format(date) : INVALID_VALUE
}

export function calculatePercentage(value, total) {
  const numerator = Number(value)
  const denominator = Number(total)
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0
  return Math.min(100, Math.max(0, (numerator / denominator) * 100))
}
