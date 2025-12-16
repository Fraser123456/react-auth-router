# Migration Guide

> Guides for migrating between versions and from other libraries

## Table of Contents

- [From v2.2.2 to v2.3.0](#from-v222-to-v230-new-features---default-routes--navigation-history)
- [From v2.2.1 to v2.2.2](#from-v221-to-v222-bug-fix---guest-only-routes)
- [From v2.2.0 to v2.2.1](#from-v220-to-v221-security-update)
- [From React Router + Context Auth](#from-react-router--context-auth)

## From v2.2.2 to v2.3.0 (New Features - Default Routes & Navigation History)

**What's New:**
Version 2.3.0 adds two major features:
1. Default route functionality to handle the "/" root path intelligently
2. Navigation history hooks for programmatic back/forward navigation

**1. New Props for Routes Component:**
```jsx
<Routes
  routeConfig={routeConfig}
  defaultRoute="/home"                          // NEW: Default for all users
  authenticatedDefaultRoute="/dashboard"        // NEW: Default for authenticated users
  unauthenticatedDefaultRoute="/home"          // NEW: Default for unauthenticated users
/>
```

**2. New Navigation History Hooks:**
```jsx
import { useGoBack, useGoForward, useHistory } from "react-auth-router";

// Simple back button
const goBack = useGoBack();
<button onClick={goBack}>Back</button>

// Forward button
const goForward = useGoForward();
<button onClick={goForward}>Forward</button>

// Full history control
const { goBack, goForward, go } = useHistory();
<button onClick={() => go(-2)}>Go back 2 pages</button>
```

**Action Required:**
✅ **No breaking changes** - This is fully backward compatible!

**Optional Upgrade:**
If you're currently handling "/" with route config or custom logic, you can simplify by using the new default route props.

## From v2.2.1 to v2.2.2 (Bug Fix - Guest-Only Routes)

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
- ✅ Better security

## From v2.2.0 to v2.2.1 (Security Update)

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

## From React Router + Context Auth

### Before (React Router + Context)

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

### After (React Auth Router)

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
    <Routes routeConfig={routeConfig} pageComponents={pageComponents} />
  </Router>
);
```

### Benefits After Migration

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

---

**[Back to Main README](../README.md)** | **[View Best Practices](./BEST-PRACTICES.md)**
