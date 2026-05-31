"use strict";
/**
 * Centralized configuration for API URLs and environment settings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.getApiUrl = getApiUrl;
exports.getWebSocketUrl = getWebSocketUrl;
exports.isProduction = isProduction;
exports.isDevelopment = isDevelopment;
exports.getDatabaseUrl = getDatabaseUrl;
/**
 * Get the API base URL based on environment
 * - Server-side: Uses internal API URL
 * - Client-side: Uses public API URL or relative path
 */
function getApiUrl() {
    // Server-side rendering
    if (typeof window === 'undefined') {
        return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    }
    // Client-side
    // In production (Netlify), use relative path to leverage serverless functions
    // In development, use the backend API directly
    return process.env.NEXT_PUBLIC_API_URL || '/api';
}
/**
 * Get WebSocket URL for real-time updates
 */
function getWebSocketUrl() {
    if (typeof window === 'undefined') {
        return process.env.WS_URL || 'http://localhost:3001';
    }
    return process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
}
/**
 * Check if running in production
 */
function isProduction() {
    return process.env.NODE_ENV === 'production';
}
/**
 * Check if running in development
 */
function isDevelopment() {
    return process.env.NODE_ENV === 'development';
}
/**
 * Get database URL (for Prisma)
 */
function getDatabaseUrl() {
    return process.env.DATABASE_URL || 'file:./dev.db';
}
/**
 * Configuration object for easy access
 */
exports.config = {
    api: {
        baseUrl: getApiUrl(),
        wsUrl: getWebSocketUrl(),
    },
    env: {
        isProduction: isProduction(),
        isDevelopment: isDevelopment(),
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    database: {
        url: getDatabaseUrl(),
    },
    features: {
        enableNotifications: true,
        enableWebSocket: true,
        enablePWA: true,
    },
};
exports.default = exports.config;
//# sourceMappingURL=config.js.map