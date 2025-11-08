// Auth exports
export {
  AuthStore,
  createAuthStore,
  getAuthStore,
  initializeAuth,
  useAuth,
  useAuthLoading,
  useAuthUser,
  usePermissions,
} from "./auth";

// Router exports
export {
  Router,
  Routes,
  RouteGuard,
  Link,
  useRouter,
  useNavigate,
  useGoBack,
  useGoForward,
  useHistory,
  useParams,
  useQuery,
} from "./routing";

// Component exports
export {
  Breadcrumb,
  Navigation,
  ProtectedComponent,
} from "./components";

// Error management exports
export {
  ErrorProvider,
  ErrorBoundary,
  useError,
  useApiError,
  ErrorTypes,
} from "./error-management";

// Utility exports
export { createRouteConfig, routeUtils } from "./utils";

// Default configuration
export const defaultConfig = {
  auth: {
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
  },
  routing: {
    basePath: "",
    enableBreadcrumbs: true,
    enableMetadata: true,
  },
  ui: {
    theme: "default",
    showIcons: true,
    mobileBreakpoint: 768,
  },
};
