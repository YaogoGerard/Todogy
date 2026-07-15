import { Hono } from "hono";
import { Login, Logout, register, githubLogin, googleLogin, github, google, refreshAccessToken } from "./auth.service.js";
import { getCookie } from "hono/cookie";
import { generateState, generateCodeVerifier } from "arctic";
import { config } from "../../config/constants.js";
const authRoutes = new Hono();
//Inscription
authRoutes.post('/register', async (c) => {
    const input = await c.req.json();
    const result = await register(input);
    c.header('Set-Cookie', `refreshToken=${result.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
    return c.json({
        accessToken: result.accessToken,
        user: result.user
    });
});
//Connexion
authRoutes.post('/login', async (c) => {
    const input = await c.req.json();
    const result = await Login(input);
    c.header('Set-Cookie', `refreshToken=${result.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
    return c.json({
        accessToken: result.accessToken,
        user: result.user
    });
});
// deconnexion
authRoutes.post('/logout', async (c) => {
    const refreshToken = getCookie(c, 'refreshToken');
    if (!refreshToken)
        return c.json({ message: 'Already logged out' });
    await Logout(refreshToken);
    c.header('Set-Cookie', 'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
    return c.json({ message: 'Logged out' });
});
//Google
authRoutes.get('/google', (c) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);
    c.header('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
    c.header('Set-Cookie', `code_verifier=${codeVerifier}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
    return c.redirect(url.toString());
});
authRoutes.get('/google/callback', async (c) => {
    const code = c.req.query('code');
    const codeVerifier = getCookie(c, 'code_verifier');
    const result = await googleLogin(code, codeVerifier);
    c.header('Set-Cookie', `refreshToken=${result.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
    return c.redirect(`${config.frontendUrl}?oauth=success`);
});
//Github
authRoutes.get('/github', (c) => {
    const state = generateState();
    const url = github.createAuthorizationURL(state, ['user:email']);
    c.header('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
    return c.redirect(url.toString());
});
authRoutes.get('/github/callback', async (c) => {
    const code = c.req.query('code');
    const result = await githubLogin(code);
    c.header('Set-Cookie', `refreshToken=${result.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
    return c.redirect(`${config.frontendUrl}?oauth=success`);
});
authRoutes.post('/refresh', async (c) => {
    const refreshToken = getCookie(c, 'refreshToken');
    if (!refreshToken)
        return c.json({ error: 'No refresh token' }, 401);
    const result = await refreshAccessToken(refreshToken);
    c.header('Set-Cookie', `refreshToken=${result.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
    return c.json({ accessToken: result.accessToken, user: result.user });
});
export default authRoutes;
