# Advanced Usage

> Advanced patterns and techniques for React Auth Router

## Table of Contents

- [Custom Auth Store](#custom-auth-store)
- [Middleware System](#middleware-system)
- [Custom Route Components](#custom-route-components)
- [Integration with State Management](#integration-with-state-management)
- [Server-Side Rendering (SSR)](#server-side-rendering-ssr)
- [Testing Utilities](#testing-utilities)

## Custom Auth Store

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

## Middleware System

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

## Custom Route Components

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

## Integration with State Management

### Redux Integration

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

### Zustand Integration

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

## Server-Side Rendering (SSR)

### Next.js Integration

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

## Testing Utilities

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

**[Back to Main README](../README.md)** | **[View Best Practices](./BEST-PRACTICES.md)**
