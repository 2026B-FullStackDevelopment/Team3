import { MeasurementUnit, UNIT_LABELS } from '@/features/donation/models/donation.js'

const INVALID_VALUE = '—'
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

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
