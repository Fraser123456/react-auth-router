declare module "react-auth-router" {
  import { ReactNode, ComponentType, JSX } from "react";

  // ============================================================================
  // User & Authentication Types
  // ============================================================================

  export interface User {
    id: string | number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
    [key: string]: any;
  }

  // ============================================================================
  // Storage Strategy Types (v2.4.0+)
  // ============================================================================

  export type StorageType =
    | "memory"
    | "sessionStorage"
    | "localStorage"
    | "httpOnly";

  export type SecurityMode = "legacy" | "recommended" | "custom";

  export interface StorageStrategy {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
  }

  export interface TokenStorageConfig {
    storage: StorageType;
    key: string | null;
  }

  export interface FullStorageConfig {
    accessToken?: TokenStorageConfig;
    refreshToken?: TokenStorageConfig;
    user?: TokenStorageConfig;
  }

  export class MemoryStorage implements StorageStrategy {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
  }

  export class SessionStorageStrategy implements StorageStrategy {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
  }

  export class LocalStorageStrategy implements StorageStrategy {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
  }

  export class HttpOnlyCookieStrategy implements StorageStrategy {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
  }

  export function createStorageStrategy(type?: StorageType): StorageStrategy;
  export function getRecommendedStorageConfig(): FullStorageConfig;
  export function getLegacyStorageConfig(): FullStorageConfig;

  // ============================================================================
  // CSRF Handler Types (v2.4.0+)
  // ============================================================================

  export interface CsrfConfig {
    enabled?: boolean;
    tokenKey?: string;
    headerName?: string;
    cookieName?: string;
    storage?: Storage;
  }

  export class CsrfHandler {
    constructor(config?: CsrfConfig);
    getToken(): string | null;
    setToken(token: string): void;
    removeToken(): void;
    extractTokenFromCookie(): string | null;
    extractTokenFromResponse(response: Response): string | null;
    getHeaders(
      existingHeaders?: Record<string, string>,
    ): Record<string, string>;
    processResponse(response: Response): void;
    validateToken(token: string): boolean;
  }

  export function createCsrfHandler(config?: CsrfConfig): CsrfHandler;

  // ============================================================================
  // Token Claim Configuration (v2.8.0+)
  // ============================================================================

  export type TokenClaimResolver = string | ((claims: Record<string, any>) => string[]);

  export interface TokenClaimsConfig {
    /** Path to roles in the JWT payload. Dot-notation string (e.g. "app_metadata.roles")
     *  or a function that receives the decoded claims and returns a string array. */
    roles?: TokenClaimResolver;
    /** Path to permissions in the JWT payload. Dot-notation string
     *  or a function that receives the decoded claims and returns a string array. */
    permissions?: TokenClaimResolver;
  }

  // ============================================================================
  // Enhanced Auth Configuration (v2.4.0+)
  // ============================================================================

  export interface AuthConfig {
    // Legacy keys (backward compatible)
    tokenKey?: string;
    userKey?: string;
    refreshInterval?: number;
    permissionHierarchy?: Record<string, string[]>;

    // New security features (v2.4.0+)
    securityMode?: SecurityMode;
    secureTokens?: boolean;
    storageConfig?: FullStorageConfig;
    separateRefreshToken?: boolean;
    tokenRotation?: boolean;

    // CSRF configuration
    csrf?: CsrfConfig;

    // Token claim paths (v2.8.0+)
    tokenClaims?: TokenClaimsConfig;

    // Custom functions
    customLogin?: (credentials: LoginCredentials) => Promise<{
      user?: User;
      token?: string;
      accessToken?: string;
      refreshToken?: string;
    }>;
    customLogout?: () => Promise<void>;
    customRefresh?: (currentToken?: string) => Promise<
      | string
      | {
          user?: User;
          accessToken?: string;
          token?: string;
          refreshToken?: string;
        }
    >;
  }

  // ============================================================================
  // Login & Logout Types
  // ============================================================================

  export interface LoginCredentials {
    [key: string]: any;
  }

  export interface LoginOptions {
    apiEndpoint?: string;
    customLogin?: (credentials: LoginCredentials) => Promise<{
      user: User;
      token?: string;
      accessToken?: string;
      refreshToken?: string;
    }>;
  }

  export interface LoginResult {
    success: boolean;
    user?: User;
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }

  export interface LogoutOptions {
    apiEndpoint?: string;
    everywhere?: boolean;
  }

  export interface LogoutResult {
    success: boolean;
    error?: string;
  }

  export interface UpdateProfileOptions {
    apiEndpoint?: string;
    customUpdate?: (user: User, updates: Partial<User>) => Promise<User>;
  }

  export interface UpdateProfileResult {
    success: boolean;
    user?: User;
    error?: string;
  }

  export interface RefreshTokenOptions {
    apiEndpoint?: string;
    customRefresh?: (currentToken?: string) => Promise<
      | string
      | {
          accessToken?: string;
          token?: string;
          refreshToken?: string;
        }
      | null
    >;
  }

  // ============================================================================
  // AuthStore Class (Enhanced v2.4.0+)
  // ============================================================================

  export class AuthStore {
    constructor(config?: AuthConfig);

    // Subscriber pattern
    subscribe(callback: (update: any) => void): () => void;
    notify(changeType: string, data?: any): void;

    // Error handling
    setErrorHandler(handler: (error: any) => void): void;
    reportError(type: string, message: string, details?: any): void;

    // Authentication methods
    login(
      credentials: LoginCredentials,
      options?: LoginOptions,
    ): Promise<LoginResult>;

    logout(options?: LogoutOptions): Promise<LogoutResult>;

    updateProfile(
      updates: Partial<User>,
      options?: UpdateProfileOptions,
    ): Promise<UpdateProfileResult>;

    refreshToken(options?: RefreshTokenOptions): Promise<boolean>;

    // Permission checks
    hasRole(role: string): boolean;
    hasPermission(permission: string): boolean;
    hasAnyRole(roles: string[]): boolean;
    hasAnyPermission(permissions: string[]): boolean;
    hasAllRoles(roles: string[]): boolean;
    hasAllPermissions(permissions: string[]): boolean;
    expandPermissions(roles: string[]): string[];

    // Token management
    generateMockToken(user: User, type?: "access" | "refresh"): string;
    validateToken(token: string): Promise<boolean>;
    setupTokenRefresh(token: string | null): void;
    decodeToken(token: string): Record<string, any> | null;
    getTokenRoles(): string[];
    getTokenPermissions(): string[];

    // Storage
    persistToStorage(
      user: User,
      accessToken: string,
      refreshToken?: string,
    ): void;
    clearStorage(): void;

    // Getters
    getUser(): User | null;
    getToken(): string | null;
    getRefreshToken(): string | null;
    isAuthenticated(): boolean;
    isLoading(): boolean;
  }

  export function createAuthStore(config?: AuthConfig): AuthStore;
  export function getAuthStore(): AuthStore;
  export function initializeAuth(config?: AuthConfig): AuthStore;

  // ============================================================================
  // Auth Hooks
  // ============================================================================

  export interface AuthState {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (
      credentials: LoginCredentials,
      options?: LoginOptions,
    ) => Promise<LoginResult>;
    logout: (options?: LogoutOptions) => Promise<LogoutResult>;
    updateProfile: (
      updates: Partial<User>,
      options?: UpdateProfileOptions,
    ) => Promise<UpdateProfileResult>;
    refreshToken: (options?: RefreshTokenOptions) => Promise<boolean>;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllRoles: (roles: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    getToken: () => string | null;
    getRefreshToken: () => string | null;
  }

  export interface PermissionsState {
    roles: string[];
    permissions: string[];
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllRoles: (roles: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
  }

  export function useAuth(): AuthState;
  export function usePermissions(): PermissionsState;
  export function useAuthLoading(): boolean;
  export function useAuthUser(): User | null;

  // ============================================================================
  // Route Types
  // ============================================================================

  export interface Route {
    path: string;
    component: string | ComponentType;
    title: string;
    icon?: ComponentType;
    showInNav?: boolean;
    exact?: boolean;
    requireAuth?: boolean;
    requireGuest?: boolean;
    authenticatedRedirect?: string;
    requiredRoles?: string[];
    requiredPermissions?: string[];
    requireAll?: boolean;
    children?: Route[];
    parent?: Route;
    fullPath?: string;
    meta?: { title?: string; description?: string };
    breadcrumb?: string[];
    customGuard?: (context: GuardContext) => boolean;
    layout?: boolean; // v2.5.0+ - Enable layout mode (render parent with Outlet for children)
    index?: boolean; // v2.5.0+ - Mark as index route (default child when hitting parent path)
  }

  export interface RouteConfig {
    public: Route[];
    protected: Route[];
  }

  export interface GuardContext {
    isAuthenticated: boolean;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllRoles?: (roles: string[]) => boolean;
    hasAllPermissions?: (permissions: string[]) => boolean;
    user: User | null;
  }

  // ============================================================================
  // Router Types
  // ============================================================================

  export interface RouterProps {
    children: ReactNode;
    basePath?: string;
    enableHistory?: boolean;
  }

  export interface NavigateOptions {
    replace?: boolean;
    query?: Record<string, string>;
    hash?: string;
    state?: any;
  }

  export interface RouterState {
    currentPath: string;
    params: Record<string, string>;
    query: Record<string, string>;
    hash: string;
    hashParams: Record<string, string>;
    navigate: (path: string, options?: NavigateOptions) => void;
    goBack: () => void;
    goForward: () => void;
    go: (delta: number) => void;
    basePath: string;
    updateParams: (params: Record<string, string>) => void;
  }

  export interface HistoryState {
    goBack: () => void;
    goForward: () => void;
    go: (delta: number) => void;
  }

  export function Router(props: RouterProps): JSX.Element;
  export function useRouter(): RouterState;
  export function useNavigate(): (
    path: string,
    options?: NavigateOptions,
  ) => void;
  export function useGoBack(): () => void;
  export function useGoForward(): () => void;
  export function useHistory(): HistoryState;
  export function useParams(): Record<string, string>;
  export function useQuery(): Record<string, string>;
  export function useHash(): string;
  export function useHashParams(): Record<string, string>;

  // ============================================================================
  // Nested Route Types (v2.5.0+)
  // ============================================================================

  export interface RouteContextValue {
    route: Route;
    params: Record<string, string>;
    query: Record<string, string>;
    childRoutes: Route[];
    currentPath: string;
  }

  export interface RouteProviderProps {
    route: Route;
    params: Record<string, string>;
    query: Record<string, string>;
    childRoutes: Route[];
    currentPath: string;
    children: ReactNode;
  }

  export interface OutletProps {
    fallback?: ReactNode | ComponentType;
  }

  export interface OutletWithFallbackProps {
    message?: string;
    fallback?: ComponentType;
  }

  export function RouteProvider(props: RouteProviderProps): JSX.Element;
  export function Outlet(props?: OutletProps): JSX.Element | null;
  export function OutletWithFallback(
    props?: OutletWithFallbackProps,
  ): JSX.Element;
  export function useRouteContext(): RouteContextValue;
  export function useHasChildRoutes(): boolean;

  // ============================================================================
  // Component Types
  // ============================================================================

  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
    replace?: boolean;
    query?: Record<string, string>;
    hash?: string;
    state?: any;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    children: ReactNode;
  }

  export function Link(props: LinkProps): JSX.Element;

  export interface RouteGuardProps {
    route: Route;
    children: ReactNode;
    fallback?: ReactNode;
    unauthorizedComponent?: ComponentType<{
      route: Route;
      onRetry?: () => void;
    }>;
    forbiddenComponent?: ComponentType<{
      route: Route;
      message?: string;
      onRetry?: () => void;
    }>;
  }

  export function RouteGuard(props: RouteGuardProps): JSX.Element;

  export interface RoutesProps {
    routeConfig: RouteConfig;
    pageComponents?: Record<string, ComponentType>;
    notFoundComponent?: ComponentType;
    loadingComponent?: ComponentType;
    hideUnauthorizedRoutes?: boolean;
    defaultRoute?: string;
    authenticatedDefaultRoute?: string;
    unauthenticatedDefaultRoute?: string;
  }

  export function Routes(props: RoutesProps): JSX.Element;

  export interface NavigationProps {
    routeConfig: RouteConfig;
    className?: string;
    mobileBreakpoint?: number;
    showIcons?: boolean;
    brandComponent?: ReactNode;
    customLogoutComponent?: (props: {
      user: User | null;
      onLogout: () => void;
    }) => ReactNode;
    style?: React.CSSProperties;
  }

  export function Navigation(props: NavigationProps): JSX.Element;

  export interface BreadcrumbItem {
    title: string;
    path: string;
    route: Route | null;
  }

  export interface BreadcrumbProps {
    routeConfig?: RouteConfig;
    className?: string;
    customBreadcrumbComponent?: ComponentType<{
      breadcrumbs: BreadcrumbItem[];
      navigate: (path: string) => void;
    }>;
    showHome?: boolean;
    homeTitle?: string;
    homePath?: string;
  }

  export function Breadcrumb(props?: BreadcrumbProps): JSX.Element;

  export interface ProtectedComponentProps {
    children: ReactNode;
    requiredRoles?: string[];
    requiredPermissions?: string[];
    requireAll?: boolean;
    fallback?: ReactNode;
  }

  export function ProtectedComponent(
    props: ProtectedComponentProps,
  ): JSX.Element;

  // ============================================================================
  // Error Management Types
  // ============================================================================

  export const ErrorTypes: {
    NETWORK: string;
    VALIDATION: string;
    AUTHENTICATION: string;
    AUTHORIZATION: string;
    NOT_FOUND: string;
    SERVER: string;
    CLIENT: string;
    UNKNOWN: string;
    SUCCESS: string;
    INFO: string;
    WARNING: string;
  };

  export interface ToastConfig {
    position?:
      | "top-left"
      | "top-right"
      | "top-center"
      | "bottom-left"
      | "bottom-right"
      | "bottom-center";
    autoClose?: number | false;
    hideProgressBar?: boolean;
    closeOnClick?: boolean;
    pauseOnHover?: boolean;
    draggable?: boolean;
    theme?: "light" | "dark" | "colored";
    className?: string;
  }

  export interface ToastOptions extends ToastConfig {
    details?: any;
    stack?: string;
  }

  export interface ErrorState {
    errors: any[];
    globalError: any | null;
    addError: (message: string, options?: ToastOptions) => string;
    addSuccess: (message: string, options?: ToastOptions) => string;
    addWarning: (message: string, options?: ToastOptions) => string;
    addInfo: (message: string, options?: ToastOptions) => string;
    clearAllErrors: () => void;
    setFatalError: (error: any) => void;
  }

  export interface ApiErrorState {
    handleApiError: (error: any, context?: string) => void;
  }

  export interface ErrorProviderProps {
    children: ReactNode;
    toastConfig?: ToastConfig;
  }

  export function ErrorProvider(props: ErrorProviderProps): JSX.Element;

  export interface ErrorBoundaryProps {
    children: ReactNode;
    level?: string;
    fallback?: ComponentType<{ error: Error; onRetry: () => void }>;
  }

  export function ErrorBoundary(props: ErrorBoundaryProps): JSX.Element;

  export function useError(): ErrorState;
  export function useApiError(): ApiErrorState;

  // ============================================================================
  // Utility Types
  // ============================================================================

  export function createRouteConfig(routes: {
    public?: Route[];
    protected?: Route[];
  }): RouteConfig;

  export interface RouteAccessContext {
    isAuthenticated: boolean;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllRoles: (roles: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    user: User | null;
  }

  export const routeUtils: {
    getAllRoutes: (routeConfig: RouteConfig) => Route[];
    findMatchingRoute: (path: string, routes: Route[]) => Route | null;
    extractParams: (path: string, routePath: string) => Record<string, string>;
    generateBreadcrumbs: (route: Route, routes: Route[]) => BreadcrumbItem[];
    canAccessRoute: (route: Route, context: RouteAccessContext) => boolean;
    filterAccessibleRoutes: (
      routes: Route[],
      context: RouteAccessContext,
    ) => Route[];
  };

  export interface DefaultConfig {
    auth: {
      tokenKey: string;
      userKey: string;
      refreshInterval: number;
      permissionHierarchy: Record<string, string[]>;
    };
    routing: {
      basePath: string;
      enableBreadcrumbs: boolean;
      enableMetadata: boolean;
    };
    ui: {
      theme: string;
      showIcons: boolean;
      mobileBreakpoint: number;
    };
  }

  export const defaultConfig: DefaultConfig;
}
