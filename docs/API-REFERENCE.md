# API Reference

> Complete API documentation for React Auth Router

## Table of Contents

- [AuthStore Class](#authstore-class)
- [Route Utilities](#route-utilities-routeutils)
- [Route Configuration](#route-configuration)
- [Configuration Options](#configuration-options)

## AuthStore Class

### Constructor

```typescript
new AuthStore(config?: AuthConfig)
```

### Methods

**`login(credentials: LoginCredentials, options?: LoginOptions): Promise<LoginResult>`**

- Authenticates user with provided credentials
- Returns success/failure result with user data and token

**`logout(options?: LogoutOptions): Promise<LogoutResult>`**

- Logs out current user
- Optionally logs out from all devices

**`updateProfile(updates: Partial<User>, options?: UpdateOptions): Promise<UpdateResult>`**

- Updates user profile information
- Automatically updates stored user data

**`hasRole(role: string): boolean`**

- Checks if user has specific role

**`hasPermission(permission: string): boolean`**

- Checks if user has specific permission

**`hasAnyRole(roles: string[]): boolean`**

- Checks if user has any of the specified roles

**`hasAnyPermission(permissions: string[]): boolean`**

- Checks if user has any of the specified permissions

**`subscribe(callback: SubscriberCallback): UnsubscribeFunction`**

- Subscribes to auth state changes
- Returns unsubscribe function

### Properties

**`user: User | null`** - Current authenticated user
**`loading: boolean`** - Loading state
**`isAuthenticated(): boolean`** - Authentication status
**`getToken(): string | null`** - Current JWT token

## Route Utilities (routeUtils)

The `routeUtils` object provides helpful utilities for working with routes:

```jsx
import { routeUtils } from "react-auth-router";

// Get all routes (flattens nested routes into single array)
const allRoutes = routeUtils.getAllRoutes(routeConfig);
// Returns: [route1, route2, child1, child2, ...]

// Find matching route for a path (handles nested children automatically)
const currentRoute = routeUtils.findMatchingRoute("/users/123", allRoutes);
// Returns the most specific matching route

// Extract parameters from URL
const params = routeUtils.extractParams("/users/123/edit", "/users/:id/edit");
// Returns: { id: "123" }

// Generate breadcrumbs from route hierarchy
const breadcrumbs = routeUtils.generateBreadcrumbs(currentRoute, allRoutes);
// Returns: [{ title: "Users", path: "/users" }, { title: "User Details", path: "/users/123" }]
```

**Available Methods:**

**`getAllRoutes(routeConfig)`**
- Flattens route configuration into single array
- Includes all nested children routes
- Maintains parent references

**`findMatchingRoute(path, routes)`**
- Finds route matching the given path
- Automatically searches through children
- Returns most specific (deepest) match
- Supports exact matching and path parameters

**`extractParams(path, routePath)`**
- Extracts parameters from URL path
- Matches `:paramName` patterns
- Returns object with parameter key-value pairs

**`generateBreadcrumbs(route, routes)`**
- Builds breadcrumb trail from route hierarchy
- Uses parent relationships
- Returns array of breadcrumb objects

## Route Configuration

```typescript
interface Route {
  path: string; // Route path with optional parameters (:id)
  component: string | Component; // Component name or React component
  title: string; // Display title
  icon?: ComponentType; // Optional icon component
  showInNav?: boolean; // Show in navigation menu
  exact?: boolean; // Exact path matching
  requireAuth?: boolean; // Requires authentication
  requireGuest?: boolean; // Only accessible to unauthenticated users (v2.2.2+)
  authenticatedRedirect?: string; // Where to redirect authenticated users (default: "/") (v2.2.2+)
  requiredRoles?: string[]; // Required user roles
  requiredPermissions?: string[]; // Required permissions
  requireAll?: boolean; // Require ALL roles/permissions vs ANY
  layout?: boolean; // Enable layout mode with Outlet (v2.5.0+)
  children?: Route[]; // Nested child routes
  parent?: Route; // Parent route reference (auto-generated)
  fullPath?: string; // Full path including parent paths (auto-generated)
  meta?: {
    // SEO/metadata
    title?: string;
    description?: string;
  };
  customGuard?: (context: GuardContext) => boolean; // Custom access control
}
```

## Configuration Options

```typescript
interface AuthConfig {
  // Legacy Mode (v2.3.0 and earlier)
  tokenKey?: string; // localStorage key for token
  userKey?: string; // localStorage key for user data
  refreshInterval?: number; // Token refresh interval (ms)

  // Security Mode (v2.4.0+)
  securityMode?: 'recommended' | 'custom' | 'legacy'; // Security configuration mode
  storageConfig?: StorageConfig; // Custom storage configuration
  tokenRotation?: boolean; // Enable automatic token rotation
  csrf?: CsrfConfig; // CSRF protection configuration

  // Common Configuration
  permissionHierarchy?: Record<string, string[]>; // Role-permission mapping
  customLogin?: Function; // Custom login function
  customLogout?: Function; // Custom logout function
  customRefresh?: Function; // Custom token refresh function
}

interface StorageConfig {
  accessToken: {
    storage: 'memory' | 'sessionStorage' | 'localStorage';
    key: string;
  };
  refreshToken: {
    storage: 'memory' | 'sessionStorage' | 'localStorage' | 'httpOnly';
    key: string;
  };
  user: {
    storage: 'sessionStorage' | 'localStorage';
    key: string;
  };
}

interface CsrfConfig {
  enabled: boolean;
  tokenKey?: string; // Storage key for CSRF token
  headerName?: string; // HTTP header name
  cookieName?: string; // Cookie name to read CSRF token from
}

interface RouterConfig {
  basePath?: string; // Base path for all routes
  enableHistory?: boolean; // Enable browser history
  enableBreadcrumbs?: boolean; // Enable breadcrumb generation
  enableMetadata?: boolean; // Enable metadata management
}

interface UIConfig {
  theme?: string; // UI theme
  showIcons?: boolean; // Show icons in navigation
  mobileBreakpoint?: number; // Mobile breakpoint in pixels
}
```

---

**[Back to Main README](../README.md)** | **[View Examples](./EXAMPLES.md)**
