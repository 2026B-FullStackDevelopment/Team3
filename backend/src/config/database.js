import mongoose from "mongoose";
import "dotenv/config";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  await mongoose.connect(uri);
  console.log("Database is connected successfully");
}
