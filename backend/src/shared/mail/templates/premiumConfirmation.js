/**
 * Pure builder for the premium payment confirmation email. No I/O — returns the
 * subject, html, and plaintext bodies for the mailer to send.
 *
 * @param {{ premiumExpiryDate: Date, amountVnd: number }} params
 * @returns {{ subject: string, html: string, text: string }}
 */
export function premiumConfirmationEmail({ premiumExpiryDate, amountVnd }) {
  const subject = "Your AFF Premium subscription is active";

  const amount = amountVnd.toLocaleString("en-US"); // e.g. "125,000"
  const expiry = new Date(premiumExpiryDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const text = [
    "Thanks for subscribing to AFF Premium!",
    "",
    `We've charged ${amount} VND (about 5 USD) from your wallet.`,
    `Your premium access is active until ${expiry}.`,
    "",
    "You'll now get real-time notifications when new listings match your preferences.",
    "",
    "— The Affordable Food Federation team",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2>Thanks for subscribing to AFF Premium!</h2>
      <p>We've charged <strong>${amount} VND</strong> (about 5 USD) from your wallet.</p>
      <p>Your premium access is active until <strong>${expiry}</strong>.</p>
      <p>You'll now get real-time notifications when new listings match your preferences.</p>
      <p style="color: #666;">— The Affordable Food Federation team</p>
    </div>
  `.trim();

  return { subject, html, text };
}
