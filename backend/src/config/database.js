import mongoose from "mongoose";
import "dotenv/config.js";
import { env } from "./env.js";

export async function connectDatabase() {
  const uri = env.dbUri;

  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  await mongoose.connect(uri);
  console.log("Database is connected successfully");
}
