"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCorsOrigin = getCorsOrigin;
function getCorsOrigin() {
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3001',
        process.env.LANDING_PAGE_URL,
    ]
        .filter(Boolean)
        .flatMap((origin) => origin.split(','))
        .map((origin) => origin.trim())
        .filter(Boolean);
    const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
        .filter((origin) => Boolean(origin))
        .map((origin) => `https://${origin.replace(/^https?:\/\//, '').replace(/\/$/, '')}`);
    const allowedOriginSet = new Set([...allowedOrigins, ...vercelOrigins]);
    return (origin, callback) => {
        if (!origin || allowedOriginSet.has('*') || allowedOriginSet.has(origin)) {
            callback(null, true);
            return;
        }
        if (process.env.VERCEL) {
            try {
                if (new URL(origin).hostname.endsWith('.vercel.app')) {
                    callback(null, true);
                    return;
                }
            }
            catch {
                callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
                return;
            }
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    };
}
//# sourceMappingURL=cors.js.map