import 'dotenv/config';
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function stripTrailingSlash(value) {
    return value.trim().replace(/\/+$/, '');
}
export const config = {
    port: Number(process.env.PORT) || 3000,
    baseUrl: stripTrailingSlash(process.env.BASE_URL || 'http://localhost:3000'),
    frontendUrl: stripTrailingSlash(process.env.FRONTEND_URL || 'http://localhost:5173'),
    mongoUri: requireEnv('MONGODB_URI'),
    jwtSecret: requireEnv('JWT_SECRET'),
    google: {
        clientId: requireEnv('GOOGLE_CLIENT_ID'),
        clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
    },
    github: {
        clientId: requireEnv('GITHUB_CLIENT_ID'),
        clientSecret: requireEnv('GITHUB_CLIENT_SECRET'),
    },
};
