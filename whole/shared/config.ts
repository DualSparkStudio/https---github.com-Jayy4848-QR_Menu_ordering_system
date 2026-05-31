/**
 * Centralized configuration for API URLs and environment settings
 */

/**
 * Get the API base URL based on environment
 * - Server-side: Uses internal API URL
 * - Client-side: Uses public API URL or relative path
 */
export function getApiUrl(): string {
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
export function getWebSocketUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.WS_URL || 'http://localhost:3001';
  }
  
  return process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get database URL (for Prisma)
 */
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || 'file:./dev.db';
}

/**
 * Configuration object for easy access
 */
export const config = {
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
} as const;

export default config;
