import { User } from "../users/users.model.js";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";
import type { RegisterInput, LoginInput, AuthResponse,TokenPayload,GitHubProfile,GoogleClaims} from "./auth.model.js";
import { config } from "../../config/constants.js";
import { Google,GitHub,decodeIdToken } from "arctic";

// creation des instances oAuth2
export const google = new Google(
  config.google.clientId,
  config.google.clientSecret,
  `${config.baseUrl}/auth/google/callback`
)

export const github = new GitHub(
  config.github.clientId,
  config.github.clientSecret,
  `${config.baseUrl}/auth/github/callback`
)


//fonction pour la creation de compte avec email + password
export async function register(input: RegisterInput): Promise<AuthResponse>{
  const existing = await User.findOne({ email: input.email })
  if (existing) throw new Error('An error occurred during registration. Please try again.');

  const hashedPassword = await bcrypt.hash(input.password, 10)
  const user = await User.create({
    name: input.name,
    email:input.email,
    password:hashedPassword,
  })
  return generateTokens(user);
}

// fonction  pour la connexion de l'utilisateur
export async function Login(input: LoginInput): Promise<AuthResponse>{
  const user = await User.findOne({ email: input.email })
  if (!user) throw new Error('Invalid credentials')
  if (!user.password) throw new Error('Invalid credentials')

  const valid = await bcrypt.compare(input.password, user.password)
  if (!valid) throw new Error('Invalid credentials')

  return generateTokens(user)
}

// fonction pour ce deconnecter
export async function Logout(refreshToken: string): Promise<boolean>{
   const user = await User.findOne({ refreshToken })
   if (!user) return false
   await User.updateOne({_id:user._id},{$unset:{refreshToken:""}})
   return true
}

// permet de trouver un utilisateur par email
async function findOrCreate(data: { email: string; name: string; avatar?: string; googleId?: string; githubId?: string }) {
  const user = await User.findOne({ email: data.email })
  if (user) {
      if (data.googleId && !user.googleId) await User.updateOne({ _id: user._id }, { googleId: data.googleId })
      if (data.githubId && !user.githubId) await User.updateOne({ _id: user._id }, { githubId: data.githubId })
      return user
    }
    return await User.create(data)
}

//Google oAuth2
export async function googleLogin(code: string, codeVerifier: string): Promise<AuthResponse>{
  const tokens = await google.validateAuthorizationCode(code, codeVerifier)
  const claims = decodeIdToken(tokens.idToken()) as GoogleClaims
  const user = await findOrCreate({ email: claims.email, name: claims.name, avatar: claims.picture, googleId: claims.sub })
  return generateTokens(user)
}

//Github oAuth2
export async function githubLogin(code: string): Promise<AuthResponse>{
  const tokens = await github.validateAuthorizationCode(code)
  const res = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${tokens.accessToken()}` } })
  const profile = await res.json() as GitHubProfile
  const user = await findOrCreate({ email: profile.email, name: profile.name || profile.login, avatar: profile.avatar_url, githubId: profile.id.toString() })
  return generateTokens(user)
}

// generation des token pour l'authentification dans tout le system
async function generateTokens(user: any): Promise<AuthResponse>{
  const payload: TokenPayload={ userId: user._id.toString(), email: user.email }
  
  const accessToken = await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 15 }, //pour 15 minutes
    config.jwtSecret
  )

  const refreshToken = await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, //pour 7 jours
    config.jwtSecret
  )
  await User.updateOne({_id:user._id},{refreshToken})
  return {
    accessToken,
    refreshToken,
    user:{
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar:user.avatar,
  }
  }
}

export async function refreshAccessToken(refreshTokenStr: string): Promise<AuthResponse>{
  const user = await User.findOne({ refreshToken: refreshTokenStr })
  if (!user) throw new Error('Invalid refresh token')
  await User.updateOne({ _id: user._id }, { $unset: { refreshToken: "" } })
  return generateTokens(user)
}

