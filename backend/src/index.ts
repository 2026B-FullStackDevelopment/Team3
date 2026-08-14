import express from "express";
import "dotenv/config";
import { connectDatabase } from "./config/database.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});

async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
  }
}
startServer();
