import { Hono } from 'hono';
import { login, logout, register, githubLogin, googleLogin, github, google, refreshAccessToken } from './auth.service.js';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { generateState, generateCodeVerifier } from 'arctic';
import { config } from '../../config/constants.js';
import { parseJsonBody, registerSchema, loginSchema } from '../../shared/validation.js';
import { rateLimit } from '../../shared/middleware/rate-limit.js';
const authRoutes = new Hono();
const REFRESH_COOKIE = { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 604800 };
const OAUTH_STATE_COOKIE = { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 600 };
// Register a new account
authRoutes.post('/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), async (c) => {
    const input = await parseJsonBody(c, registerSchema);
    const result = await register(input);
    setCookie(c, 'refreshToken', result.refreshToken, REFRESH_COOKIE);
    return c.json({ accessToken: result.accessToken, user: result.user });
});
// Log in with email + password
authRoutes.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), async (c) => {
    const input = await parseJsonBody(c, loginSchema);
    const result = await login(input);
    setCookie(c, 'refreshToken', result.refreshToken, REFRESH_COOKIE);
    return c.json({ accessToken: result.accessToken, user: result.user });
});
// Log out
authRoutes.post('/logout', async (c) => {
    const refreshToken = getCookie(c, 'refreshToken');
    if (!refreshToken)
        return c.json({ message: 'Already logged out' });
    await logout(refreshToken);
    deleteCookie(c, 'refreshToken', REFRESH_COOKIE);
    return c.json({ message: 'Logged out' });
});
// Google OAuth2
authRoutes.get('/google', (c) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);
    const mode = c.req.query('mode') === 'signin' ? 'signin' : 'signup';
    setCookie(c, 'oauth_state', state, OAUTH_STATE_COOKIE);
    setCookie(c, 'code_verifier', codeVerifier, OAUTH_STATE_COOKIE);
    setCookie(c, 'oauth_mode', mode, OAUTH_STATE_COOKIE);
    return c.redirect(url.toString());
});
authRoutes.get('/google/callback', rateLimit({ windowMs: 60 * 1000, max: 10 }), async (c) => {
    const error = c.req.query('error');
    if (error)
        return c.redirect(`${config.frontendUrl}/signin?oauth=error=${error}`);
    const code = c.req.query('code');
    const codeVerifier = getCookie(c, 'code_verifier');
    const expectedState = getCookie(c, 'oauth_state');
    const mode = getCookie(c, 'oauth_mode') === 'signin' ? 'signin' : 'signup';
    if (!code || !codeVerifier)
        return c.redirect(`${config.frontendUrl}/signin?oauth=error=missing_code`);
    if (!expectedState || expectedState !== c.req.query('state')) {
        return c.redirect(`${config.frontendUrl}/signin?oauth=error=invalid_state`);
    }
    try {
        const result = await googleLogin(code, codeVerifier, mode);
        setCookie(c, 'refreshToken', result.refreshToken, REFRESH_COOKIE);
        return oauthSuccessRedirect(c, result);
    }
    catch (e) {
        console.error('Google OAuth failed:', e);
        return oauthErrorRedirect(c, mode);
    }
});
// GitHub OAuth2
authRoutes.get('/github', (c) => {
    const state = generateState();
    const url = github.createAuthorizationURL(state, ['user:email']);
    const mode = c.req.query('mode') === 'signin' ? 'signin' : 'signup';
    setCookie(c, 'oauth_state', state, OAUTH_STATE_COOKIE);
    setCookie(c, 'oauth_mode', mode, OAUTH_STATE_COOKIE);
    return c.redirect(url.toString());
});
authRoutes.get('/github/callback', rateLimit({ windowMs: 60 * 1000, max: 10 }), async (c) => {
    const error = c.req.query('error');
    if (error)
        return c.redirect(`${config.frontendUrl}/signin?oauth=error=${error}`);
    const code = c.req.query('code');
    const expectedState = getCookie(c, 'oauth_state');
    const mode = getCookie(c, 'oauth_mode') === 'signin' ? 'signin' : 'signup';
    if (!code)
        return c.redirect(`${config.frontendUrl}/signin?oauth=error=missing_code`);
    if (!expectedState || expectedState !== c.req.query('state')) {
        return c.redirect(`${config.frontendUrl}/signin?oauth=error=invalid_state`);
    }
    try {
        const result = await githubLogin(code, mode);
        setCookie(c, 'refreshToken', result.refreshToken, REFRESH_COOKIE);
        return oauthSuccessRedirect(c, result);
    }
    catch (e) {
        console.error('GitHub OAuth failed:', e);
        return oauthErrorRedirect(c, mode);
    }
});
// Rotate the refresh token
authRoutes.post('/refresh', rateLimit({ windowMs: 60 * 1000, max: 30 }), async (c) => {
    const refreshToken = getCookie(c, 'refreshToken');
    if (!refreshToken)
        return c.json({ error: 'No refresh token' }, 401);
    try {
        const result = await refreshAccessToken(refreshToken);
        setCookie(c, 'refreshToken', result.refreshToken, REFRESH_COOKIE);
        return c.json({ accessToken: result.accessToken, user: result.user });
    }
    catch {
        deleteCookie(c, 'refreshToken', REFRESH_COOKIE);
        return c.json({ error: 'Invalid refresh token' }, 401);
    }
});
function oauthSuccessRedirect(c, result) {
    const user = encodeURIComponent(JSON.stringify(result.user));
    return c.redirect(`${config.frontendUrl}/#oauth=success&access_token=${result.accessToken}&user=${user}`);
}
function oauthErrorRedirect(c, mode) {
    const error = mode === 'signin' ? 'no_account' : 'auth_failed';
    return c.redirect(`${config.frontendUrl}/signup?oauth=error=${error}`);
}
export default authRoutes;
