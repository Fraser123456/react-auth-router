# Routing

> Complete guide to routing with React Auth Router

## Table of Contents

- [Route Configuration](#route-configuration)
- [Route Parameters](#route-parameters)
- [Query Parameters](#query-parameters)
- [Link Component](#link-component)
- [Nested Routes](#nested-routes)
- [Custom Route Guards](#custom-route-guards)
- [Guest-Only Routes](#guest-only-routes-v222)
- [Default Routes](#default-routes-v230)
- [Layout Routes with Outlet](#layout-routes-with-outlet)
- [Hash Fragments](#hash-fragments-v260)

## Route Configuration

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

## Route Parameters

```jsx
// URL: /users/123/edit
const UserEditPage = () => {
  const params = useParams();
  const { id } = params; // "123"

  return <div>Editing user {id}</div>;
};
```

## Query Parameters

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

## Link Component

The `Link` component provides declarative, client-side navigation without page reloads (similar to react-router-dom's Link).

### Basic Usage

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

### Advanced Link Usage

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

### Link vs useNavigate vs \<a\> Tag

```jsx
// ❌ Regular <a> tag - causes full page reload
<a href="/users">Users</a>

// ✅ Link component - client-side navigation (recommended for JSX)
<Link to="/users">Users</Link>

// ✅ useNavigate hook - programmatic navigation (recommended for event handlers)
const navigate = useNavigate();
const handleClick = () => navigate("/users");
```

### Link Props

- **`to`** (required): The path to navigate to
- **`replace`**: Replace current history entry instead of pushing (default: `false`)
- **`query`**: Object of query parameters to add to URL
- **`state`**: State data to pass with navigation
- **`className`**: CSS class name
- **`style`**: Inline styles object
- **`onClick`**: Click handler (called before navigation)
- All other HTML anchor props are supported

## Nested Routes

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

## Layout Routes with Outlet

Layout routes allow you to create parent components that wrap child routes. This is perfect for shared layouts, navigation, or containers.

```jsx
import { Outlet, useHasChildRoutes } from "react-auth-router";

// Parent layout component
const UsersLayout = () => {
  const hasChildRoutes = useHasChildRoutes();

  return (
    <div className="users-layout">
      <h1>Users Section</h1>
      <nav>
        <Link to="/users">All Users</Link>
        <Link to="/users/create">Create User</Link>
      </nav>

      {/* Render child routes here */}
      {hasChildRoutes ? (
        <Outlet />
      ) : (
        <div>Select a user or create a new one</div>
      )}
    </div>
  );
};

// Route configuration with layout
const routeConfig = createRouteConfig({
  protected: [
    {
      path: "/users",
      component: UsersLayout,  // Parent layout
      title: "Users",
      requireAuth: true,
      layout: true,  // Enable layout mode
      children: [
        {
          path: "/users/list",
          component: UsersList,
          title: "User List",
        },
        {
          path: "/users/:id",
          component: UserDetail,
          title: "User Details",
        },
      ],
    },
  ],
});
```

**Key Features:**
- `layout: true` - Marks route as a layout that will render children via `<Outlet />`
- `<Outlet />` - Renders the matched child route
- `useHasChildRoutes()` - Hook to check if current route has children
- Works seamlessly with breadcrumbs and navigation

## Custom Route Guards

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

## Guest-Only Routes (v2.2.2+)

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

## Default Routes (v2.3.0+)

Handle the "/" root path by automatically redirecting users to different routes based on their authentication state.

**The Problem:**
You can't define "/" for both public and protected routes. When users land on the root path, you need to redirect them to the appropriate starting page based on whether they're logged in.

**The Solution:**
Use default route props on the `Routes` component to specify where users should be redirected when they land on "/".

```jsx
import { Router, Routes, createRouteConfig } from "react-auth-router";

const routeConfig = createRouteConfig({
  public: [
    {
      path: "/home",
      component: "HomePage",
      title: "Home",
    },
    {
      path: "/login",
      component: "LoginPage",
      title: "Login",
    },
  ],
  protected: [
    {
      path: "/dashboard",
      component: "DashboardPage",
      title: "Dashboard",
      requireAuth: true,
    },
  ],
});

function App() {
  return (
    <Router>
      <Routes
        routeConfig={routeConfig}
        // Redirect authenticated users to /dashboard when they visit "/"
        authenticatedDefaultRoute="/dashboard"
        // Redirect unauthenticated users to /home when they visit "/"
        unauthenticatedDefaultRoute="/home"
      />
    </Router>
  );
}
```

**Available Props:**

- **`defaultRoute`** - Default redirect for all users (lowest priority)
- **`authenticatedDefaultRoute`** - Where to redirect authenticated users on "/" (overrides `defaultRoute`)
- **`unauthenticatedDefaultRoute`** - Where to redirect unauthenticated users on "/" (overrides `defaultRoute`)

**Priority Order:**
1. `authenticatedDefaultRoute` (if user is authenticated)
2. `unauthenticatedDefaultRoute` (if user is not authenticated)
3. `defaultRoute` (fallback for both)

**Examples:**

```jsx
// Simple default for everyone
<Routes
  routeConfig={routeConfig}
  defaultRoute="/home"
/>

// Different defaults based on auth state (recommended)
<Routes
  routeConfig={routeConfig}
  authenticatedDefaultRoute="/dashboard"
  unauthenticatedDefaultRoute="/home"
/>

// With fallback
<Routes
  routeConfig={routeConfig}
  authenticatedDefaultRoute="/dashboard"
  unauthenticatedDefaultRoute="/home"
  defaultRoute="/welcome"  // Used if auth state is unclear
/>
```

**How it works:**
1. When users navigate to "/" or the app first loads at "/"
2. The Routes component checks authentication state
3. Redirects to the appropriate default route using `replace: true` (doesn't add to browser history)
4. Waits for auth loading to complete before redirecting (prevents flash of wrong content)

**Benefits:**
- ✅ Clean UX - users always land on the right starting page
- ✅ No need to define "/" in your route config
- ✅ Automatic redirects based on authentication
- ✅ No browser history pollution (uses replace instead of push)

## Hash Fragments (v2.6.0+)

React Auth Router v2.6.0+ provides full support for URL hash fragments - the part of the URL after the `#` symbol.

### Why Hash Fragments?

Hash fragments are essential for:
- **OAuth callbacks** - Providers like Supabase, Auth0, Firebase return tokens in the hash
- **Page anchors** - Linking to specific sections (`#introduction`)
- **Client-side state** - Data that shouldn't be sent to the server

**Example OAuth URL:**
```
/auth/callback?type=invite#access_token=eyJhbGc...&token_type=bearer&expires_in=3600
```

### Reading Hash Data

```jsx
import { useHash, useHashParams } from "react-auth-router";

const MyComponent = () => {
  // Get the entire hash string (without #)
  const hash = useHash();

  // Get hash parameters as an object
  const hashParams = useHashParams();

  // URL: /auth/callback#access_token=xyz&token_type=bearer
  console.log(hash);        // "access_token=xyz&token_type=bearer"
  console.log(hashParams);  // { access_token: "xyz", token_type: "bearer" }

  return (
    <div>
      <p>Token: {hashParams.access_token}</p>
      <p>Type: {hashParams.token_type}</p>
    </div>
  );
};
```

### Navigating with Hash

```jsx
import { useNavigate, Link } from "react-auth-router";

const Navigation = () => {
  const navigate = useNavigate();

  // Programmatic navigation
  const goToSection = () => {
    navigate("/docs", { hash: "installation" });
    // URL: /docs#installation
  };

  const goWithQueryAndHash = () => {
    navigate("/dashboard", {
      query: { tab: "settings" },
      hash: "profile-section"
    });
    // URL: /dashboard?tab=settings#profile-section
  };

  return (
    <div>
      {/* Link with hash */}
      <Link to="/docs" hash="usage">Usage Guide</Link>

      {/* Link with query and hash */}
      <Link
        to="/profile"
        query={{ edit: "true" }}
        hash="personal-info"
      >
        Edit Profile
      </Link>

      <button onClick={goToSection}>Go to Docs</button>
    </div>
  );
};
```

### OAuth Callback Example

Perfect for handling authentication callbacks from OAuth providers:

```jsx
import { useEffect } from "react";
import { useHashParams, useNavigate, useAuth } from "react-auth-router";

const SupabaseCallback = () => {
  const hashParams = useHashParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Supabase returns tokens in hash: #access_token=...&refresh_token=...
    const { access_token, refresh_token, token_type } = hashParams;

    if (access_token) {
      // Authenticate the user
      handleAuthentication(access_token, refresh_token);

      // Clear hash and redirect (for security)
      navigate("/dashboard", { replace: true });
    }
  }, [hashParams]);

  const handleAuthentication = async (accessToken, refreshToken) => {
    await login(
      { accessToken, refreshToken },
      {
        customLogin: async ({ accessToken }) => {
          // Verify token with your backend
          const response = await fetch("/api/auth/verify", {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const user = await response.json();

          return { user, token: accessToken };
        }
      }
    );
  };

  return <div>Processing authentication...</div>;
};
```

### Scroll to Section Example

```jsx
import { useEffect } from "react";
import { useHash, Link } from "react-auth-router";

const DocumentationPage = () => {
  const hash = useHash();

  useEffect(() => {
    if (hash) {
      // Scroll to element with id matching the hash
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);

  return (
    <div>
      <nav>
        <Link to="/docs" hash="intro">Introduction</Link>
        <Link to="/docs" hash="setup">Setup</Link>
        <Link to="/docs" hash="usage">Usage</Link>
      </nav>

      <section id="intro">
        <h2>Introduction</h2>
        <p>Content...</p>
      </section>

      <section id="setup">
        <h2>Setup</h2>
        <p>Content...</p>
      </section>

      <section id="usage">
        <h2>Usage</h2>
        <p>Content...</p>
      </section>
    </div>
  );
};
```

### Hash vs Query Parameters

| Feature | Query Params `?key=val` | Hash Fragments `#key=val` |
|---------|------------------------|---------------------------|
| **Sent to Server** | ✅ Yes | ❌ No (client-only) |
| **Security** | Lower (visible in logs) | Higher (not sent to server) |
| **OAuth Tokens** | Less common | ✅ Standard pattern |
| **SEO** | ✅ Indexed | Usually ignored |
| **Use Case** | Filters, pagination | Tokens, anchors, client state |

### Best Practices

**✅ DO:**
- Use hash for OAuth tokens (more secure than query params)
- Clear hash after processing sensitive data
- Use hash for page anchors and client-side navigation
- Validate hash parameters before using them

**❌ DON'T:**
- Store long-term sensitive data in hash (visible in history)
- Rely on hash for SEO (use query params instead)
- Mix hash-based routing with HTML5 routing

**Example: Clear Hash After Processing**
```jsx
useEffect(() => {
  if (hashParams.access_token) {
    processToken(hashParams.access_token);

    // Clear hash from URL for security
    navigate(window.location.pathname, { replace: true });
  }
}, [hashParams]);
```

### Learn More

For detailed examples and OAuth integration patterns, see the complete **[Hash Routing Guide](./HASH-ROUTING.md)**.

---

**[Back to Main README](../README.md)** | **[View Components Docs](./COMPONENTS.md)** | **[View Hash Routing Guide](./HASH-ROUTING.md)**
