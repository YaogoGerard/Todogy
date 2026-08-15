// Payload for email + password registration
export interface RegisterInput {
  name: string
  email: string
  password: string
}

// Payload for email + password login
export interface LoginInput {
  email: string
  password: string
}

// Claims decoded from Google's idToken
export interface GoogleClaims {
  sub: string
  email: string
  name: string
  picture: string
}

// Profile returned by the GitHub API
export interface GitHubProfile {
  id: number
  email: string
  name: string
  login: string
  avatar_url: string
}

// Claims embedded in JWT access and refresh tokens
export interface TokenPayload {
  userId: string
  email: string
}

// Response sent to the frontend after authentication
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    avatar?: string
  }
}