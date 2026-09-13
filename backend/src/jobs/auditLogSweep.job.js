import { env } from "../config/env.js";
import { finalizeExpiredEntries } from "../modules/admin/services/auditLog.service.js";

let sweeping = false;
let sweepTimer = null;

async function runSweep() {
  // Skip this tick instead of overlapping if the previous sweep is still
  // running (e.g. a slow DB) -- two concurrent sweeps would just race to
  // update the same documents for no benefit.
  if (sweeping) return;
  sweeping = true;
  try {
    const finalized = await finalizeExpiredEntries();
    if (finalized.length > 0) {
      console.log(
        `Audit log sweep: finalized ${finalized.length} expired entr${finalized.length === 1 ? "y" : "ies"}`,
      );
    }
  } catch (error) {
    console.error("Audit log sweep failed:", error);
  } finally {
    sweeping = false;
  }
}

/**
 * Starts the recurring sweep that finalizes Pending audit log entries whose
 * undo window has passed (finalizeExpiredEntries in auditLog.service.js).
 * Plain setInterval rather than a cron library: the requirement is "run
 * this every N minutes, forever," not "run at specific calendar times," so
 * there's no cron syntax to justify a dependency for. unref() keeps the
 * timer from blocking process exit (e.g. in tests).
 */
