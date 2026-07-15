import { jwt } from "hono/jwt";
import { config } from "../../config/constants.js";
export const authMiddleware = jwt({
    secret: config.jwtSecret,
    alg: 'HS256',
});
