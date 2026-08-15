import mongoose from 'mongoose'

export async function connectDB(uri: string) {
  try {
    await mongoose.connect(uri)
    console.log('Connected to database')
  } catch (error) {
    console.error('Database connection failed:', error)
    throw error
  }
}