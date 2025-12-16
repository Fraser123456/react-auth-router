# Troubleshooting

> Solutions to common issues with React Auth Router

## Table of Contents

- [Common Issues](#common-issues)
- [Debugging Tips](#debugging-tips)
- [Browser DevTools](#browser-devtools)
- [Performance Debugging](#performance-debugging)

## Common Issues

### 1. "AuthStore not initialized" Error

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

### 2. Components Not Re-rendering on Auth Changes

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

### 3. Route Parameters Not Updating

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

### 4. Token Refresh Not Working

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

### 5. Permissions Not Working After Role Update

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

## Debugging Tips

### Enable Debug Logging

```jsx
initializeAuth({
  debug: true, // Enable debug logging
  onStateChange: (state) => {
    console.log("Auth state changed:", state);
  },
});
```

### Inspect Auth State

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

### Check Route Matching

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

## Browser DevTools

### React DevTools

1. Install React DevTools browser extension
2. Look for "AuthStore" in component props
3. Monitor hook state changes in real-time

### Network Tab

1. Monitor `/api/auth/login` requests
2. Check token refresh calls
3. Verify Authorization headers are being sent

### Application Tab

1. Check localStorage for `auth_token` and `auth_state`
2. Verify token expiration times
3. Clear storage to test logout scenarios

## Performance Debugging

### Identify Unnecessary Re-renders

```jsx
// Add to components to track re-renders
const MyComponent = () => {
  console.log("MyComponent rendered");

  // Component logic

  return <div>Content</div>;
};
```

### Use React Profiler

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

---

**[Back to Main README](../README.md)** | **[View Advanced Usage](./ADVANCED-USAGE.md)**
