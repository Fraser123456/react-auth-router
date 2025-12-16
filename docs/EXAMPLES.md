# Examples

> Practical examples for using React Auth Router

## Table of Contents

- [Complete App Example](#complete-app-example)
- [Real-World API Integration](#real-world-api-integration)

## Complete App Example

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
                <Routes
                  routeConfig={routeConfig}
                  pageComponents={pageComponents}
                  authenticatedDefaultRoute="/dashboard"
                  unauthenticatedDefaultRoute="/"
                />
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

**[Back to Main README](../README.md)** | **[View Migration Guide](./MIGRATION-GUIDE.md)**
