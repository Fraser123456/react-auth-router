declare module "react-auth-router" {
  import { ReactNode, ComponentType } from "react";

  export interface User {
    id: string | number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
    [key: string]: any;
  }

  export interface AuthConfig {
    tokenKey?: string;
    userKey?: string;
    refreshInterval?: number;
    permissionHierarchy?: Record<string, string[]>;
  }

  export interface LoginCredentials {
    [key: string]: any;
  }

  export interface LoginOptions {
    apiEndpoint?: string;
    customLogin?: (
      credentials: LoginCredentials
    ) => Promise<{ user: User; token: string }>;
  }

  export interface LogoutOptions {
    apiEndpoint?: string;
    everywhere?: boolean;
  }

  export class AuthStore {
    constructor(config?: AuthConfig);
    subscribe(callback: (update: any) => void): () => void;
    login(
      credentials: LoginCredentials,
      options?: LoginOptions
    ): Promise<{
      success: boolean;
      user?: User;
      token?: string;
      error?: string;
    }>;
    logout(
      options?: LogoutOptions
    ): Promise<{ success: boolean; error?: string }>;
    updateProfile(
      updates: Partial<User>,
      options?: any
    ): Promise<{ success: boolean; user?: User; error?: string }>;
    hasRole(role: string): boolean;
    hasPermission(permission: string): boolean;
    hasAnyRole(roles: string[]): boolean;
    hasAnyPermission(permissions: string[]): boolean;
    hasAllRoles(roles: string[]): boolean;
    hasAllPermissions(permissions: string[]): boolean;
    getUser(): User | null;
    getToken(): string | null;
    isAuthenticated(): boolean;
    isLoading(): boolean;
    setErrorHandler(handler: (error: any) => void): void;
  }

  export function createAuthStore(config?: AuthConfig): AuthStore;
  export function getAuthStore(): AuthStore;
  export function initializeAuth(config?: AuthConfig): AuthStore;

  export interface AuthState {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (
      credentials: LoginCredentials,
      options?: LoginOptions
    ) => Promise<any>;
    logout: (options?: LogoutOptions) => Promise<any>;
    updateProfile: (updates: Partial<User>) => Promise<any>;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllRoles: (roles: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    getToken: () => string | null;
  }

  export function useAuth(): AuthState;
  export function usePermissions(): any;
  export function useAuthLoading(): boolean;
  export function useAuthUser(): User | null;

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
    meta?: { title?: string; description?: string };
    breadcrumb?: string[];
    customGuard?: (context: any) => boolean;
  }

  export interface RouteConfig {
    public: Route[];
    protected: Route[];
  }

  export interface RouterProps {
    children: ReactNode;
    basePath?: string;
    enableHistory?: boolean;
  }

  export interface RouterState {
    currentPath: string;
    params: Record<string, string>;
    query: Record<string, string>;
    navigate: (path: string, options?: any) => void;
    basePath: string;
  }

  export function Router(props: RouterProps): JSX.Element;
  export function useRouter(): RouterState;
  export function useNavigate(): RouterState["navigate"];
  export function useParams(): RouterState["params"];
  export function useQuery(): RouterState["query"];

  export interface LinkProps {
    to: string;
    replace?: boolean;
    query?: Record<string, string>;
    state?: any;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    children: ReactNode;
    [key: string]: any;
  }

  export function Link(props: LinkProps): JSX.Element;

  export interface RouteGuardProps {
    route: Route;
    children: ReactNode;
    fallback?: ReactNode;
    unauthorizedComponent?: ComponentType<{ route: Route }>;
    forbiddenComponent?: ComponentType<{ route: Route; message?: string }>;
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
  }

  export function Navigation(props: NavigationProps): JSX.Element;

  export interface BreadcrumbProps {
    routeConfig?: RouteConfig;
    className?: string,
    customBreadcrumbComponent?: CustomBreadcrumbComponent,
    showHome?: boolean,
    homeTitle?: string,
    homePath?: string
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
    props: ProtectedComponentProps
  ): JSX.Element;

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
  };

  export function ErrorProvider(props: { children: ReactNode, toastConfig?: any }): JSX.Element;
  export function ErrorBoundary(props: {
    children: ReactNode;
    level?: string;
    fallback?: ComponentType;
  }): JSX.Element;
  export function useError(): any;
  export function useApiError(): any;

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
    findMatchingRoute: (path: string, routes: Route[]) => Route | undefined;
    extractParams: (path: string, routePath: string) => Record<string, string>;
    generateBreadcrumbs: (route: Route, routes: Route[]) => any[];
    canAccessRoute: (route: Route, context: RouteAccessContext) => boolean;
    filterAccessibleRoutes: (routes: Route[], context: RouteAccessContext) => Route[];
  };

  export const defaultConfig: any;
}
