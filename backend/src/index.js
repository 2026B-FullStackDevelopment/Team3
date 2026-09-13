import "dotenv/config";
import { createServer } from "node:http";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { ensureUploadDirs } from "./shared/upload/services/storage.js";

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

    httpServer.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });

    let shuttingDown = false;
    const shutdown = async () => {
      if (shuttingDown) return;
      shuttingDown = true;
      stopAuditLogSweep();
      await closeNotificationGateway();
      if (httpServer.listening) {
        await new Promise((resolve) => httpServer.close(resolve));
      }
      await mongoose.disconnect();
    };

    process.once("SIGINT", () => void shutdown());
    process.once("SIGTERM", () => void shutdown());
  } catch (error) {
    console.error("Failed to start server", error);
  }
}
startServer();
