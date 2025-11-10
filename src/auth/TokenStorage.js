/**
 * Token Storage Strategies
 * Provides different storage mechanisms for access and refresh tokens
 * with varying security levels
 */

/**
 * Memory Storage Strategy (Most Secure for Access Tokens)
 * - Tokens are lost on page refresh
 * - Not vulnerable to XSS that reads storage
 * - Best for short-lived access tokens
 */
class MemoryStorage {
  constructor() {
    this.storage = new Map();
  }

  getItem(key) {
    return this.storage.get(key) || null;
  }

  setItem(key, value) {
    this.storage.set(key, value);
  }

  removeItem(key) {
    this.storage.delete(key);
  }

  clear() {
    this.storage.clear();
  }
}

/**
 * SessionStorage Strategy (Moderate Security)
 * - Persists for browser session only
 * - Cleared when browser/tab closes
 * - Vulnerable to XSS
 */
class SessionStorageStrategy {
  getItem(key) {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key);
  }

  setItem(key, value) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, value);
  }

  removeItem(key) {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  }

  clear() {
    if (typeof window === 'undefined') return;
    sessionStorage.clear();
  }
}

/**
 * LocalStorage Strategy (Lower Security, High Convenience)
 * - Persists across sessions
 * - Survives browser restarts
 * - Vulnerable to XSS
 * - Default for backward compatibility
 */
class LocalStorageStrategy {
  getItem(key) {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  }

  setItem(key, value) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  }

  removeItem(key) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }

  clear() {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
}

/**
 * HttpOnly Cookie Strategy (Most Secure for Refresh Tokens)
 * - Refresh token stored in httpOnly cookie by backend
 * - Not accessible to JavaScript (XSS protection)
 * - Automatically sent with requests
 * - Requires backend implementation
 *
 * Note: This strategy doesn't actually store tokens client-side
 * It's a marker that tells AuthStore the token is in httpOnly cookies
 */
class HttpOnlyCookieStrategy {
  constructor() {
    this.warning = 'HttpOnly cookies are managed by the backend. Client-side storage operations are no-ops.';
  }

  getItem(key) {
    // HttpOnly cookies can't be read by JavaScript
    // Token is automatically sent with HTTP requests
    console.info(`[HttpOnlyCookieStrategy] getItem called for ${key}. ${this.warning}`);
    return null;
  }

  setItem(key, value) {
    // HttpOnly cookies must be set by backend via Set-Cookie header
    console.info(`[HttpOnlyCookieStrategy] setItem called for ${key}. ${this.warning}`);
  }

  removeItem(key) {
    // HttpOnly cookies must be cleared by backend
    console.info(`[HttpOnlyCookieStrategy] removeItem called for ${key}. ${this.warning}`);
  }

  clear() {
    // Clearing must be done by backend
    console.info(`[HttpOnlyCookieStrategy] clear called. ${this.warning}`);
  }
}

/**
 * Factory function to create storage strategy
 * @param {string} type - Storage type: 'memory', 'sessionStorage', 'localStorage', 'httpOnly'
 * @returns {Object} Storage strategy instance
 */
export const createStorageStrategy = (type = 'localStorage') => {
  switch (type) {
    case 'memory':
      return new MemoryStorage();
    case 'sessionStorage':
      return new SessionStorageStrategy();
    case 'localStorage':
      return new LocalStorageStrategy();
    case 'httpOnly':
      return new HttpOnlyCookieStrategy();
    default:
      console.warn(`Unknown storage type: ${type}, falling back to localStorage`);
      return new LocalStorageStrategy();
  }
};

/**
 * Get recommended storage configuration for security
 * @returns {Object} Recommended storage configuration
 */
export const getRecommendedStorageConfig = () => ({
  // Access tokens should be short-lived and in memory
  accessToken: {
    storage: 'memory',
    key: 'access_token',
  },
  // Refresh tokens should be in httpOnly cookies (managed by backend)
  refreshToken: {
    storage: 'httpOnly',
    key: 'refresh_token',
  },
  // User data can be in sessionStorage or localStorage
  user: {
    storage: 'sessionStorage',
    key: 'auth_user',
  },
});

/**
 * Get legacy storage configuration (backward compatible)
 * @returns {Object} Legacy storage configuration
 */
export const getLegacyStorageConfig = () => ({
  accessToken: {
    storage: 'localStorage',
    key: 'auth_token',
  },
  refreshToken: {
    storage: 'localStorage',
    key: 'auth_token', // Same as access token for backward compatibility
  },
  user: {
    storage: 'localStorage',
    key: 'auth_state',
  },
});

export { MemoryStorage, SessionStorageStrategy, LocalStorageStrategy, HttpOnlyCookieStrategy };
