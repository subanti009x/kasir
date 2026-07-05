"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCorsOrigin = getCorsOrigin;
function getCorsOrigin() {
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3001')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    return (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    };
}
//# sourceMappingURL=cors.js.map