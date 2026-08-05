import { Hono } from "hono";
import { Login,Logout,register,githubLogin,googleLogin,github,google,refreshAccessToken } from "./auth.service.js";
import type { RegisterInput, LoginInput } from "./auth.model.js";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { generateState,generateCodeVerifier } from "arctic";
import { config } from "../../config/constants.js";

const authRoutes = new Hono();

const REFRESH_COOKIE = { path: '/', httpOnly: true, secure: true, sameSite: 'None' as const, maxAge: 604800 }

//Inscription
authRoutes.post('/register', async (c) => {
  const input = await c.req.json<RegisterInput>()
  const result = await register(input)
  setCookie(c, 'refreshToken', result.refreshToken, REFRESH_COOKIE)
  return c.json({
     accessToken: result.accessToken,
     user:result.user
   })
})

//Connexion
authRoutes.post('/login', async (c) => {
  const input = await c.req.json<LoginInput>()
  const result = await Login(input)
  setCookie(c, 'refreshToken', result.refreshToken, REFRESH_COOKIE)
  return c.json({
    accessToken: result.accessToken,
    user:result.user
  })
})

// deconnexion
authRoutes.post('/logout', async (c) => {
  const refreshToken = getCookie(c,'refreshToken')
  if (!refreshToken) return c.json({ message: 'Already logged out' })

  await Logout(refreshToken)

  deleteCookie(c, 'refreshToken', { path: '/', httpOnly: true, secure: true, sameSite: 'None' })
  return c.json({ message: 'Logged out' })
})

//Google
authRoutes.get('/google', (c) => {
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email'])
  const mode = c.req.query('mode') === 'signin' ? 'signin' : 'signup'
  setCookie(c, 'oauth_state', state, { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 600 })
  setCookie(c, 'code_verifier', codeVerifier, { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 600 })
  setCookie(c, 'oauth_mode', mode, { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 600 })
  return c.redirect(url.toString())
})
authRoutes.get('/google/callback', async (c) => {
  const error = c.req.query('error')
  if (error) return c.redirect(`${config.frontendUrl}/signin?oauth=error=${error}`)

  const code = c.req.query('code')
  const codeVerifier = getCookie(c, 'code_verifier')
  const expectedState = getCookie(c, 'oauth_state')
  const mode = getCookie(c, 'oauth_mode') === 'signin' ? 'signin' : 'signup'
  if (!code || !codeVerifier) return c.redirect(`${config.frontendUrl}/signin?oauth=error=missing_code`)
  if (!expectedState || expectedState !== c.req.query('state')) {
    return c.redirect(`${config.frontendUrl}/signin?oauth=error=invalid_state`)
  }

  try {
    const result = await googleLogin(code, codeVerifier, mode)
    setCookie(c, 'refreshToken', result.refreshToken, REFRESH_COOKIE)
    const user = encodeURIComponent(JSON.stringify(result.user))
    return c.redirect(`${config.frontendUrl}/#oauth=success&access_token=${result.accessToken}&user=${user}`)
  } catch (e) {
    console.error('Google OAuth failed:', e)
    if (mode === 'signin') return c.redirect(`${config.frontendUrl}/signup?oauth=error=no_account`)
    return c.redirect(`${config.frontendUrl}/signin?oauth=error=auth_failed`)
  }
})

//Github
authRoutes.get('/github', (c) => {
  const state = generateState()
  const url = github.createAuthorizationURL(state, ['user:email'])
  const mode = c.req.query('mode') === 'signin' ? 'signin' : 'signup'
  setCookie(c, 'oauth_state', state, { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 600 })
  setCookie(c, 'oauth_mode', mode, { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 600 })
  return c.redirect(url.toString())
})
authRoutes.get('/github/callback', async (c) => {
  const error = c.req.query('error')
  if (error) return c.redirect(`${config.frontendUrl}/signin?oauth=error=${error}`)

  const code = c.req.query('code')
  const expectedState = getCookie(c, 'oauth_state')
  const mode = getCookie(c, 'oauth_mode') === 'signin' ? 'signin' : 'signup'
  if (!code) return c.redirect(`${config.frontendUrl}/signin?oauth=error=missing_code`)
  if (!expectedState || expectedState !== c.req.query('state')) {
    return c.redirect(`${config.frontendUrl}/signin?oauth=error=invalid_state`)
  }

  try {
    const result = await githubLogin(code, mode)
    setCookie(c, 'refreshToken', result.refreshToken, REFRESH_COOKIE)
    const user = encodeURIComponent(JSON.stringify(result.user))
    return c.redirect(`${config.frontendUrl}/#oauth=success&access_token=${result.accessToken}&user=${user}`)
  } catch (e) {
    console.error('GitHub OAuth failed:', e)
    if (mode === 'signin') return c.redirect(`${config.frontendUrl}/signup?oauth=error=no_account`)
    return c.redirect(`${config.frontendUrl}/signin?oauth=error=auth_failed`)
  }
})

authRoutes.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'refreshToken')
  if (!refreshToken) return c.json({ error: 'No refresh token' }, 401)

  try {
    const result = await refreshAccessToken(refreshToken)
    setCookie(c, 'refreshToken', result.refreshToken, REFRESH_COOKIE)
    return c.json({ accessToken: result.accessToken, user: result.user })
  } catch {
    return c.json({ error: 'Invalid refresh token' }, 401)
  }
})


export default authRoutes;