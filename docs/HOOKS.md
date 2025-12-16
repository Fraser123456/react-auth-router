# Hooks

> Complete reference for all React Auth Router hooks

## Table of Contents

- [Authentication Hooks](#authentication-hooks)
- [Routing Hooks](#routing-hooks)
- [Utility Hooks](#utility-hooks)

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

## Routing Hooks

### `useRouter()`

Complete router state and navigation.

```jsx
const {
  currentPath, // Current path string
  params, // Route parameters object
  query, // Query parameters object
  hash, // Hash fragment string (v2.6.0+)
  hashParams, // Hash parameters object (v2.6.0+)
  navigate, // Navigation function
  basePath, // Base path setting
} = useRouter();
```

### `useNavigate()`

Navigation function for programmatic navigation.

```jsx
const navigate = useNavigate();

// Basic navigation
navigate("/users");

// With options
navigate("/users", {
  replace: true, // Replace current history entry
  query: { page: 2 }, // Add query parameters
  hash: "section-1", // Add hash fragment (v2.6.0+)
  state: { from: "home" }, // Add state data
});

// Navigate with hash only
navigate("/docs", { hash: "installation" });
// Result: /docs#installation

// Combine query and hash
navigate("/profile", {
  query: { edit: "true" },
  hash: "personal-info"
});
// Result: /profile?edit=true#personal-info
```

**Note:** For declarative navigation in JSX, use the `Link` component instead.

### `useGoBack()`

Navigate back in history (v2.3.0+).

```jsx
const goBack = useGoBack();

const BackButton = () => (
  <button onClick={goBack}>Go Back</button>
);
```

### `useGoForward()`

Navigate forward in history (v2.3.0+).

```jsx
const goForward = useGoForward();

const ForwardButton = () => (
  <button onClick={goForward}>Go Forward</button>
);
```

### `useHistory()`

Access multiple history navigation functions (v2.3.0+).

```jsx
const { goBack, goForward, go } = useHistory();

const NavigationButtons = () => (
  <div>
    <button onClick={goBack}>Back</button>
    <button onClick={goForward}>Forward</button>
    <button onClick={() => go(-2)}>Go back 2 pages</button>
    <button onClick={() => go(1)}>Go forward 1 page</button>
  </div>
);
```

**Available from `useHistory()`:**
- `goBack()` - Go back one page
- `goForward()` - Go forward one page
- `go(delta)` - Go to a specific point in history (negative = back, positive = forward)

### `useParams()`

Route parameters only.

```jsx
const params = useParams();
// URL: /users/123/edit
// params = { id: "123" }
```

### `useQuery()`

Query parameters only.

```jsx
const query = useQuery();
// URL: /users?page=2&sort=name
// query = { page: "2", sort: "name" }
```

### `useHash()` (v2.6.0+)

Get the complete hash fragment string (without the `#` symbol).

```jsx
const hash = useHash();

// URL: /page#section-1
// hash = "section-1"

// URL: /page#access_token=xyz&token_type=bearer
// hash = "access_token=xyz&token_type=bearer"

// URL: /page (no hash)
// hash = ""
```

**Use Cases:**
- Reading page anchors
- Processing OAuth callback hashes
- Accessing client-side state from URL

### `useHashParams()` (v2.6.0+)

Parse hash parameters into an object (similar to query parameters).

```jsx
const hashParams = useHashParams();

// URL: /auth/callback#access_token=xyz&token_type=bearer&expires_in=3600
// hashParams = {
//   access_token: "xyz",
//   token_type: "bearer",
//   expires_in: "3600"
// }

// URL: /page#section-1 (just a fragment, no parameters)
// hashParams = {}
```

**Common Use Case - OAuth Callbacks:**
```jsx
const SupabaseCallback = () => {
  const hashParams = useHashParams();
  const navigate = useNavigate();

  useEffect(() => {
    const { access_token, refresh_token } = hashParams;

    if (access_token) {
      // Process OAuth tokens
      handleAuthentication(access_token, refresh_token);

      // Clear hash from URL
      navigate("/dashboard", { replace: true });
    }
  }, [hashParams]);

  return <div>Processing authentication...</div>;
};
```

### `useRouteContext()`

Access route context for nested routes.

```jsx
const { parentRoute, currentRoute } = useRouteContext();
```

### `useHasChildRoutes()`

Check if current route has child routes (useful for Outlet components).

```jsx
const hasChildRoutes = useHasChildRoutes();

return (
  <div>
    {hasChildRoutes ? (
      <Outlet />
    ) : (
      <div>No child routes</div>
    )}
  </div>
);
```

## Utility Hooks

### `useError()`

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

### `useApiError()`

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

---

**[Back to Main README](../README.md)** | **[View API Reference](./API-REFERENCE.md)**
