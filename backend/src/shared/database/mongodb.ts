import mongoose from "mongoose";

export async function connectDB(uri: string) {
  try {
    await mongoose.connect(uri)
    await mongoose.syncIndexes()
    console.log("Connected to database");
  } catch (e) {
    console.error("Database connection failled:", e);
    process.exit(1);
  }
}