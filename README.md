[react-auth-router-docs.md](https://github.com/user-attachments/files/21671582/react-auth-router-docs.md)

# React Auth Router

> A comprehensive React library for authentication and routing with permissions, error handling, and performance optimization using subscriber patterns.

[![npm version](https://badge.fury.io/js/react-auth-router.svg)](https://badge.fury.io/js/react-auth-router)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Features

- 🚀 **High Performance** - Subscriber pattern prevents unnecessary re-renders
- 🔐 **Comprehensive Auth** - JWT tokens, automatic refresh, cross-tab sync
- 🛡️ **Advanced Permissions** - Role-based + permission-based access control
- 🔒 **Security First** - Prevent route enumeration attacks by showing 404 for unauthorized routes (secure by default)
- 🧭 **Flexible Routing** - Nested routes with automatic child matching, parameters, query strings, Link component for declarative navigation
- 🍞 **Smart Breadcrumbs** - Automatic breadcrumb generation from route hierarchy with custom component support
- 🎯 **Error Handling** - Built-in error boundaries with react-toastify notifications (addSuccess, addError, addWarning, addInfo)
- 📱 **Mobile Ready** - Responsive navigation with mobile breakpoints
- 🔧 **TypeScript** - Full type safety and IntelliSense support
- 🎨 **Customizable** - Override any component or behavior
- 🛠️ **Route Utilities** - Powerful utilities for route matching, parameter extraction, and breadcrumbs

## Quick Start

```bash
npm install react-auth-router
```

```git
npm install git+https://github.com/yourusername/react-auth-router.git
```

```jsx
import React from "react";
import {
  Router,
  Navigation,
  Routes,
  Link,
  useAuth,
  initializeAuth,
  createRouteConfig,
} from "react-auth-router";
import "react-toastify/dist/ReactToastify.css"; // Required for notifications

// Initialize auth system
initializeAuth({
  permissionHierarchy: {
    admin: ["read_users", "write_users", "delete_users"],
    user: ["read_users"],
  },
});

// Define routes with nested children
const routeConfig = createRouteConfig({
  public: [
    {
      path: "/",
      component: HomePage,
      title: "Home",
      showInNav: true,
    },
  ],
  protected: [
    {
      path: "/dashboard",
      component: DashboardPage,
      title: "Dashboard",
      requireAuth: true,
      showInNav: true,
    },
    {
      path: "/users",
      component: UsersPage,
      title: "Users",
      requireAuth: true,
      requiredPermissions: ["read_users"],
      showInNav: true,
      children: [
        {
          path: "/users/:id",
          component: UserDetailPage,
          title: "User Details",
        },
      ],
    },
  ],
});

function App() {
  return (
    <Router>
      <Navigation routeConfig={routeConfig} />
      <main>
        <Breadcrumb routeConfig={routeConfig} />
        <Routes routeConfig={routeConfig} />
      </main>
    </Router>
  );
}

export default App;
```

## Table of Contents

- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Authentication](#authentication)
- [Routing](#routing)
- [Permissions](#permissions)
- [Error Handling](#error-handling)
- [Components](#components)
- [Hooks](#hooks)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Examples](#examples)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## Installation

### NPM

```bash
npm install react-auth-router
```

### Yarn

```bash
yarn add react-auth-router
```

### ⚠️ Important Setup Step

**After installation, you MUST import the react-toastify CSS in your app's entry point:**

```jsx
// In your src/index.js or src/App.js
import "react-toastify/dist/ReactToastify.css";
```

Without this import, toast notifications will not display properly.

### Requirements

- React >= 16.8.0
- React DOM >= 16.8.0

### Dependencies

The library includes:
- **react-toastify** - Beautiful toast notifications (automatically installed)
- **lucide-react** - Icon library (automatically installed)

**Important:** You must import the react-toastify CSS in your app entry point:

```jsx
// In your index.js or App.js
import "react-toastify/dist/ReactToastify.css";
```

## Core Concepts

### Subscriber Pattern vs Context

React Auth Router uses a **subscriber pattern** instead of React Context for better performance:

```jsx
// ❌ Context Pattern - ALL consumers re-render on ANY change
const { user, loading, hasRole } = useContext(AuthContext);

// ✅ Subscriber Pattern - Only relevant consumers re-render
const { user } = useAuthUser(); // Only re-renders on user changes
const loading = useAuthLoading(); // Only re-renders on loading changes
const { hasRole } = usePermissions(); // Only re-renders on permission changes
```

**Performance Impact:**

- Context: 50+ unnecessary re-renders per auth change
- Subscriber: 2-5 targeted re-renders per auth change

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Store    │    │   Router        │    │ Error Handler   │
│   (Singleton)   │    │   (Context)     │    │   (Provider)    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • User State    │    │ • Current Path  │    │ • Error Bounds  │
│ • JWT Tokens    │    │ • Parameters    │    │ • Toast System  │
│ • Permissions   │    │ • Navigation    │    │ • Recovery      │
│ • Subscribers   │    │ • Route Guards  │    │ • Logging       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │  React App      │
                    │  Components     │
                    └─────────────────┘
```

## Authentication

### Basic Setup

```jsx
import { initializeAuth } from "react-auth-router";

// Initialize once in your app
const authStore = initializeAuth({
  tokenKey: "my_app_token",
  userKey: "my_app_user",
  refreshInterval: 15 * 60 * 1000, // 15 minutes
  permissionHierarchy: {
    admin: ["read_users", "write_users", "delete_users", "admin_access"],
    manager: ["read_users", "write_users"],
    user: ["read_users"],
  },
});
```

### Login Implementation

#### API-Based Login

```jsx
const LoginPage = () => {
  const { login, loading } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleLogin = async () => {
    const result = await login(credentials, {
      apiEndpoint: "/api/auth/login",
    });

    if (result.success) {
      navigate("/dashboard");
    } else {
      console.error("Login failed:", result.error);
    }
  };

  return (
    <form>
      <input
        type="text"
        value={credentials.username}
        onChange={(e) =>
          setCredentials({ ...credentials, username: e.target.value })
        }
        placeholder="Username"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) =>
          setCredentials({ ...credentials, password: e.target.value })
        }
        placeholder="Password"
      />
      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};
```

#### Custom Login Function

```jsx
const handleLogin = async () => {
  const result = await login(credentials, {
    customLogin: async (creds) => {
      // Your custom login logic
      const response = await fetch("/api/custom-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });

      const data = await response.json();

      return {
        user: data.user,
        token: data.accessToken,
      };
    },
  });
};
```

### Logout Implementation

```jsx
const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout({
      apiEndpoint: "/api/auth/logout", // Optional server-side logout
      everywhere: true, // Logout from all devices
    });
    navigate("/");
  };

  return (
    <div>
      <span>Welcome, {user?.name}</span>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};
```

### Token Management

#### Automatic Token Refresh

```jsx
// Token refresh is handled automatically
// But you can manually trigger it:
const { refreshToken } = useAuth();

const handleRefreshToken = async () => {
  const success = await refreshToken({
    apiEndpoint: "/api/auth/refresh",
  });

  if (!success) {
    // Refresh failed, user will be logged out automatically
    console.log("Session expired");
  }
};
```

#### Custom Token Refresh

```jsx
initializeAuth({
  // Custom refresh function
  customRefresh: async (currentToken) => {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return data.newToken;
  },
});
```

## Routing

### Route Configuration

```jsx
const routeConfig = createRouteConfig({
  public: [
    {
      path: "/",
      component: "HomePage",
      title: "Home",
      showInNav: true,
      exact: true,
      meta: {
        title: "Home - MyApp",
        description: "Welcome to MyApp",
      },
    },
    // Guest-only routes (login, register) - redirects authenticated users
    {
      path: "/login",
      component: "LoginPage",
      title: "Login",
      requireGuest: true, // Only accessible when NOT logged in
      authenticatedRedirect: "/dashboard", // Optional: where to redirect authenticated users
    },
    {
      path: "/register",
      component: "RegisterPage",
      title: "Register",
      requireGuest: true, // Defaults to redirecting to "/"
    },
  ],
  protected: [
    {
      path: "/users",
      component: "UsersPage",
      title: "Users",
      icon: UsersIcon,
      showInNav: true,
      exact: true,
      requiredPermissions: ["read_users"],
      children: [
        {
          path: "/users/create",
          component: "CreateUserPage",
          title: "Create User",
          requiredPermissions: ["write_users"],
          breadcrumb: ["Users", "Create User"],
        },
        {
          path: "/users/:id",
          component: "UserDetailPage",
          title: "User Details",
          requiredPermissions: ["read_users"],
          breadcrumb: ["Users", "User Details"],
        },
        {
          path: "/users/:id/edit",
          component: "EditUserPage",
          title: "Edit User",
          requiredPermissions: ["write_users"],
          breadcrumb: ["Users", "User Details", "Edit"],
        },
      ],
    },
  ],
});
```

### Route Parameters

```jsx
// URL: /users/123/edit
const UserEditPage = () => {
  const params = useParams();
  const { id } = params; // "123"

  return <div>Editing user {id}</div>;
};
```

### Query Parameters

```jsx
const UsersPage = () => {
  const navigate = useNavigate();
  const query = useQuery();

  // Current URL: /users?page=2&sort=name
  const currentPage = query.page || 1;
  const sortBy = query.sort || "id";

  const handlePageChange = (page) => {
    navigate("/users", {
      query: { ...query, page },
    });
  };

  return (
    <div>
      <h1>
        Users (Page {currentPage}, Sort: {sortBy})
      </h1>
      <button onClick={() => handlePageChange(3)}>Go to Page 3</button>
    </div>
  );
};
```

### Link Component

The `Link` component provides declarative, client-side navigation without page reloads (similar to react-router-dom's Link).

#### Basic Usage

```jsx
import { Link } from "react-auth-router";

const Navigation = () => (
  <nav>
    <Link to="/">Home</Link>
    <Link to="/about">About</Link>
    <Link to="/users">Users</Link>
  </nav>
);
```

#### Advanced Link Usage

```jsx
import { Link } from "react-auth-router";

const UsersList = () => (
  <div>
    {/* Basic link */}
    <Link to="/users/123">View User 123</Link>

    {/* Link with query parameters */}
    <Link
      to="/users"
      query={{ page: 2, sort: "name" }}
    >
      Users Page 2
    </Link>

    {/* Link with state (accessible in destination component) */}
    <Link
      to="/users/123"
      state={{ from: "dashboard" }}
    >
      View User Details
    </Link>

    {/* Replace history instead of push */}
    <Link
      to="/login"
      replace={true}
    >
      Login
    </Link>

    {/* Custom styling */}
    <Link
      to="/profile"
      className="nav-link"
      style={{ color: "blue", fontWeight: "bold" }}
    >
      My Profile
    </Link>

    {/* Link with custom onClick handler */}
    <Link
      to="/settings"
      onClick={(e) => {
        console.log("Navigating to settings");
        // e.preventDefault() can be called to cancel navigation
      }}
    >
      Settings
    </Link>
  </div>
);
```

#### Link vs useNavigate vs \<a\> Tag

```jsx
// ❌ Regular <a> tag - causes full page reload
<a href="/users">Users</a>

// ✅ Link component - client-side navigation (recommended for JSX)
<Link to="/users">Users</Link>

// ✅ useNavigate hook - programmatic navigation (recommended for event handlers)
const navigate = useNavigate();
const handleClick = () => navigate("/users");
```

#### Link Props

- **`to`** (required): The path to navigate to
- **`replace`**: Replace current history entry instead of pushing (default: `false`)
- **`query`**: Object of query parameters to add to URL
- **`state`**: State data to pass with navigation
- **`className`**: CSS class name
- **`style`**: Inline styles object
- **`onClick`**: Click handler (called before navigation)
- All other HTML anchor props are supported

### Nested Routes

React Auth Router fully supports nested routes with automatic child route matching.

```jsx
const routeConfig = createRouteConfig({
  protected: [
    {
      path: "/users",
      component: "UsersPage",
      title: "Users",
      children: [
        {
          path: "/users/:id",
          component: "UserDetailPage",
          title: "User Details",
        },
        {
          path: "/users/:id/edit",
          component: "EditUserPage",
          title: "Edit User",
        },
      ],
    },
  ],
});

const App = () => {
  return (
    <Router>
      <Routes routeConfig={routeConfig} pageComponents={pageComponents}>
        {/* /users renders UsersPage */}
        {/* /users/123 renders UserDetailPage */}
        {/* /users/123/edit renders EditUserPage */}
      </Routes>
    </Router>
  );
};
```

**How nested routes work:**
- The `findMatchingRoute` utility automatically searches through child routes
- When a parent route matches, it checks all children before returning
- Returns the most specific (deepest) matching route
- Parent-child relationships are automatically maintained for breadcrumbs

### Custom Route Guards

```jsx
const routeConfig = createRouteConfig({
  protected: [
    {
      path: "/premium",
      component: "PremiumPage",
      title: "Premium Features",
      customGuard: ({ isAuthenticated, hasRole }) => {
        return isAuthenticated && (hasRole("premium") || hasRole("admin"));
      },
    },
  ],
});
```

### Guest-Only Routes (v2.2.2+)

Prevent authenticated users from accessing routes like login and registration pages.

```jsx
const routeConfig = createRouteConfig({
  public: [
    {
      path: "/login",
      component: "LoginPage",
      title: "Login",
      requireGuest: true, // Only accessible when NOT logged in
      authenticatedRedirect: "/dashboard", // Optional: where to redirect (default: "/")
    },
    {
      path: "/register",
      component: "RegisterPage",
      title: "Register",
      requireGuest: true, // Redirects to "/" by default
    },
    {
      path: "/forgot-password",
      component: "ForgotPasswordPage",
      title: "Forgot Password",
      requireGuest: true,
      authenticatedRedirect: "/settings/security", // Custom redirect
    },
  ],
});
```

**How it works:**
1. When an authenticated user navigates to a `requireGuest: true` route
2. They are automatically redirected to `authenticatedRedirect` path (or "/" by default)
3. Shows a brief "Redirecting..." message during redirect
4. Prevents confusion and improves UX

**Example scenario:**
```
User logs in → Redirected to /dashboard
User manually types /login in URL → Automatically redirected to /dashboard
Result: Clean UX, no confusion
```

## Permissions

### Role-Based Access Control (RBAC)

```jsx
const AdminPanel = () => {
  const { hasRole } = usePermissions();

  if (!hasRole("admin")) {
    return <div>Access denied</div>;
  }

  return <div>Admin panel content</div>;
};
```

### Permission-Based Access Control

```jsx
const UserActions = () => {
  const { hasPermission, hasAnyPermission } = usePermissions();

  return (
    <div>
      {hasPermission("read_users") && <button>View Users</button>}

      {hasPermission("write_users") && <button>Create User</button>}

      {hasAnyPermission(["write_users", "delete_users"]) && (
        <button>Manage Users</button>
      )}
    </div>
  );
};
```

### Component-Level Protection

```jsx
import { ProtectedComponent } from "react-auth-router";

const App = () => (
  <div>
    <ProtectedComponent
      requiredPermissions={["admin_access"]}
      fallback={<div>You need admin access</div>}
    >
      <AdminSettings />
    </ProtectedComponent>

    <ProtectedComponent
      requiredRoles={["manager", "admin"]}
      requireAll={false} // OR logic
    >
      <ManagerTools />
    </ProtectedComponent>
  </div>
);
```

### Permission Hierarchy

```jsx
initializeAuth({
  permissionHierarchy: {
    super_admin: ["*"], // All permissions
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
    guest: [], // No permissions
  },
});
```

## Error Handling

### Setup

**First, import the react-toastify CSS in your app entry point:**

```jsx
// In your index.js or App.js
import "react-toastify/dist/ReactToastify.css";
```

### Error Boundaries

The `ErrorProvider` wraps your app to provide global error handling and toast notifications using **react-toastify**.

```jsx
import { ErrorProvider, ErrorBoundary } from "react-auth-router";
import "react-toastify/dist/ReactToastify.css"; // Required!

function App() {
  return (
    <ErrorProvider>
      <ErrorBoundary level="app">
        <Router>
          <ErrorBoundary level="navigation">
            <Navigation />
          </ErrorBoundary>

          <main>
            <ErrorBoundary level="content">
              <Routes />
            </ErrorBoundary>
          </main>
        </Router>
      </ErrorBoundary>
    </ErrorProvider>
  );
}
```

**Customize Toast Configuration:**

```jsx
<ErrorProvider
  toastConfig={{
    position: "bottom-right",      // Toast position
    autoClose: 3000,               // Auto-close duration (ms)
    hideProgressBar: false,        // Show/hide progress bar
    closeOnClick: true,            // Close on click
    pauseOnHover: true,            // Pause timer on hover
    draggable: true,               // Allow dragging
    theme: "dark",                 // "light", "dark", or "colored"
    className: "custom-toast",     // Custom CSS class
  }}
>
  <App />
</ErrorProvider>
```

**Available Toast Positions:**
- `"top-left"`, `"top-right"`, `"top-center"`
- `"bottom-left"`, `"bottom-right"`, `"bottom-center"`

**Themes:**
- `"light"` - Light background
- `"dark"` - Dark background
- `"colored"` - Colored background based on toast type

### Error Handling in Components

React Auth Router now uses **react-toastify** for beautiful, reliable toast notifications with separate methods for different notification types.

**Note:** Make sure you've imported the CSS (see [Installation](#installation)).

```jsx
import { useError, useApiError } from "react-auth-router";
// CSS import required: import "react-toastify/dist/ReactToastify.css";

const UserProfile = () => {
  const { addSuccess, addError, addWarning, addInfo } = useError();
  const { handleApiError } = useApiError();

  const saveProfile = async (profileData) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      // Use specific notification methods
      addSuccess("Profile saved successfully!");
    } catch (error) {
      handleApiError(error, "Saving profile");
    }
  };

  const handleDelete = async () => {
    addWarning("This action cannot be undone");
    // ... delete logic
  };

  const showTip = () => {
    addInfo("You can edit your profile anytime");
  };

  return (
    <div>
      <button onClick={() => saveProfile(data)}>Save Profile</button>
      <button onClick={handleDelete}>Delete</button>
      <button onClick={showTip}>Show Tip</button>
    </div>
  );
};
```

**Available Notification Methods:**
- `addSuccess(message, options)` - Green success toast
- `addError(message, options)` - Red error toast
- `addWarning(message, options)` - Yellow warning toast
- `addInfo(message, options)` - Blue info toast

**Options:**
```jsx
addSuccess("Saved!", {
  autoClose: 3000,      // Auto-close after 3 seconds
  position: "top-left", // Toast position
  theme: "dark",        // Dark theme
});
```

### Custom Error Components

```jsx
const CustomErrorPage = ({ error, onRetry }) => (
  <div className="error-page">
    <h2>Oops! Something went wrong</h2>
    <p>{error.message}</p>
    <button onClick={onRetry}>Try Again</button>
    <button onClick={() => (window.location.href = "/")}>Go Home</button>
  </div>
);

// Use in RouteGuard
<RouteGuard route={route} forbiddenComponent={CustomErrorPage}>
  <YourContent />
</RouteGuard>;
```

## Components

### Navigation

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

#### Custom Navigation

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

### Breadcrumb

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

### Routes Component

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

### RouteGuard

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

## Hooks

### Authentication Hooks

#### `useAuth()`

Primary hook for authentication state and methods.

```jsx
const {
  // State
  user, // Current user object or null
  loading, // Loading state
  isAuthenticated, // Boolean auth status

  // Methods
  login, // Login function
  logout, // Logout function
  updateProfile, // Update user profile
  refreshToken, // Manually refresh token
  hasRole, // Check user role
  hasPermission, // Check user permission
  hasAnyRole, // Check any of multiple roles
  hasAnyPermission, // Check any of multiple permissions
  hasAllRoles, // Check all roles required
  hasAllPermissions, // Check all permissions required
  getToken, // Get current JWT token
} = useAuth();
```

#### `usePermissions()`

Optimized hook for permission checks only.

```jsx
const {
  roles, // User's roles array
  permissions, // User's permissions array
  hasRole, // Check role function
  hasPermission, // Check permission function
  hasAnyRole, // Check any role function
  hasAnyPermission, // Check any permission function
  hasAllRoles, // Check all roles function
  hasAllPermissions, // Check all permissions function
} = usePermissions();
```

#### `useAuthUser()`

Hook for user data only - minimal re-renders.

```jsx
const user = useAuthUser(); // Only re-renders on user changes
```

#### `useAuthLoading()`

Hook for loading state only.

```jsx
const loading = useAuthLoading(); // Only re-renders on loading changes
```

### Routing Hooks

#### `useRouter()`

Complete router state and navigation.

```jsx
const {
  currentPath, // Current path string
  params, // Route parameters object
  query, // Query parameters object
  navigate, // Navigation function
  basePath, // Base path setting
} = useRouter();
```

#### `useNavigate()`

Navigation function for programmatic navigation.

```jsx
const navigate = useNavigate();

// Basic navigation
navigate("/users");

// With options
navigate("/users", {
  replace: true, // Replace current history entry
  query: { page: 2 }, // Add query parameters
  state: { from: "home" }, // Add state data
});
```

**Note:** For declarative navigation in JSX, use the `Link` component instead. See [Link Component](#link-component) section.

#### `useParams()`

Route parameters only.

```jsx
const params = useParams();
// URL: /users/123/edit
// params = { id: "123" }
```

#### `useQuery()`

Query parameters only.

```jsx
const query = useQuery();
// URL: /users?page=2&sort=name
// query = { page: "2", sort: "name" }
```

### Error Hooks

#### `useError()`

Global error and notification management using react-toastify.

```jsx
const {
  errors,           // Array of current errors (for logging/tracking)
  addError,         // Add error notification (red toast)
  addSuccess,       // Add success notification (green toast)
  addWarning,       // Add warning notification (yellow toast)
  addInfo,          // Add info notification (blue toast)
  clearAllErrors,   // Clear all notifications
} = useError();

// Add different types of notifications
addError("Failed to save", { autoClose: 5000 });
addSuccess("Saved successfully!");
addWarning("This action is risky");
addInfo("New feature available");

// With additional options
addError("Network error", {
  position: "bottom-right",
  autoClose: 3000,
  theme: "dark",
  details: { code: 500 },
  stack: error.stack,
});

// Clear all toasts
clearAllErrors();
```

**Method Signatures:**
- `addError(message: string, options?: ToastOptions): string` - Returns toast ID
- `addSuccess(message: string, options?: ToastOptions): string` - Returns toast ID
- `addWarning(message: string, options?: ToastOptions): string` - Returns toast ID
- `addInfo(message: string, options?: ToastOptions): string` - Returns toast ID
- `clearAllErrors(): void` - Dismisses all active toasts

#### `useApiError()`

API-specific error handling.

```jsx
const { handleApiError } = useApiError();

const fetchData = async () => {
  try {
    const response = await fetch("/api/data");
    // ... handle response
  } catch (error) {
    handleApiError(error, "Loading data");
  }
};
```

## API Reference

### AuthStore Class

#### Constructor

```typescript
new AuthStore(config?: AuthConfig)
```

#### Methods

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

#### Properties

**`user: User | null`** - Current authenticated user
**`loading: boolean`** - Loading state
**`isAuthenticated(): boolean`** - Authentication status
**`getToken(): string | null`** - Current JWT token

### Route Utilities (routeUtils)

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

### Route Configuration

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

### Configuration Options

```typescript
interface AuthConfig {
  tokenKey?: string; // localStorage key for token
  userKey?: string; // localStorage key for user data
  refreshInterval?: number; // Token refresh interval (ms)
  permissionHierarchy?: Record<string, string[]>; // Role-permission mapping
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

## Examples

### Complete App Example

```jsx
import React from "react";
import {
  Router,
  Navigation,
  Routes,
  ErrorProvider,
  ErrorBoundary,
  useAuth,
  useRouter,
  initializeAuth,
  createRouteConfig,
  routeUtils,
} from "react-auth-router";
import "react-toastify/dist/ReactToastify.css"; // Required for notifications

// Initialize auth
initializeAuth({
  permissionHierarchy: {
    admin: ["read_users", "write_users", "delete_users", "admin_access"],
    manager: ["read_users", "write_users"],
    user: ["read_users"],
  },
});

// Route configuration
const routeConfig = createRouteConfig({
  public: [
    {
      path: "/",
      component: "HomePage",
      title: "Home",
      showInNav: true,
      exact: true,
    },
    {
      path: "/login",
      component: "LoginPage",
      title: "Login",
      showInNav: false,
    },
  ],
  protected: [
    {
      path: "/dashboard",
      component: "DashboardPage",
      title: "Dashboard",
      requireAuth: true,
      showInNav: true,
    },
    {
      path: "/users",
      component: "UsersPage",
      title: "Users",
      requiredPermissions: ["read_users"],
      showInNav: true,
      children: [
        {
          path: "/users/:id",
          component: "UserDetailPage",
          title: "User Details",
          requiredPermissions: ["read_users"],
        },
      ],
    },
  ],
});

// Page components
const HomePage = () => (
  <div>
    <h1>Welcome Home</h1>
  </div>
);

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useRouter().navigate;

  const handleLogin = async () => {
    const result = await login(
      { username: "demo", password: "demo" },
      {
        customLogin: async () => ({
          user: {
            id: 1,
            name: "Demo User",
            email: "demo@example.com",
            roles: ["admin"],
            permissions: [],
          },
          token: "demo_token",
        }),
      }
    );

    if (result.success) {
      navigate("/dashboard");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin}>Login as Admin</button>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}!</p>
    </div>
  );
};

const UsersPage = () => (
  <div>
    <h1>Users Management</h1>
  </div>
);
const UserDetailPage = () => {
  const { id } = useParams();
  return (
    <div>
      <h1>User {id} Details</h1>
    </div>
  );
};

// Component mapping
const pageComponents = {
  HomePage,
  LoginPage,
  DashboardPage,
  UsersPage,
  UserDetailPage,
};

// Custom Routes component
const AppRoutes = () => {
  const { currentPath } = useRouter();
  const allRoutes = routeUtils.getAllRoutes(routeConfig);
  const currentRoute = routeUtils.findMatchingRoute(currentPath, allRoutes);

  if (!currentRoute) {
    return <div>Page not found</div>;
  }

  const PageComponent = pageComponents[currentRoute.component];

  return (
    <RouteGuard route={currentRoute}>
      <PageComponent />
    </RouteGuard>
  );
};

// Main App
function App() {
  return (
    <ErrorProvider>
      <ErrorBoundary level="app">
        <Router>
          <div className="app">
            <Navigation routeConfig={routeConfig} />
            <main>
              <ErrorBoundary level="content">
                <AppRoutes />
              </ErrorBoundary>
            </main>
          </div>
        </Router>
      </ErrorBoundary>
    </ErrorProvider>
  );
}

export default App;
```

### Real-World API Integration

```jsx
// services/authService.js
export const authService = {
  login: async (credentials) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return await response.json();
  },

  logout: async (token) => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  refreshToken: async (token) => {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    return data.token;
  },
};

// App.js
import { authService } from "./services/authService";

initializeAuth({
  customLogin: authService.login,
  customLogout: authService.logout,
  customRefresh: authService.refreshToken,
});
```

## Migration Guide

### From v2.2.1 to v2.2.2 (Bug Fix - Guest-Only Routes)

**What Changed:**
Version 2.2.2 fixes a UX/security issue where authenticated users could still access login and registration pages by typing the URL directly.

**New Feature: `requireGuest` property**
```jsx
const routeConfig = createRouteConfig({
  public: [
    {
      path: "/login",
      component: "LoginPage",
      requireGuest: true, // NEW: Only accessible when NOT logged in
      authenticatedRedirect: "/dashboard", // NEW: Optional custom redirect
    },
  ],
});
```

**Action Required:**
Add `requireGuest: true` to routes that should only be accessible to unauthenticated users (login, register, forgot-password, etc.).

**Benefits:**
- ✅ Prevents logged-in users from seeing login/register pages
- ✅ Automatically redirects authenticated users to appropriate page
- ✅ Cleaner UX and less confusion
- ✅ Better security (prevents authenticated users from accessing password reset flows)

### From v2.2.0 to v2.2.1 (Security Update)

**What Changed:**
Version 2.2.1 introduces a security fix that prevents route enumeration attacks. By default, unauthorized routes now show 404 instead of "Access Denied" screens.

**Action Required:**
✅ **Most users: No action required** - The change is backward compatible and more secure.

**If you need the old behavior:**
```jsx
// Show "Access Denied" screens (old behavior)
<Routes
  routeConfig={routeConfig}
  hideUnauthorizedRoutes={false}  // Add this line
/>
```

**Why this change?**
Showing "Access Denied" screens reveals that routes exist, allowing attackers to discover your application structure. The new default (404 for unauthorized routes) prevents this information disclosure.

**Recommendation:**
Keep the secure default (`hideUnauthorizedRoutes={true}`) unless you have a specific reason to expose route existence.

### From React Router + Context Auth

#### Before (React Router + Context)

```jsx
// Old approach
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // ... auth logic

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
```

#### After (React Auth Router)

```jsx
// New approach
import {
  Router,
  Navigation,
  Routes,
  initializeAuth,
  createRouteConfig,
} from "react-auth-router";

initializeAuth({
  // Your auth configuration
});

const routeConfig = createRouteConfig({
  public: [{ path: "/", component: "HomePage", title: "Home" }],
  protected: [
    {
      path: "/dashboard",
      component: "DashboardPage",
      title: "Dashboard",
      requireAuth: true,
    },
  ],
});

const App = () => (
  <Router>
    <Navigation routeConfig={routeConfig} />
    <Routes />
  </Router>
);
```

#### Benefits After Migration

- 🚀 **90% fewer re-renders** - subscriber pattern vs context
- 🔐 **Built-in JWT management** - automatic refresh, validation
- 📱 **Mobile-ready navigation** - responsive out of the box
- 🛡️ **Advanced permissions** - role + permission based access
- 🎯 **Error handling** - comprehensive error boundaries

### Migration Steps

1. **Install React Auth Router**

   ```bash
   npm install react-auth-router
   npm uninstall react-router-dom # if replacing
   ```

2. **Replace Auth Context**

   ```jsx
   // Remove old AuthProvider
   // Add initializeAuth() call
   initializeAuth({
     /* config */
   });
   ```

3. **Convert Routes to Configuration**

   ```jsx
   // Convert <Route> elements to route config objects
   const routeConfig = createRouteConfig({
     protected: [
       {
         path: "/dashboard",
         component: "DashboardPage",
         requireAuth: true,
       },
     ],
   });
   ```

4. **Update Components**

   ```jsx
   // Replace useContext(AuthContext) with useAuth()
   const { user, login, logout } = useAuth();
   ```

5. **Test and Optimize**
   - Test all routes and permissions
   - Use specialized hooks for better performance
   - Add error boundaries where needed

## Best Practices

### Performance Optimization

#### Use Specialized Hooks

```jsx
// ❌ Less efficient - re-renders on all auth changes
const { user, hasRole } = useAuth();

// ✅ More efficient - targeted subscriptions
const user = useAuthUser(); // Only user changes
const { hasRole } = usePermissions(); // Only permission changes
```

#### Memoize Components

```jsx
import { memo } from "react";

const UserCard = memo(
  ({ user }) => <div>{user.name}</div>,
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id;
  }
);
```

#### Optimize Route Guards

```jsx
// ❌ Creates new objects on every render
<RouteGuard
  route={{
    requiredRoles: ['admin'],
    requiredPermissions: ['read_users']
  }}
>

// ✅ Define route objects outside render
const adminRoute = {
  requiredRoles: ['admin'],
  requiredPermissions: ['read_users']
};

<RouteGuard route={adminRoute}>
```

### Security Best Practices

#### Route Enumeration Protection (v2.2.1+)

**The Problem:**
Showing "Unauthorized" or "Access Denied" screens reveals that protected routes exist, allowing attackers to enumerate your application's route structure.

**The Solution:**
React Auth Router v2.2.1+ is **secure by default**. Unauthorized routes now show 404 instead of access denied screens.

```jsx
// ✅ Secure by default (v2.2.1+)
const App = () => (
  <Router>
    <Routes routeConfig={routeConfig} />
  </Router>
);
// Result: Unauthorized routes appear as 404 (secure)

// ❌ Only disable if you have a specific reason
const App = () => (
  <Router>
    <Routes routeConfig={routeConfig} hideUnauthorizedRoutes={false} />
  </Router>
);
// Result: Shows "Access Denied" screens (reveals route existence)
```

**Security Benefits:**
- ✅ Attackers cannot discover your route structure
- ✅ Protected admin panels remain hidden from enumeration
- ✅ Unauthorized users see same 404 as non-existent routes
- ✅ Complies with security best practices (OWASP)

#### JWT Token Security

```jsx
initializeAuth({
  // Use secure token storage
  tokenKey: "secure_app_token",

  // Short refresh intervals
  refreshInterval: 15 * 60 * 1000, // 15 minutes

  // Validate tokens on app start
  validateOnInit: true,
});
```

#### Permission Checking

```jsx
// ❌ Client-side only (insecure)
const deleteUser = async (id) => {
  if (hasPermission("delete_users")) {
    await api.delete(`/users/${id}`);
  }
};

// ✅ Server validates permissions too
const deleteUser = async (id) => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    if (error.status === 403) {
      // Handle permission denied
    }
  }
};
```

#### Route Protection

```jsx
// ❌ Only client-side protection
const AdminPage = () => {
  const { hasRole } = usePermissions();

  if (!hasRole("admin")) {
    return <div>Access denied</div>;
  }

  return <AdminPanel />;
};

// ✅ Both client and server protection
const routeConfig = createRouteConfig({
  protected: [
    {
      path: "/admin",
      component: "AdminPage",
      requiredRoles: ["admin"], // Client-side
      // + server validates on API calls
    },
  ],
});
```

#### Guest-Only Routes (v2.2.2+)

Prevent authenticated users from accessing authentication pages:

```jsx
// ✅ Proper guest-only route configuration
const routeConfig = createRouteConfig({
  public: [
    {
      path: "/login",
      component: "LoginPage",
      requireGuest: true, // Redirects authenticated users
      authenticatedRedirect: "/dashboard",
    },
    {
      path: "/register",
      component: "RegisterPage",
      requireGuest: true,
    },
    {
      path: "/forgot-password",
      component: "ForgotPasswordPage",
      requireGuest: true,
    },
  ],
});

// ❌ Without requireGuest - bad UX
// Logged-in users can still access /login and see the login form
```

**Benefits:**
- Prevents confusion when users manually type `/login` after authentication
- Stops password reset flows for authenticated users (security)
- Cleaner UX and better user experience

### Code Organization

#### Separate Concerns

```
src/
├── auth/
│   ├── config.js          # Auth configuration
│   ├── hooks.js           # Custom auth hooks
│   └── guards.js          # Custom route guards
├── routing/
│   ├── routes.js          # Route configuration
│   ├── components.js      # Route components mapping
│   └── utils.js           # Route utilities
├── components/
│   ├── navigation/        # Navigation components
│   ├── guards/            # Permission components
│   └── errors/            # Error components
└── pages/                 # Page components
```

#### Custom Hooks

```jsx
// hooks/useAuthActions.js
export const useAuthActions = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const loginAndRedirect = async (credentials, redirectTo = "/dashboard") => {
    const result = await login(credentials);
    if (result.success) {
      navigate(redirectTo);
    }
    return result;
  };

  const logoutAndRedirect = async (redirectTo = "/") => {
    await logout();
    navigate(redirectTo);
  };

  return { loginAndRedirect, logoutAndRedirect };
};
```

### Error Handling Best Practices

#### Structured Error Handling

```jsx
// utils/errorHandler.js
import { useError } from "react-auth-router";

export const useStructuredErrorHandler = () => {
  const { addError, addWarning } = useError();

  const handleApiError = (error, context = "") => {
    let message = "An unexpected error occurred";

    if (error.response) {
      const status = error.response.status;

      const errorMap = {
        400: "Invalid request",
        401: "Please log in",
        403: "Access denied",
        404: "Resource not found",
        500: "Server error",
      };

      message = errorMap[status] || message;
    } else if (error.request) {
      message = "Network error. Please check your connection";
    }

    const finalMessage = context ? `${context}: ${message}` : message;

    // Use warning for validation errors, error for critical issues
    if (error.response?.status === 400) {
      addWarning(finalMessage);
    } else {
      addError(finalMessage);
    }
  };

  return { handleApiError };
};

// Usage in components
const MyComponent = () => {
  const { handleApiError } = useStructuredErrorHandler();

  const saveData = async () => {
    try {
      await api.save(data);
    } catch (error) {
      handleApiError(error, "Saving data");
    }
  };
};
```

#### Global Error Boundary

```jsx
// components/GlobalErrorBoundary.js
import { ErrorBoundary } from "react-auth-router";

const GlobalErrorBoundary = ({ children }) => (
  <ErrorBoundary
    level="app"
    fallback={({ error, onRetry }) => (
      <div className="global-error">
        <h1>Application Error</h1>
        <p>The application has encountered an unexpected error.</p>
        <button onClick={onRetry}>Reload Application</button>
        <details>
          <summary>Error Details</summary>
          <pre>{error.stack}</pre>
        </details>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);
```

## Troubleshooting

### Common Issues

#### 1. "AuthStore not initialized" Error

```jsx
// ❌ Problem: Using hooks before initialization
const App = () => {
  const { user } = useAuth(); // Error: AuthStore not initialized

  return <div>{user?.name}</div>;
};

// ✅ Solution: Initialize before using hooks
initializeAuth(); // Call this once, early in your app

const App = () => {
  const { user } = useAuth(); // Works correctly
  return <div>{user?.name}</div>;
};
```

#### 2. Components Not Re-rendering on Auth Changes

```jsx
// ❌ Problem: Using stale references
const MyComponent = () => {
  const authStore = getAuthStore();
  const user = authStore.getUser(); // Stale reference
  return <div>{user?.name}</div>;
};

// ✅ Solution: Use reactive hooks
const MyComponent = () => {
  const { user } = useAuth(); // Reactive hook
  return <div>{user?.name}</div>;
};
```

#### 3. Route Parameters Not Updating

```jsx
// ❌ Problem: Using router hook incorrectly
const UserPage = () => {
  const { params } = useRouter();
  const [userId] = useState(params.id); // Stale state

  return <div>User {userId}</div>;
};

// ✅ Solution: Use params directly or with useEffect
const UserPage = () => {
  const { params } = useRouter();

  return <div>User {params.id}</div>;
};

// Or for side effects:
const UserPage = () => {
  const { params } = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData(params.id);
  }, [params.id]);

  return <div>User {params.id}</div>;
};
```

#### 4. Token Refresh Not Working

```jsx
// ❌ Problem: Server returns different token format
const customRefresh = async (token) => {
  const response = await fetch("/api/refresh", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  // Backend returns { access_token: "..." } but we return data.token
  return data.token; // undefined!
};

// ✅ Solution: Match your backend response format
const customRefresh = async (token) => {
  const response = await fetch("/api/refresh", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return data.access_token; // Match your backend field name
};
```

#### 5. Permissions Not Working After Role Update

```jsx
// ❌ Problem: Permissions not recalculated after role change
const updateUserRole = async (newRole) => {
  const updatedUser = { ...user, roles: [newRole] };
  // Permissions are stale because expandPermissions wasn't called
  await updateProfile(updatedUser);
};

// ✅ Solution: Let the auth store handle permission expansion
const updateUserRole = async (newRole) => {
  await updateProfile({ roles: [newRole] }); // Auth store recalculates permissions
};
```

### Debugging Tips

#### Enable Debug Logging

```jsx
initializeAuth({
  debug: true, // Enable debug logging
  onStateChange: (state) => {
    console.log("Auth state changed:", state);
  },
});
```

#### Inspect Auth State

```jsx
// Debug component to inspect auth state
const AuthDebugger = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const { roles, permissions } = usePermissions();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        background: "white",
        padding: "10px",
        border: "1px solid #ccc",
      }}
    >
      <h4>Auth Debug</h4>
      <p>Loading: {loading.toString()}</p>
      <p>Authenticated: {isAuthenticated.toString()}</p>
      <p>User: {user?.name || "None"}</p>
      <p>Roles: {roles.join(", ")}</p>
      <p>Permissions: {permissions.length}</p>
    </div>
  );
};
```

#### Check Route Matching

```jsx
// Debug route matching
const RouteDebugger = () => {
  const { currentPath } = useRouter();
  const allRoutes = routeUtils.getAllRoutes(routeConfig);
  const matchedRoute = routeUtils.findMatchingRoute(currentPath, allRoutes);

  console.log("Current path:", currentPath);
  console.log("Matched route:", matchedRoute);
  console.log("All routes:", allRoutes);

  return null;
};
```

### Browser DevTools

#### React DevTools

1. Install React DevTools browser extension
2. Look for "AuthStore" in component props
3. Monitor hook state changes in real-time

#### Network Tab

1. Monitor `/api/auth/login` requests
2. Check token refresh calls
3. Verify Authorization headers are being sent

#### Application Tab

1. Check localStorage for `auth_token` and `auth_state`
2. Verify token expiration times
3. Clear storage to test logout scenarios

### Performance Debugging

#### Identify Unnecessary Re-renders

```jsx
// Add to components to track re-renders
const MyComponent = () => {
  console.log("MyComponent rendered");

  // Component logic

  return <div>Content</div>;
};
```

#### Use React Profiler

```jsx
import { Profiler } from "react";

const App = () => (
  <Profiler
    id="App"
    onRender={(id, phase, actualDuration) => {
      console.log(`${id} ${phase} took ${actualDuration}ms`);
    }}
  >
    <YourApp />
  </Profiler>
);
```

## Advanced Usage

### Custom Auth Store

```jsx
import { AuthStore } from "react-auth-router";

class CustomAuthStore extends AuthStore {
  constructor(config) {
    super(config);
    this.setupCustomFeatures();
  }

  setupCustomFeatures() {
    // Add custom functionality
    this.loginAttempts = 0;
    this.maxLoginAttempts = 3;
  }

  async login(credentials, options) {
    if (this.loginAttempts >= this.maxLoginAttempts) {
      throw new Error("Too many login attempts. Please try again later.");
    }

    try {
      const result = await super.login(credentials, options);
      if (result.success) {
        this.loginAttempts = 0; // Reset on success
      }
      return result;
    } catch (error) {
      this.loginAttempts++;
      throw error;
    }
  }

  // Add custom methods
  async loginWithGoogle(googleToken) {
    return this.login(
      { googleToken },
      {
        customLogin: async ({ googleToken }) => {
          const response = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: googleToken }),
          });

          return await response.json();
        },
      }
    );
  }
}

// Use custom store
const customAuthStore = new CustomAuthStore({
  tokenKey: "custom_token",
  refreshInterval: 10 * 60 * 1000, // 10 minutes
});
```

### Middleware System

```jsx
// Create middleware for auth actions
const authMiddleware = {
  beforeLogin: async (credentials) => {
    console.log("Login attempt for:", credentials.username);
    // Add rate limiting, validation, etc.
    return credentials;
  },

  afterLogin: async (result) => {
    if (result.success) {
      // Track login event
      analytics.track("user_login", {
        userId: result.user.id,
        timestamp: Date.now(),
      });
    }
    return result;
  },

  beforeLogout: async () => {
    // Cleanup tasks before logout
    await saveUserSession();
  },

  afterLogout: async () => {
    // Cleanup after logout
    clearUserCache();
  },
};

// Apply middleware
initializeAuth({
  middleware: authMiddleware,
});
```

### Custom Route Components

```jsx
// Advanced route component with animations
const AnimatedRoute = ({ route, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <RouteGuard route={route}>
      <div className={`route-transition ${isVisible ? "visible" : "hidden"}`}>
        {children}
      </div>
    </RouteGuard>
  );
};

// Route with loading state
const LazyRoute = ({ route, children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Preload route data
    if (route.preload) {
      route.preload().then(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [route]);

  if (loading) {
    return <div>Loading route...</div>;
  }

  return <RouteGuard route={route}>{children}</RouteGuard>;
};
```

### Integration with State Management

#### Redux Integration

```jsx
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { initializeAuth } from "react-auth-router";

// Redux slice for additional app state
const appSlice = createSlice({
  name: "app",
  initialState: { theme: "light" },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
});

const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

// Sync auth state with Redux
initializeAuth({
  onStateChange: (authState) => {
    // Sync auth state with Redux if needed
    if (authState.user) {
      store.dispatch(
        appSlice.actions.setTheme(authState.user.preferences?.theme || "light")
      );
    }
  },
});
```

#### Zustand Integration

```jsx
import { create } from "zustand";
import { initializeAuth } from "react-auth-router";

const useAppStore = create((set) => ({
  theme: "light",
  notifications: [],
  setTheme: (theme) => set({ theme }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),
}));

// Sync with auth state
initializeAuth({
  onStateChange: (authState) => {
    if (authState.type === "LOGIN_SUCCESS") {
      useAppStore
        .getState()
        .setTheme(authState.user.preferences?.theme || "light");
    }
  },
});
```

### Server-Side Rendering (SSR)

#### Next.js Integration

```jsx
// pages/_app.js
import { useEffect } from "react";
import { initializeAuth } from "react-auth-router";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize on client side only
    if (typeof window !== "undefined") {
      initializeAuth({
        // SSR-safe configuration
        validateOnInit: false, // Don't validate immediately
        autoRefresh: false, // Don't start refresh timer immediately
      });
    }
  }, []);

  return <Component {...pageProps} />;
}

// pages/protected.js
import { useAuth } from "react-auth-router";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Protected content</div>;
}
```

### Testing Utilities

```jsx
// test-utils/auth-test-utils.js
import { createAuthStore } from "react-auth-router";

export const createMockAuthStore = (initialState = {}) => {
  const mockStore = createAuthStore({
    tokenKey: "test_token",
    userKey: "test_user",
  });

  // Override methods for testing
  mockStore.login = jest.fn().mockResolvedValue({
    success: true,
    user: { id: 1, name: "Test User", roles: ["user"] },
  });

  mockStore.logout = jest.fn().mockResolvedValue({ success: true });

  if (initialState.user) {
    mockStore.user = initialState.user;
  }

  return mockStore;
};

// Component test example
import { render, screen } from "@testing-library/react";
import { Router } from "react-auth-router";
import { createMockAuthStore } from "./test-utils/auth-test-utils";

describe("Protected Component", () => {
  test("renders when user has permission", () => {
    const mockStore = createMockAuthStore({
      user: {
        id: 1,
        name: "Test",
        roles: ["admin"],
        permissions: ["read_users"],
      },
    });

    render(
      <Router>
        <ProtectedComponent />
      </Router>
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
```

---

## Support

- 📖 **Documentation**: [Full API Reference](https://github.com/Fraser123456/react-auth-router)
- 🐛 **Issues**: [GitHub Issues](https://github.com/Fraser123456/react-auth-router/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Fraser123456/react-auth-router/discussions)
- 📦 **NPM**: [react-auth-router](https://www.npmjs.com/package/react-auth-router)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Fraser Carpenter](https://github.com/Fraser123456)

---

**React Auth Router** - Build secure, performant React applications with confidence. 🚀
