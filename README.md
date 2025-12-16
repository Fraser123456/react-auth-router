# React Auth Router

> A comprehensive React library for authentication and routing with permissions, error handling, and performance optimization using subscriber patterns.

[![npm version](https://badge.fury.io/js/react-auth-router.svg)](https://badge.fury.io/js/react-auth-router)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Features

- 🚀 **High Performance** - Subscriber pattern prevents unnecessary re-renders
- 🔐 **Comprehensive Auth** - JWT tokens, automatic refresh, cross-tab sync
- 🔒 **Secure Token Storage** - Multiple storage strategies: memory, sessionStorage, localStorage, httpOnly cookies (v2.4.0+)
- 🔄 **Token Rotation** - Automatic refresh token rotation for enhanced security (v2.4.0+)
- 🛡️ **CSRF Protection** - Built-in Cross-Site Request Forgery protection (v2.4.0+)
- 🔑 **Separate Token Management** - Distinct handling for access and refresh tokens (v2.4.0+)
- 🛡️ **Advanced Permissions** - Role-based + permission-based access control
- 🔒 **Security First** - Prevent route enumeration attacks by showing 404 for unauthorized routes (secure by default)
- 🧭 **Flexible Routing** - Nested routes with automatic child matching, parameters, query strings, Link component for declarative navigation
- 🏠 **Smart Default Routes** - Automatically redirect users to appropriate landing pages based on authentication state (v2.3.0+)
- #️⃣ **Hash Fragment Support** - Full support for URL hash fragments and hash parameters for OAuth callbacks (v2.6.0+)
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
        <Routes
          routeConfig={routeConfig}
          authenticatedDefaultRoute="/dashboard"
          unauthenticatedDefaultRoute="/"
        />
      </main>
    </Router>
  );
}

export default App;
```

## Documentation

### Core Guides

- **[Security Guide](./docs/SECURITY.md)** - Enterprise-grade security features, token storage strategies, CSRF protection
- **[Authentication](./docs/AUTHENTICATION.md)** - Complete guide to authentication, login/logout, token management
- **[Routing](./docs/ROUTING.md)** - Route configuration, nested routes, Link component, guest-only routes, default routes
- **[Hash Routing](./docs/HASH-ROUTING.md)** 🆕 - URL hash fragments and hash parameters for OAuth callbacks (v2.6.0+)
- **[Permissions](./docs/PERMISSIONS.md)** - Role-based and permission-based access control
- **[Components](./docs/COMPONENTS.md)** - Navigation, Breadcrumb, Routes, RouteGuard, Outlet components
- **[Hooks](./docs/HOOKS.md)** - Complete reference for all hooks (useAuth, useRouter, usePermissions, etc.)
- **[Error Handling](./ReadeMe_Error.md)** - Error boundaries, toast notifications, useError and useApiError hooks

### Reference

- **[API Reference](./docs/API-REFERENCE.md)** - Complete API documentation for all classes and utilities
- **[Examples](./docs/EXAMPLES.md)** - Complete app examples and real-world API integration

### Guides

- **[Migration Guide](./docs/MIGRATION-GUIDE.md)** - Guides for migrating between versions and from other libraries
- **[Best Practices](./docs/BEST-PRACTICES.md)** - Performance optimization, security, code organization
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Solutions to common issues and debugging tips
- **[Advanced Usage](./docs/ADVANCED-USAGE.md)** - Custom auth stores, middleware, SSR, testing utilities

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

## Basic Usage Examples

### Authentication

```jsx
const LoginPage = () => {
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    const result = await login(credentials, {
      apiEndpoint: "/api/auth/login",
    });

    if (result.success) {
      navigate("/dashboard");
    }
  };

  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? "Logging in..." : "Login"}
    </button>
  );
};
```

### Permissions

```jsx
const UserActions = () => {
  const { hasPermission } = usePermissions();

  return (
    <div>
      {hasPermission("read_users") && <button>View Users</button>}
      {hasPermission("write_users") && <button>Create User</button>}
    </div>
  );
};
```

### Navigation

```jsx
// Declarative navigation with Link component
<Link to="/users">Users</Link>
<Link to="/users" query={{ page: 2 }}>Users Page 2</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate("/users", { query: { page: 2 } });

// History navigation (v2.3.0+)
const { goBack, goForward, go } = useHistory();
<button onClick={goBack}>Back</button>
```

## What's New

### v2.6.0 - Hash Fragment Support 🆕
- Full support for URL hash fragments (`#section`)
- Parse hash parameters for OAuth callbacks (`#access_token=xyz&token_type=bearer`)
- New `useHash()` and `useHashParams()` hooks
- Hash support in `navigate()` and `Link` component
- Perfect for Supabase, Auth0, and other OAuth providers
- Automatic `hashchange` event handling

### v2.5.0 - Layout Routes with Outlet
- Added `Outlet` component for layout routes
- Added `useHasChildRoutes()` hook
- Support for parent layouts that wrap child routes

### v2.4.0 - Enhanced Security
- Enterprise-grade security modes (Recommended/Custom/Legacy)
- Multiple storage strategies (memory, sessionStorage, localStorage, httpOnly cookies)
- Automatic token rotation
- CSRF protection
- Separate access/refresh token management

### v2.3.0 - Default Routes & Navigation
- Default route functionality for "/" path
- Navigation history hooks (`useGoBack`, `useGoForward`, `useHistory`)
- Smart authentication-based redirects

### v2.2.2 - Guest-Only Routes
- `requireGuest` property for login/register routes
- Prevents authenticated users from accessing auth pages

### v2.2.1 - Security Enhancement
- Secure by default: unauthorized routes show 404
- Prevents route enumeration attacks

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
