import { Resend } from "resend";
import { env } from "../../config/env.js";

// Lazily construct the Resend client so the app boots without a key.
// Returns null when mail is not configured.
let client = null;
function getClient() {
  if (!env.mail.apiKey) {
    return null;
  }
  if (!client) {
    client = new Resend(env.mail.apiKey);
  }
  return client;
}

/**
 * Sends one email via Resend. Never throws — on any failure (or when mail is
 * not configured) it logs and resolves, so callers can fire-and-forget without
 * risking the request that triggered it.
 */
export async function sendMail({ to, subject, html, text }) {
  const resend = getClient();
  if (!resend) {
    console.log(`[mail] skipped (not configured): ${subject} → ${to}`);
    return;
  }
  try {
    await resend.emails.send({ from: env.mail.from, to, subject, html, text });
    console.log(`[mail] sent: ${subject} → ${to}`);
  } catch (error) {
    // Log the failure but never rethrow — the triggering action already
    // succeeded. Do not log tokens or the API key (CLAUDE.md).
    console.error(`[mail] send failed: ${subject} → ${to}`, error);
  }
}
