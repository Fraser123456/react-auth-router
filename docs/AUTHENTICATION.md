# Authentication

> Complete guide to authentication with React Auth Router

## Table of Contents

- [Core Concepts](#core-concepts)
- [Basic Setup](#basic-setup)
- [Login Implementation](#login-implementation)
- [Logout Implementation](#logout-implementation)
- [Token Management](#token-management)
- [Authentication Hooks](#authentication-hooks)

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

## Basic Setup

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

## Login Implementation

### API-Based Login

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

### Custom Login Function

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

## Logout Implementation

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

## Token Management

### Automatic Token Refresh

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

### Custom Token Refresh

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

## Authentication Hooks

### `useAuth()`

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

### `usePermissions()`

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

### `useAuthUser()`

Hook for user data only - minimal re-renders.

```jsx
const user = useAuthUser(); // Only re-renders on user changes
```

### `useAuthLoading()`

Hook for loading state only.

```jsx
const loading = useAuthLoading(); // Only re-renders on loading changes
```

## Real-World API Integration

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

---

**[Back to Main README](../README.md)** | **[View Security Docs](./SECURITY.md)**
