import mongoose from 'mongoose';
export async function connectDB(uri) {
    try {
        await mongoose.connect(uri);
        console.log('Connected to database');
    }
    catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
}
