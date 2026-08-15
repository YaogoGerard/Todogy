import { User } from '../users/users.model.js';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { config } from '../../config/constants.js';
import { Google, GitHub, decodeIdToken } from 'arctic';
import { badRequest, conflict, unauthorized } from '../../shared/http-error.js';
// OAuth2 client instances
export const google = new Google(config.google.clientId, config.google.clientSecret, `${config.baseUrl}/auth/google/callback`);
export const github = new GitHub(config.github.clientId, config.github.clientSecret, `${config.baseUrl}/auth/github/callback`);
// Register a new account with email + password
export async function register(input) {
    const existing = await User.findOne({ email: input.email, password: { $exists: true, $ne: null } });
    if (existing)
        throw conflict('An account with this email already exists.');
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await User.create({
        name: input.name,
        email: input.email,
        password: hashedPassword,
    });
    return generateTokens(user);
}
// Log in with email + password
export async function login(input) {
    const user = await User.findOne({ email: input.email, password: { $exists: true, $ne: null } });
    if (!user || !user.password)
        throw unauthorized('Invalid email or password');
    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid)
        throw unauthorized('Invalid email or password');
    return generateTokens(user);
}
// Revoke a refresh token
export async function logout(refreshToken) {
    const user = await User.findOne({ refreshToken });
    if (!user)
        return false;
    await User.updateOne({ _id: user._id }, { $unset: { refreshToken: '' } });
    return true;
}
// Find or create an OAuth user, linked by provider id (deliberately no email-based merging)
async function findOrCreate(data, mode = 'signup') {
    let user = null;
    if (data.googleId)
        user = await User.findOne({ googleId: data.googleId });
    else if (data.githubId)
        user = await User.findOne({ githubId: data.githubId });
    if (user) {
        const updates = {};
        if (data.avatar)
            updates.avatar = data.avatar;
        if (data.name)
            updates.name = data.name;
        if (Object.keys(updates).length > 0) {
            await User.updateOne({ _id: user._id }, updates);
            user = Object.assign(user, updates);
        }
        return user;
    }
    if (mode === 'signin') {
        throw unauthorized('No account found for this provider. Please sign up first.');
    }
    return User.create(data);
}
// Google OAuth2 login
export async function googleLogin(code, codeVerifier, mode = 'signup') {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const claims = decodeIdToken(tokens.idToken());
    const user = await findOrCreate({ email: claims.email, name: claims.name, avatar: claims.picture, googleId: claims.sub }, mode);
    return generateTokens(user);
}
// GitHub OAuth2 login
export async function githubLogin(code, mode = 'signup') {
    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();
    const res = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessToken}` } });
    const profile = await res.json();
    let email = profile.email;
    if (!email) {
        const emRes = await fetch('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${accessToken}` } });
        const emails = await emRes.json();
        email = emails.find((e) => e.primary)?.email ?? emails[0]?.email;
    }
    if (!email)
        throw badRequest('GitHub account has no email');
    const user = await findOrCreate({ email, name: profile.name || profile.login, avatar: profile.avatar_url, githubId: profile.id.toString() }, mode);
    return generateTokens(user);
}
// Generate access (15 min) and refresh (7 days) tokens for a user
async function generateTokens(user) {
    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken = await sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 15 }, config.jwtSecret);
    const refreshToken = await sign({ ...payload, jti: randomUUID(), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, config.jwtSecret);
    await User.updateOne({ _id: user._id }, { refreshToken });
    return {
        accessToken,
        refreshToken,
        user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            avatar: user.avatar,
        },
    };
}
// Rotate a refresh token after verifying its signature and expiry
export async function refreshAccessToken(refreshTokenStr) {
    let payload;
    try {
        const decoded = await verify(refreshTokenStr, config.jwtSecret, 'HS256');
        if (typeof decoded.userId !== 'string')
            throw new Error('Missing userId claim');
        payload = { userId: decoded.userId, email: String(decoded.email ?? '') };
    }
    catch {
        throw unauthorized('Invalid refresh token');
    }
    const user = await User.findOne({ refreshToken: refreshTokenStr, _id: payload.userId });
    if (!user)
        throw unauthorized('Invalid refresh token');
    await User.updateOne({ _id: user._id }, { $unset: { refreshToken: '' } });
    return generateTokens(user);
}
