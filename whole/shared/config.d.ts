/**
 * Centralized configuration for API URLs and environment settings
 */
/**
 * Get the API base URL based on environment
 * - Server-side: Uses internal API URL
 * - Client-side: Uses public API URL or relative path
 */
export declare function getApiUrl(): string;
/**
 * Get WebSocket URL for real-time updates
 */
export declare function getWebSocketUrl(): string;
/**
 * Check if running in production
 */
export declare function isProduction(): boolean;
/**
 * Check if running in development
 */
export declare function isDevelopment(): boolean;
/**
 * Get database URL (for Prisma)
 */
export declare function getDatabaseUrl(): string;
/**
 * Configuration object for easy access
 */
export declare const config: {
    readonly api: {
        readonly baseUrl: string;
        readonly wsUrl: string;
    };
    readonly env: {
        readonly isProduction: boolean;
        readonly isDevelopment: boolean;
        readonly nodeEnv: string;
    };
    readonly database: {
        readonly url: string;
    };
    readonly features: {
        readonly enableNotifications: true;
        readonly enableWebSocket: true;
        readonly enablePWA: true;
    };
};
export default config;
//# sourceMappingURL=config.d.ts.map