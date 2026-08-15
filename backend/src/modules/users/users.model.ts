import mongoose from 'mongoose'

export interface IUser {
  email: string
  name: string
  password?: string
  refreshToken?: string
  avatar?: string
  googleId?: string
  githubId?: string
}

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String },
  refreshToken: { type: String },
  avatar: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  githubId: { type: String, unique: true, sparse: true },
}, { timestamps: true })

export const User = mongoose.model<IUser>('User', userSchema)