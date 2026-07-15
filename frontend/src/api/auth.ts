import api from './axios'

export interface AuthResponse {
  accessToken: string
  user: { id: string; email: string; name: string; avatar?: string }
}

const baseUrl = __BASE_URL__


export const GOOGLE_AUTH_URL = `${baseUrl}/auth/google`
export const GITHUB_AUTH_URL = `${baseUrl}/auth/github`

export function register(name: string, email: string, password: string) {
  return api.post<AuthResponse>('/auth/register', { name, email, password })
}

export function login(email: string, password: string) {
  return api.post<AuthResponse>('/auth/login', { email, password })
}

export function logout() {
  return api.post('/auth/logout')
}

export function refresh() {
  return api.post<AuthResponse>('/auth/refresh')
}
