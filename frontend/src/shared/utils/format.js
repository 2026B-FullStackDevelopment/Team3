/** Display formatters shared across features. */

const vndFormatter = new Intl.NumberFormat('vi-VN')

/** 245000 -> "245,000 ₫". Pass free=true or a null/0 amount for free listings. */
export function formatVND(amount) {
  if (amount === null || amount === undefined) return '—'
  return `${vndFormatter.format(amount)} ₫`
}

/** Rough VND→USD helper for display only (wallet shows "≈ x USD"). */
export function vndToUsd(amount, rate = 25000) {
  if (!amount) return 0
  return Math.round((amount / rate) * 100) / 100
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
})

/** ISO string or Date -> "22 Jul". */
export function formatShortDate(value) {
  if (!value) return '—'
  return dateFormatter.format(new Date(value))
}
