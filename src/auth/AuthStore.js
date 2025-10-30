export class AuthStore {
  constructor(config = {}) {
    this.config = {
      tokenKey: "auth_token",
      userKey: "auth_state",
      refreshInterval: 15 * 60 * 1000,
      permissionHierarchy: {
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
      ...config,
    };
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

      const storedAuth = localStorage.getItem(this.config.userKey);
      const storedToken = localStorage.getItem(this.config.tokenKey);

      if (storedAuth && storedToken) {
        const authData = JSON.parse(storedAuth);

        if (await this.validateToken(storedToken)) {
          this.user = authData;
          this.setupTokenRefresh(storedToken);
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
        if (e.key === this.config.tokenKey) {
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
      let userData, token;

      if (customLogin) {
        const result = await customLogin(credentials);
        userData = result.user;
        token = result.token;
      } else if (apiEndpoint) {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          throw new Error(`Login failed: ${response.statusText}`);
        }

        const result = await response.json();
        userData = result.user;
        token = result.token;
      } else {
        userData = {
          id: Date.now(),
          name: credentials.name || credentials.username || "User",
          email: credentials.email || "user@example.com",
          roles: credentials.roles || ["user"],
          permissions: [],
          lastLogin: new Date().toISOString(),
        };
        token = this.generateMockToken(userData);
      }

      // Only expand permissions from roles if backend didn't provide them
      if (!userData.permissions || userData.permissions.length === 0) {
        userData.permissions = this.expandPermissions(userData.roles || []);
      }

      this.user = userData;
      this.persistToStorage(userData, token);
      this.setupTokenRefresh(token);

      this.notify("LOGIN_SUCCESS", userData);
      return { success: true, user: userData, token };
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

      if (apiEndpoint) {
        try {
          await fetch(apiEndpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                this.config.tokenKey
              )}`,
            },
          });
        } catch (error) {
          this.reportError("NETWORK", "Server logout failed", error.message);
        }
      }

      this.user = null;
      this.clearStorage();
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
        const response = await fetch(apiEndpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              this.config.tokenKey
            )}`,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error("Profile update failed");
        }

        const updatedUser = await response.json();
        this.user = updatedUser;
      } else {
        this.user = { ...this.user, ...updates };
        // Only expand permissions from roles if not explicitly provided in updates
        if (updates.roles && !updates.permissions) {
          this.user.permissions = this.expandPermissions(updates.roles);
        }
      }

      localStorage.setItem(this.config.userKey, JSON.stringify(this.user));
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
      const currentToken = localStorage.getItem(this.config.tokenKey);

      if (!currentToken) {
        throw new Error("No token to refresh");
      }

      let newToken;

      if (customRefresh) {
        newToken = await customRefresh(currentToken);
      } else if (apiEndpoint) {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` },
        });

        if (!response.ok) {
          throw new Error("Token refresh failed");
        }

        const result = await response.json();
        newToken = result.token;
      } else {
        newToken = this.generateMockToken(this.user);
      }

      localStorage.setItem(this.config.tokenKey, newToken);
      this.setupTokenRefresh(newToken);
      this.notify("TOKEN_REFRESHED", { token: newToken });
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

  generateMockToken(user) {
    const header = btoa(JSON.stringify({ typ: "JWT", alg: "HS256" }));
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        name: user.name,
        roles: user.roles,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        iat: Math.floor(Date.now() / 1000),
      })
    );
    const signature = btoa("mock_signature_" + Date.now());
    return `${header}.${payload}.${signature}`;
  }

  async validateToken(token) {
    try {
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

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiresAt = payload.exp * 1000;
      const refreshAt = expiresAt - 5 * 60 * 1000;
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

  persistToStorage(user, token) {
    localStorage.setItem(this.config.userKey, JSON.stringify(user));
    localStorage.setItem(this.config.tokenKey, token);
  }

  clearStorage() {
    localStorage.removeItem(this.config.userKey);
    localStorage.removeItem(this.config.tokenKey);
  }

  getUser() {
    return this.user;
  }
  getToken() {
    return localStorage.getItem(this.config.tokenKey);
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
