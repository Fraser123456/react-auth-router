import { createStorageStrategy, getLegacyStorageConfig, getRecommendedStorageConfig } from './TokenStorage';
import { createCsrfHandler } from './CsrfHandler';

export class AuthStore {
  constructor(config = {}) {
    // Determine security mode
    const useSecureMode = config.securityMode === 'recommended' || config.secureTokens === true;

    // Backward compatibility: if using old config keys, use legacy mode
    const hasLegacyConfig = config.tokenKey || config.userKey;

    // Get base storage configuration
    let storageConfig;
    if (useSecureMode && !hasLegacyConfig) {
      storageConfig = getRecommendedStorageConfig();
    } else if (config.storageConfig) {
      storageConfig = config.storageConfig;
    } else {
      // Legacy mode for backward compatibility
      storageConfig = getLegacyStorageConfig();
      if (config.tokenKey) {
        storageConfig.accessToken.key = config.tokenKey;
        storageConfig.refreshToken.key = config.tokenKey;
      }
      if (config.userKey) {
        storageConfig.user.key = config.userKey;
      }
    }

    this.config = {
      // Legacy keys for backward compatibility
      tokenKey: config.tokenKey || "auth_token",
      userKey: config.userKey || "auth_state",
      refreshInterval: config.refreshInterval || 15 * 60 * 1000,

      // New security features
      securityMode: config.securityMode || 'legacy', // 'legacy' | 'recommended' | 'custom'
      secureTokens: config.secureTokens || false,
      storageConfig: storageConfig,
      separateRefreshToken: config.separateRefreshToken !== false, // Default true
      tokenRotation: config.tokenRotation !== false, // Default true (rotate refresh tokens)

      // CSRF configuration
      csrf: {
        enabled: config.csrf?.enabled || false,
        tokenKey: config.csrf?.tokenKey || 'csrf_token',
        headerName: config.csrf?.headerName || 'X-CSRF-Token',
        cookieName: config.csrf?.cookieName || 'csrf_token',
      },

      permissionHierarchy: config.permissionHierarchy || {
        admin: [
          "read_users",
          "write_users",
          "delete_users",
          "read_settings",
          "write_settings",
          "admin_access",
        ],
        manager: ["read_users", "write_users", "read_settings"],
        user: ["read_users"],
      },

      // Custom functions
      customLogin: config.customLogin,
      customLogout: config.customLogout,
      customRefresh: config.customRefresh,

      ...config,
    };

    // Initialize storage strategies
    this.accessTokenStorage = createStorageStrategy(this.config.storageConfig.accessToken.storage);
    this.refreshTokenStorage = createStorageStrategy(this.config.storageConfig.refreshToken.storage);
    this.userStorage = createStorageStrategy(this.config.storageConfig.user.storage);

    // Initialize CSRF handler
    this.csrfHandler = createCsrfHandler(this.config.csrf);

    this.user = null;
    this.loading = true;
    this.subscribers = new Set();
    this.tokenRefreshTimer = null;
    this.errorHandler = null;

    this.initialize();
    this.setupStorageListener();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(changeType, data = null) {
    this.subscribers.forEach((callback) => {
      try {
        callback({
          type: changeType,
          user: this.user,
          loading: this.loading,
          data,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Auth subscriber error:", error);
      }
    });
  }

  setErrorHandler(handler) {
    this.errorHandler = handler;
  }

  reportError(type, message, details = null) {
    if (this.errorHandler) {
      this.errorHandler({ type, message, details });
    } else {
      console.error(`[Auth ${type}]:`, message, details);
    }
  }

  async initialize() {
    try {
      this.loading = true;
      this.notify("LOADING_START");

      // Get stored user data
      const storedAuth = this.userStorage.getItem(this.config.storageConfig.user.key);

      // Get stored access token
      const storedToken = this.accessTokenStorage.getItem(this.config.storageConfig.accessToken.key);

      // For httpOnly storage, we can't read the token but may have user data
      const isHttpOnlyMode = this.config.storageConfig.refreshToken.storage === 'httpOnly';

      if (storedAuth && (storedToken || isHttpOnlyMode)) {
        const authData = JSON.parse(storedAuth);

        // Validate token if we have it
        if (storedToken && await this.validateToken(storedToken)) {
          this.user = authData;
          this.setupTokenRefresh(storedToken);
          this.notify("LOGIN_SUCCESS", this.user);
        } else if (isHttpOnlyMode) {
          // In httpOnly mode, assume valid if we have user data
          // Token validation happens server-side
          this.user = authData;
          this.setupTokenRefresh(null); // Pass null for httpOnly mode
          this.notify("LOGIN_SUCCESS", this.user);
        } else {
          this.clearStorage();
        }
      }
    } catch (error) {
      this.reportError("CLIENT", "Failed to initialize auth", error.message);
      this.clearStorage();
    } finally {
      this.loading = false;
      this.notify("LOADING_END");
    }
  }

  setupStorageListener() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        // Listen for changes in any of the storage keys
        const accessTokenKey = this.config.storageConfig.accessToken.key;
        const userKey = this.config.storageConfig.user.key;

        if (e.key === accessTokenKey || e.key === userKey) {
          if (e.newValue === null) {
            this.user = null;
            this.notify("LOGOUT_SUCCESS");
          } else if (e.oldValue === null && e.newValue) {
            this.initialize();
          }
        }
      });
    }
  }

  async login(credentials, options = {}) {
    try {
      this.loading = true;
      this.notify("LOGIN_START");

      const { apiEndpoint, customLogin } = options;
      let userData, accessToken, refreshToken;

      if (customLogin || this.config.customLogin) {
        const loginFn = customLogin || this.config.customLogin;
        const result = await loginFn(credentials);
        userData = result.user;
        accessToken = result.token || result.accessToken;
        refreshToken = result.refreshToken;
      } else if (apiEndpoint) {
        const headers = {
          "Content-Type": "application/json",
        };

        // Add CSRF token if enabled
        const csrfHeaders = this.csrfHandler.getHeaders(headers);

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: csrfHeaders,
          body: JSON.stringify(credentials),
          credentials: this.config.storageConfig.refreshToken.storage === 'httpOnly' ? 'include' : 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`Login failed: ${response.statusText}`);
        }

        // Process CSRF token from response
        this.csrfHandler.processResponse(response);

        const result = await response.json();
        userData = result.user;
        accessToken = result.token || result.accessToken;
        refreshToken = result.refreshToken;
      } else {
        // Mock login for development
        userData = {
          id: Date.now(),
          name: credentials.name || credentials.username || "User",
          email: credentials.email || "user@example.com",
          roles: credentials.roles || ["user"],
          permissions: [],
          lastLogin: new Date().toISOString(),
        };
        accessToken = this.generateMockToken(userData, 'access');
        refreshToken = this.generateMockToken(userData, 'refresh');
      }

      // Only expand permissions from roles if backend didn't provide them
      if (!userData.permissions || userData.permissions.length === 0) {
        userData.permissions = this.expandPermissions(userData.roles || []);
      }

      this.user = userData;
      this.persistToStorage(userData, accessToken, refreshToken);
      this.setupTokenRefresh(accessToken);

      this.notify("LOGIN_SUCCESS", userData);
      return { success: true, user: userData, token: accessToken, accessToken, refreshToken };
    } catch (error) {
      this.reportError("AUTHENTICATION", "Login failed", error.message);
      this.notify("LOGIN_ERROR", error);
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
      this.notify("LOADING_END");
    }
  }

  async logout(options = {}) {
    try {
      this.loading = true;
      this.notify("LOGOUT_START");

      const { apiEndpoint } = options;

      if (this.tokenRefreshTimer) {
        clearTimeout(this.tokenRefreshTimer);
        this.tokenRefreshTimer = null;
      }

      if (apiEndpoint || this.config.customLogout) {
        try {
          const headers = {
            Authorization: `Bearer ${this.getToken()}`,
          };

          // Add CSRF token if enabled
          const csrfHeaders = this.csrfHandler.getHeaders(headers);

          if (this.config.customLogout) {
            await this.config.customLogout();
          } else {
            await fetch(apiEndpoint, {
              method: "POST",
              headers: csrfHeaders,
              credentials: this.config.storageConfig.refreshToken.storage === 'httpOnly' ? 'include' : 'same-origin',
            });
          }
        } catch (error) {
          this.reportError("NETWORK", "Server logout failed", error.message);
        }
      }

      this.user = null;
      this.clearStorage();
      this.csrfHandler.removeToken();
      this.notify("LOGOUT_SUCCESS");
      return { success: true };
    } catch (error) {
      this.reportError("CLIENT", "Logout failed", error.message);
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
      this.notify("LOADING_END");
    }
  }

  async updateProfile(updates, options = {}) {
    try {
      this.notify("PROFILE_UPDATE_START");

      const { apiEndpoint, customUpdate } = options;

      if (customUpdate) {
        const updatedUser = await customUpdate(this.user, updates);
        this.user = updatedUser;
      } else if (apiEndpoint) {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        };

        // Add CSRF token if enabled
        const csrfHeaders = this.csrfHandler.getHeaders(headers);

        const response = await fetch(apiEndpoint, {
          method: "PUT",
          headers: csrfHeaders,
          body: JSON.stringify(updates),
          credentials: this.config.storageConfig.refreshToken.storage === 'httpOnly' ? 'include' : 'same-origin',
        });

        if (!response.ok) {
          throw new Error("Profile update failed");
        }

        // Process CSRF token from response
        this.csrfHandler.processResponse(response);

        const updatedUser = await response.json();
        this.user = updatedUser;
      } else {
        this.user = { ...this.user, ...updates };
        // Only expand permissions from roles if not explicitly provided in updates
        if (updates.roles && !updates.permissions) {
          this.user.permissions = this.expandPermissions(updates.roles);
        }
      }

      this.userStorage.setItem(this.config.storageConfig.user.key, JSON.stringify(this.user));
      this.notify("PROFILE_UPDATE_SUCCESS", this.user);
      return { success: true, user: this.user };
    } catch (error) {
      this.reportError("CLIENT", "Profile update failed", error.message);
      this.notify("PROFILE_UPDATE_ERROR", error);
      return { success: false, error: error.message };
    }
  }

  async refreshToken(options = {}) {
    try {
      const { apiEndpoint, customRefresh } = options;
      const currentAccessToken = this.accessTokenStorage.getItem(this.config.storageConfig.accessToken.key);
      const isHttpOnlyMode = this.config.storageConfig.refreshToken.storage === 'httpOnly';

      // For httpOnly mode, we don't need the current token in the request
      // The refresh token is sent automatically as an httpOnly cookie
      if (!currentAccessToken && !isHttpOnlyMode) {
        throw new Error("No token to refresh");
      }

      let newAccessToken, newRefreshToken;

      if (customRefresh || this.config.customRefresh) {
        const refreshFn = customRefresh || this.config.customRefresh;
        const result = await refreshFn(currentAccessToken);

        // Support both old format (string) and new format (object)
        if (typeof result === 'string') {
          newAccessToken = result;
        } else {
          newAccessToken = result.accessToken || result.token;
          newRefreshToken = result.refreshToken;
        }
      } else if (apiEndpoint) {
        const headers = {};

        // Only add Authorization header if not using httpOnly mode
        if (!isHttpOnlyMode && currentAccessToken) {
          headers.Authorization = `Bearer ${currentAccessToken}`;
        }

        // Add CSRF token if enabled
        const csrfHeaders = this.csrfHandler.getHeaders(headers);

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: csrfHeaders,
          credentials: isHttpOnlyMode ? 'include' : 'same-origin',
        });

        if (!response.ok) {
          throw new Error("Token refresh failed");
        }

        // Process CSRF token from response
        this.csrfHandler.processResponse(response);

        const result = await response.json();
        newAccessToken = result.accessToken || result.token;
        newRefreshToken = result.refreshToken;
      } else {
        // Mock refresh for development
        newAccessToken = this.generateMockToken(this.user, 'access');
        if (this.config.tokenRotation) {
          newRefreshToken = this.generateMockToken(this.user, 'refresh');
        }
      }

      // Store new access token
      this.accessTokenStorage.setItem(this.config.storageConfig.accessToken.key, newAccessToken);

      // Store new refresh token if rotation is enabled and we got one
      if (this.config.tokenRotation && newRefreshToken && this.config.storageConfig.refreshToken.storage !== 'httpOnly') {
        this.refreshTokenStorage.setItem(this.config.storageConfig.refreshToken.key, newRefreshToken);
      }

      this.setupTokenRefresh(newAccessToken);
      this.notify("TOKEN_REFRESHED", { token: newAccessToken, refreshToken: newRefreshToken });
      return true;
    } catch (error) {
      this.reportError("AUTHENTICATION", "Token refresh failed", error.message);
      await this.logout();
      return false;
    }
  }

  expandPermissions(roles) {
    const permissions = new Set();

    roles.forEach((role) => {
      if (this.config.permissionHierarchy[role]) {
        this.config.permissionHierarchy[role].forEach((permission) => {
          permissions.add(permission);
        });
      }
    });

    return Array.from(permissions);
  }

  hasRole(role) {
    return this.user?.roles?.includes(role) || false;
  }

  hasPermission(permission) {
    return this.user?.permissions?.includes(permission) || false;
  }

  hasAnyRole(roles) {
    return roles.some((role) => this.hasRole(role));
  }

  hasAnyPermission(permissions) {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasAllRoles(roles) {
    return roles.every((role) => this.hasRole(role));
  }

  hasAllPermissions(permissions) {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  generateMockToken(user, type = 'access') {
    const header = btoa(JSON.stringify({ typ: "JWT", alg: "HS256" }));

    // Different expiration times for access vs refresh tokens
    const expiresIn = type === 'access' ? 60 * 15 : 60 * 60 * 24 * 7; // 15 min vs 7 days

    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        name: user.name,
        roles: user.roles,
        type: type,
        exp: Math.floor(Date.now() / 1000) + expiresIn,
        iat: Math.floor(Date.now() / 1000),
      })
    );
    const signature = btoa(`mock_signature_${type}_` + Date.now());
    return `${header}.${payload}.${signature}`;
  }

  async validateToken(token) {
    try {
      if (!token) return false;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  setupTokenRefresh(token) {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // For httpOnly mode, we still set up refresh but with default interval
    const isHttpOnlyMode = this.config.storageConfig.refreshToken.storage === 'httpOnly';

    if (isHttpOnlyMode) {
      // Use configured refresh interval
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken();
      }, this.config.refreshInterval);
      return;
    }

    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiresAt = payload.exp * 1000;
      const refreshAt = expiresAt - 5 * 60 * 1000; // Refresh 5 minutes before expiration
      const timeUntilRefresh = refreshAt - Date.now();

      if (timeUntilRefresh > 0) {
        this.tokenRefreshTimer = setTimeout(() => {
          this.refreshToken();
        }, timeUntilRefresh);
      }
    } catch (error) {
      this.reportError(
        "CLIENT",
        "Failed to setup token refresh",
        error.message
      );
    }
  }

  persistToStorage(user, accessToken, refreshToken) {
    // Store user data
    this.userStorage.setItem(this.config.storageConfig.user.key, JSON.stringify(user));

    // Store access token
    if (accessToken) {
      this.accessTokenStorage.setItem(this.config.storageConfig.accessToken.key, accessToken);
    }

    // Store refresh token (only if not using httpOnly cookies)
    if (refreshToken && this.config.storageConfig.refreshToken.storage !== 'httpOnly') {
      this.refreshTokenStorage.setItem(this.config.storageConfig.refreshToken.key, refreshToken);
    }
  }

  clearStorage() {
    // Clear user data
    this.userStorage.removeItem(this.config.storageConfig.user.key);

    // Clear access token
    this.accessTokenStorage.removeItem(this.config.storageConfig.accessToken.key);

    // Clear refresh token (only if not using httpOnly cookies)
    if (this.config.storageConfig.refreshToken.storage !== 'httpOnly') {
      this.refreshTokenStorage.removeItem(this.config.storageConfig.refreshToken.key);
    }

    // For backward compatibility with legacy code
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.config.tokenKey);
      localStorage.removeItem(this.config.userKey);
    }
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.accessTokenStorage.getItem(this.config.storageConfig.accessToken.key);
  }

  getRefreshToken() {
    if (this.config.storageConfig.refreshToken.storage === 'httpOnly') {
      console.info('[AuthStore] Refresh token is stored in httpOnly cookie and cannot be accessed from JavaScript');
      return null;
    }
    return this.refreshTokenStorage.getItem(this.config.storageConfig.refreshToken.key);
  }

  isAuthenticated() {
    return !!this.user;
  }

  isLoading() {
    return this.loading;
  }
}

let globalAuthStore = null;

export const createAuthStore = (config = {}) => {
  return new AuthStore(config);
};

export const getAuthStore = () => {
  if (!globalAuthStore) {
    globalAuthStore = new AuthStore();
  }
  return globalAuthStore;
};

export const initializeAuth = (config = {}) => {
  globalAuthStore = new AuthStore(config);
  return globalAuthStore;
};
