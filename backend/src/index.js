import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { ensureUploadDirs } from "./shared/upload/services/storage.js";
import { startAuditLogSweep } from "./jobs/auditLogSweep.job.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    await ensureUploadDirs();
    startAuditLogSweep();
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
  }
}
startServer();
