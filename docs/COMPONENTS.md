# Components

> UI components provided by React Auth Router

## Table of Contents

- [Navigation](#navigation)
- [Breadcrumb](#breadcrumb)
- [Routes Component](#routes-component)
- [RouteGuard](#routeguard)
- [Outlet](#outlet)

## Navigation

```jsx
import { Navigation } from "react-auth-router";

const App = () => (
  <div>
    <Navigation
      routeConfig={routeConfig}
      className="custom-nav"
      mobileBreakpoint={768}
    />
  </div>
);
```

### Custom Navigation

```jsx
const CustomNavigation = () => {
  const { user, logout } = useAuth();
  const { navigate, currentPath } = useRouter();
  const { hasPermission } = usePermissions();

  return (
    <nav>
      <div>MyApp</div>

      {user && (
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className={currentPath === "/dashboard" ? "active" : ""}
          >
            Dashboard
          </button>

          {hasPermission("read_users") && (
            <button onClick={() => navigate("/users")}>Users</button>
          )}

          <button onClick={logout}>Logout</button>
        </div>
      )}
    </nav>
  );
};
```

## Breadcrumb

The Breadcrumb component automatically generates breadcrumbs from your route hierarchy (parent-child relationships).

```jsx
import { Breadcrumb } from "react-auth-router";

// Basic usage
const PageWithBreadcrumbs = () => (
  <div>
    <Breadcrumb routeConfig={routeConfig} />
    <h1>Page Content</h1>
  </div>
);

// With custom options
const CustomBreadcrumbs = () => (
  <div>
    <Breadcrumb
      routeConfig={routeConfig}
      className="my-breadcrumbs"
      showHome={true}
      homeTitle="Dashboard"
      homePath="/dashboard"
    />
  </div>
);

// With custom breadcrumb component
const MyCustomBreadcrumb = ({ breadcrumbs, navigate }) => (
  <nav>
    {breadcrumbs.map((crumb, index) => (
      <span key={crumb.path}>
        <button onClick={() => navigate(crumb.path)}>
          {crumb.title}
        </button>
        {index < breadcrumbs.length - 1 && " / "}
      </span>
    ))}
  </nav>
);

const WithCustomComponent = () => (
  <Breadcrumb
    routeConfig={routeConfig}
    customBreadcrumbComponent={MyCustomBreadcrumb}
  />
);

// Renders: Home > Users > User Details > Edit
```

**Props:**
- `routeConfig` (required) - Your route configuration
- `className` - Custom CSS class
- `customBreadcrumbComponent` - Custom component to render breadcrumbs
- `showHome` - Show home breadcrumb (default: true)
- `homeTitle` - Home breadcrumb title (default: "Home")
- `homePath` - Home breadcrumb path (default: "/")

## Routes Component

The Routes component renders your current route based on the path.

```jsx
import { Routes } from "react-auth-router";

// Basic usage with component strings
const pageComponents = {
  HomePage: HomePage,
  DashboardPage: DashboardPage,
  UsersPage: UsersPage,
  UserDetailPage: UserDetailPage,
};

const App = () => (
  <Router>
    <Routes
      routeConfig={routeConfig}
      pageComponents={pageComponents}
      notFoundComponent={Custom404Page}
      loadingComponent={LoadingSpinner}
    />
  </Router>
);

// Using React components directly (no pageComponents needed)
const routeConfig = createRouteConfig({
  public: [
    {
      path: "/",
      component: HomePage, // Direct component reference
      title: "Home",
    },
  ],
});

const App = () => (
  <Router>
    <Routes routeConfig={routeConfig} />
  </Router>
);
```

**Props:**
- `routeConfig` (required) - Your route configuration object
- `pageComponents` - Object mapping component strings to actual components
- `notFoundComponent` - Custom 404 component
- `loadingComponent` - Custom loading component
- `hideUnauthorizedRoutes` - Show 404 for unauthorized routes instead of "Access Denied" (default: `true` for security)
- `defaultRoute` - Default route to redirect to when path is "/" (v2.3.0+)
- `authenticatedDefaultRoute` - Default route for authenticated users on "/" (v2.3.0+)
- `unauthenticatedDefaultRoute` - Default route for unauthenticated users on "/" (v2.3.0+)

**How it works:**
1. Gets current path from router context
2. **Security**: Filters routes based on user permissions (if `hideUnauthorizedRoutes` is true)
3. Finds matching route (including nested children) from accessible routes only
4. Applies RouteGuard for additional permission checking
5. Renders the appropriate page component
6. Passes `params` and `route` props to the component

**Security Feature (v2.2.1+):**
```jsx
// Secure by default - unauthorized routes show 404
<Routes routeConfig={routeConfig} />

// Explicitly disable for backward compatibility
<Routes routeConfig={routeConfig} hideUnauthorizedRoutes={false} />
```

When `hideUnauthorizedRoutes={true}` (default):
- ✅ Protected routes appear as 404 when user lacks access
- ✅ Prevents attackers from discovering your route structure
- ✅ More secure - no information disclosure

When `hideUnauthorizedRoutes={false}`:
- ❌ Shows "Authentication Required" or "Access Denied" screens
- ❌ Reveals that protected routes exist
- ℹ️ Use only if you have a specific reason to expose route existence

## RouteGuard

The RouteGuard component handles all authentication and permission checks for routes.

```jsx
import { RouteGuard } from "react-auth-router";

// Automatic usage (used internally by Routes)
<RouteGuard route={currentRoute}>
  <PageComponent />
</RouteGuard>

// Manual usage with custom components
const ProtectedPage = () => (
  <RouteGuard
    route={{
      requireAuth: true,
      requiredRoles: ["admin"],
      requiredPermissions: ["read_users"],
    }}
    fallback={<div>Loading...</div>}
    unauthorizedComponent={CustomUnauthorizedPage}
    forbiddenComponent={CustomForbiddenPage}
  >
    <YourProtectedContent />
  </RouteGuard>
);
```

**Props:**
- `route` (required) - Route configuration object with:
  - `requireAuth` - Requires user to be authenticated
  - `requiredRoles` - Array of required roles
  - `requiredPermissions` - Array of required permissions
  - `requireAll` - If true, requires ALL roles/permissions; if false, requires ANY (default: true)
  - `customGuard` - Custom function for access control
- `children` - Content to render if access is granted
- `fallback` - Component to show while checking permissions
- `unauthorizedComponent` - Custom component for unauthenticated users
- `forbiddenComponent` - Custom component for unauthorized users

**Access Control Flow:**
1. Checks authentication status
2. Checks role requirements
3. Checks permission requirements
4. Runs custom guard function if provided
5. Renders children if all checks pass
6. Renders appropriate error component if checks fail

## Outlet

The `Outlet` component renders child routes for layout routes. It's similar to React Router's Outlet component.

```jsx
import { Outlet, useHasChildRoutes } from "react-auth-router";

const UsersLayout = () => {
  const hasChildRoutes = useHasChildRoutes();

  return (
    <div className="users-layout">
      <h1>Users Section</h1>
      <nav>
        <Link to="/users/list">All Users</Link>
        <Link to="/users/create">Create User</Link>
      </nav>

      {/* Render child route here */}
      {hasChildRoutes ? (
        <Outlet />
      ) : (
        <div>Select a user from the navigation</div>
      )}
    </div>
  );
};

// Route configuration
const routeConfig = createRouteConfig({
  protected: [
    {
      path: "/users",
      component: UsersLayout,  // Parent layout component
      layout: true,            // Enable layout mode
      children: [
        {
          path: "/users/list",
          component: UsersList,
        },
        {
          path: "/users/:id",
          component: UserDetail,
        },
      ],
    },
  ],
});
```

**Features:**
- Renders the matched child route component
- Works with nested routing
- Automatically passes route params and context to children
- Use `useHasChildRoutes()` hook to check if there are child routes

---

**[Back to Main README](../README.md)** | **[View Routing Docs](./ROUTING.md)**
