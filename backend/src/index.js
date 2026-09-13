import "dotenv/config";
import { createServer } from "node:http";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { ensureUploadDirs } from "./shared/upload/services/storage.js";
import {
  startAuditLogSweep,
  stopAuditLogSweep,
} from "./jobs/auditLogSweep.job.js";

import {
  closeNotificationGateway,
  initializeNotificationGateway,
} from "./modules/notification/realtime/notification.gateway.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    await ensureUploadDirs();
    const httpServer = createServer(app);
    initializeNotificationGateway(httpServer);
    startAuditLogSweep();

    httpServer.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });

    let shuttingDown = false;
    const shutdown = async () => {
      if (shuttingDown) return;
      shuttingDown = true;
      stopAuditLogSweep();

      try {
        await closeNotificationGateway();
      } catch (error) {
        console.error("Failed to close notification gateway", error);
      }

      try {
        if (httpServer.listening) {
          await new Promise((resolve, reject) =>
            httpServer.close((error) => (error ? reject(error) : resolve())),
          );
        }
      } catch (error) {
        console.error("Failed to close HTTP server", error);
      }

      try {
        await mongoose.disconnect();
      } catch (error) {
        console.error("Failed to disconnect MongoDB", error);
      }
    };

    process.once("SIGINT", () => void shutdown());
    process.once("SIGTERM", () => void shutdown());
  } catch (error) {
    console.error("Failed to start server", error);
  }
}
startServer();
