# Best Practices

> Recommended practices for using React Auth Router effectively

## Table of Contents

- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)
- [Code Organization](#code-organization)
- [Error Handling Best Practices](#error-handling-best-practices)

## Performance Optimization

### Use Specialized Hooks

```jsx
// ❌ Less efficient - re-renders on all auth changes
const { user, hasRole } = useAuth();

// ✅ More efficient - targeted subscriptions
const user = useAuthUser(); // Only user changes
const { hasRole } = usePermissions(); // Only permission changes
```

### Memoize Components

```jsx
import { memo } from "react";

const UserCard = memo(
  ({ user }) => <div>{user.name}</div>,
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### Optimize Route Guards

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

## Security Best Practices

### Route Enumeration Protection (v2.2.1+)

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

### JWT Token Security

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

### Permission Checking

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

### Route Protection

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

### Guest-Only Routes (v2.2.2+)

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

## Code Organization

### Separate Concerns

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

### Custom Hooks

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

## Error Handling Best Practices

### Structured Error Handling

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

### Global Error Boundary

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

---

**[Back to Main README](../README.md)** | **[View Troubleshooting](./TROUBLESHOOTING.md)**
