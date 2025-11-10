export {
  AuthStore,
  createAuthStore,
  getAuthStore,
  initializeAuth,
} from "./AuthStore";
export { useAuth, useAuthLoading, useAuthUser, usePermissions } from "./hooks";

// Token storage strategies (v2.4.0+)
export {
  createStorageStrategy,
  getRecommendedStorageConfig,
  getLegacyStorageConfig,
  MemoryStorage,
  SessionStorageStrategy,
  LocalStorageStrategy,
  HttpOnlyCookieStrategy,
} from "./TokenStorage";

// CSRF handler (v2.4.0+)
export { CsrfHandler, createCsrfHandler } from "./CsrfHandler";
