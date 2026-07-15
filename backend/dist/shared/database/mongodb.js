import mongoose from "mongoose";
export async function connectDB(uri) {
    try {
        await mongoose.connect(uri);
        console.log("Connected to database");
    }
    catch (e) {
        console.error("Database connection failled:", e);
        process.exit(1);
    }
}
