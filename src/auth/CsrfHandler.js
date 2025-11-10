/**
 * CSRF Token Handler
 * Provides Cross-Site Request Forgery protection for cookie-based authentication
 */

export class CsrfHandler {
  constructor(config = {}) {
    this.enabled = config.enabled || false;
    this.tokenKey = config.tokenKey || 'csrf_token';
    this.headerName = config.headerName || 'X-CSRF-Token';
    this.cookieName = config.cookieName || 'csrf_token';
    this.storage = config.storage || (typeof window !== 'undefined' ? sessionStorage : null);
  }

  /**
   * Get CSRF token from storage
   * @returns {string|null} CSRF token
   */
  getToken() {
    if (!this.enabled || !this.storage) return null;
    return this.storage.getItem(this.tokenKey);
  }

  /**
   * Set CSRF token in storage
   * @param {string} token - CSRF token to store
   */
  setToken(token) {
    if (!this.enabled || !this.storage || !token) return;
    this.storage.setItem(this.tokenKey, token);
  }

  /**
   * Remove CSRF token from storage
   */
  removeToken() {
    if (!this.enabled || !this.storage) return;
    this.storage.removeItem(this.tokenKey);
  }

  /**
   * Extract CSRF token from cookie
   * Note: This reads non-httpOnly cookies only
   * @returns {string|null} CSRF token from cookie
   */
  extractTokenFromCookie() {
    if (!this.enabled || typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.cookieName) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Extract CSRF token from response headers
   * @param {Response} response - Fetch API response object
   * @returns {string|null} CSRF token from response header
   */
  extractTokenFromResponse(response) {
    if (!this.enabled || !response || !response.headers) return null;
    return response.headers.get(this.headerName) || response.headers.get(this.headerName.toLowerCase());
  }

  /**
   * Get headers object with CSRF token
   * @param {Object} existingHeaders - Existing headers object
   * @returns {Object} Headers with CSRF token added
   */
  getHeaders(existingHeaders = {}) {
    if (!this.enabled) return existingHeaders;

    const token = this.getToken() || this.extractTokenFromCookie();
    if (!token) return existingHeaders;

    return {
      ...existingHeaders,
      [this.headerName]: token,
    };
  }

  /**
   * Process response and extract/store CSRF token if present
   * @param {Response} response - Fetch API response object
   */
  processResponse(response) {
    if (!this.enabled) return;

    const token = this.extractTokenFromResponse(response);
    if (token) {
      this.setToken(token);
    }
  }

  /**
   * Validate CSRF token
   * @param {string} token - Token to validate
   * @returns {boolean} True if valid
   */
  validateToken(token) {
    if (!this.enabled) return true;
    const storedToken = this.getToken();
    return storedToken === token;
  }
}

/**
 * Create CSRF handler instance
 * @param {Object} config - CSRF configuration
 * @returns {CsrfHandler} CSRF handler instance
 */
export const createCsrfHandler = (config = {}) => {
  return new CsrfHandler(config);
};
