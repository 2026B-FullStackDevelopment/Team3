export function parseDonationPreviewFlag(value) {
  return value === 'true'
}

export const donationPreviewEnabled = parseDonationPreviewFlag(
  import.meta.env.VITE_ENABLE_DONATION_PREVIEW_DATA,
)
