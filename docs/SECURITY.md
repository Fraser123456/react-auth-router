# Security

> Enterprise-grade security features for React Auth Router (v2.4.0+)

## Table of Contents

- [Overview](#overview)
- [Security Modes](#security-modes)
- [Storage Strategies](#storage-strategies)
- [Token Rotation](#token-rotation)
- [CSRF Protection](#csrf-protection)
- [Security Comparison](#security-comparison)
- [Migration Guide](#migration-guide-v230--v240)
- [Security Best Practices](#security-best-practices)
- [Advanced Security Configuration](#advanced-security-configuration)
- [Security Checklist](#security-checklist)

## Overview

React Auth Router v2.4.0 introduces **enterprise-grade security features** for handling authentication tokens securely. These features protect against common security vulnerabilities including XSS attacks, CSRF attacks, and token theft.

## Security Modes

The library offers three security modes to balance security and convenience:

### 1. Recommended Mode (Most Secure) ⭐

**Best for:** Production applications, banking, healthcare, high-security apps

```jsx
import { initializeAuth } from "react-auth-router";

initializeAuth({
  securityMode: 'recommended',
  // Or use the shorthand:
  // secureTokens: true,

  // Optional: Enable CSRF protection
  csrf: {
    enabled: true,
    headerName: 'X-CSRF-Token',
  },
});
```

**What it does:**
- ✅ Access tokens stored in **memory** (lost on page refresh, immune to XSS reading)
- ✅ Refresh tokens in **httpOnly cookies** (managed by backend, immune to JavaScript access)
- ✅ User data in **sessionStorage** (cleared when browser closes)
- ✅ Automatic token rotation on refresh
- ✅ CSRF protection when enabled

**Security benefits:**
- Maximum protection against XSS token theft
- Refresh tokens never accessible to JavaScript
- Tokens don't persist across browser sessions unnecessarily

### 2. Custom Mode (Flexible)

**Best for:** Specific requirements, gradual migration

```jsx
import { initializeAuth } from "react-auth-router";

initializeAuth({
  securityMode: 'custom',
  storageConfig: {
    accessToken: {
      storage: 'sessionStorage',  // 'memory' | 'sessionStorage' | 'localStorage'
      key: 'access_token',
    },
    refreshToken: {
      storage: 'httpOnly',  // 'httpOnly' | 'sessionStorage' | 'localStorage'
      key: 'refresh_token',
    },
    user: {
      storage: 'sessionStorage',
      key: 'user_data',
    },
  },
  tokenRotation: true,  // Rotate refresh tokens
  csrf: {
    enabled: true,
  },
});
```

### 3. Legacy Mode (Backward Compatible)

**Best for:** Existing applications, gradual migration

```jsx
// Using old configuration keys automatically enables legacy mode
initializeAuth({
  tokenKey: 'auth_token',    // Stored in localStorage
  userKey: 'auth_state',      // Stored in localStorage
  refreshInterval: 15 * 60 * 1000,
});
```

**What it does:**
- Maintains backward compatibility
- Stores tokens in localStorage (same as v2.3.0 and earlier)
- No breaking changes for existing users

## Storage Strategies

### Memory Storage (Most Secure) 🔒

```jsx
storageConfig: {
  accessToken: {
    storage: 'memory',
    key: 'access_token',
  },
}
```

**Pros:**
- ✅ Immune to XSS attacks that read storage
- ✅ Highest security level
- ✅ Tokens never persist on disk

**Cons:**
- ❌ Lost on page refresh (need to re-authenticate)
- ❌ Not suitable for refresh tokens

**Best for:** Short-lived access tokens (15 minutes)

### SessionStorage (Moderate Security)

```jsx
storageConfig: {
  accessToken: {
    storage: 'sessionStorage',
    key: 'access_token',
  },
}
```

**Pros:**
- ✅ Cleared when browser closes
- ✅ Persists across page refreshes in same tab
- ✅ Good balance of security and UX

**Cons:**
- ❌ Vulnerable to XSS attacks
- ❌ Separate per browser tab

**Best for:** User data, access tokens with moderate security needs

### LocalStorage (Lower Security, High Convenience)

```jsx
storageConfig: {
  accessToken: {
    storage: 'localStorage',
    key: 'access_token',
  },
}
```

**Pros:**
- ✅ Persists across browser sessions
- ✅ Survives browser restart
- ✅ Best user experience (stays logged in)

**Cons:**
- ❌ Vulnerable to XSS attacks
- ❌ Persists indefinitely until cleared

**Best for:** Low-risk applications, development

### HttpOnly Cookies (Most Secure for Refresh Tokens) 🔒

```jsx
storageConfig: {
  refreshToken: {
    storage: 'httpOnly',
    key: 'refresh_token',  // Cookie name
  },
}
```

**Pros:**
- ✅ **Cannot be accessed by JavaScript** (immune to XSS theft)
- ✅ Automatically sent with HTTP requests
- ✅ Server-side control
- ✅ Supports secure, SameSite attributes

**Cons:**
- ❌ Requires backend implementation
- ❌ Cannot be read client-side

**Best for:** Refresh tokens (long-lived authentication)

**Backend Requirements:**

Your server must:
1. Set httpOnly cookie on login/refresh
2. Read cookie on token refresh endpoint
3. Rotate cookies on each refresh (recommended)

**Example backend (Node.js/Express):**

```javascript
// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  // Validate credentials...
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set httpOnly cookie for refresh token
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,  // HTTPS only
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  });

  res.json({
    user: user,
    accessToken: accessToken,
    // Don't send refreshToken in response body
  });
});

// Refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  // Read refresh token from httpOnly cookie
  const refreshToken = req.cookies.refresh_token;

  // Validate and generate new tokens...
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);  // Token rotation

  // Update httpOnly cookie
  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: newAccessToken });
});
```

## Token Rotation

Token rotation enhances security by changing refresh tokens on each use, preventing token reuse attacks.

```jsx
initializeAuth({
  tokenRotation: true,  // Default: true in v2.4.0+
  customRefresh: async (currentAccessToken) => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',  // Send httpOnly cookies
    });

    const data = await response.json();

    // Return new access token
    // New refresh token is set as httpOnly cookie by backend
    return {
      accessToken: data.accessToken,
      // refreshToken is optional (if not using httpOnly)
    };
  },
});
```

**How it works:**
1. Use refresh token to get new access token
2. Server generates **new refresh token**
3. Old refresh token is invalidated
4. New refresh token is returned/set

**Benefits:**
- Stolen tokens become useless after one refresh
- Limits damage from token compromise
- Enables detection of token theft

## CSRF Protection

Cross-Site Request Forgery (CSRF) protection is essential when using cookie-based authentication.

```jsx
initializeAuth({
  securityMode: 'recommended',
  csrf: {
    enabled: true,
    tokenKey: 'csrf_token',          // Storage key
    headerName: 'X-CSRF-Token',      // HTTP header name
    cookieName: 'csrf_token',        // Cookie name to read from
  },
});
```

**How it works:**
1. Backend sends CSRF token in response header or non-httpOnly cookie
2. Library stores CSRF token in sessionStorage
3. CSRF token is automatically added to all authenticated requests
4. Backend validates CSRF token matches

**Backend setup:**

```javascript
// Send CSRF token
app.post('/api/auth/login', (req, res) => {
  const csrfToken = generateCsrfToken();

  // Option 1: Send in response header
  res.setHeader('X-CSRF-Token', csrfToken);

  // Option 2: Send in non-httpOnly cookie
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,  // Must be readable by JavaScript
    secure: true,
    sameSite: 'strict',
  });

  res.json({ user, accessToken });
});

// Validate CSRF token
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    const csrfToken = req.headers['x-csrf-token'];
    if (!validateCsrfToken(csrfToken, req.session)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  next();
});
```

## Security Comparison

| Feature | Legacy Mode | Custom Mode | Recommended Mode |
|---------|------------|-------------|-------------------|
| Access Token Storage | localStorage | Configurable | Memory |
| Refresh Token Storage | localStorage | Configurable | httpOnly Cookie |
| XSS Protection | ⚠️ Low | 🟡 Medium | ✅ High |
| Persists Refresh | ✅ Yes | 🟡 Depends | ❌ No (Server) |
| Token Rotation | ❌ Optional | ✅ Configurable | ✅ Default On |
| CSRF Protection | ❌ No | 🟡 Optional | ✅ Recommended |
| Page Refresh | ✅ Stays Logged In | 🟡 Depends | ⚠️ Re-auth Needed* |
| Security Level | 🟡 Medium | 🟡 Medium-High | ✅ High |

*With httpOnly cookies, users stay logged in via automatic refresh on page load

## Migration Guide (v2.3.0 → v2.4.0)

### No Changes Required ✅

Existing code continues to work without modifications:

```jsx
// This still works (legacy mode)
initializeAuth({
  tokenKey: 'auth_token',
  userKey: 'auth_state',
  refreshInterval: 15 * 60 * 1000,
});
```

### Gradual Migration (Recommended)

**Step 1: Switch to recommended mode**
```jsx
initializeAuth({
  securityMode: 'recommended',
  // Keep your existing configuration
  permissionHierarchy: { /* ... */ },
});
```

**Step 2: Implement httpOnly cookie backend** (if not already done)

**Step 3: Enable CSRF protection**
```jsx
initializeAuth({
  securityMode: 'recommended',
  csrf: { enabled: true },
});
```

**Step 4: Update refresh endpoint to support httpOnly**
```jsx
initializeAuth({
  securityMode: 'recommended',
  csrf: { enabled: true },
  customRefresh: async () => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',  // Important: Send cookies
    });

    const data = await response.json();
    return { accessToken: data.accessToken };
  },
});
```

## Security Best Practices

### ✅ DO:

1. **Use Recommended Mode for Production**
   ```jsx
   initializeAuth({ securityMode: 'recommended' });
   ```

2. **Implement httpOnly Cookies for Refresh Tokens**
   - Never send refresh tokens in response body
   - Always use httpOnly, secure, SameSite cookies

3. **Enable CSRF Protection**
   ```jsx
   csrf: { enabled: true }
   ```

4. **Use Short-Lived Access Tokens**
   - 15 minutes or less
   - Refresh automatically before expiration

5. **Implement Token Rotation**
   ```jsx
   tokenRotation: true
   ```

6. **Validate Tokens Server-Side**
   - Client-side validation is convenience only
   - Always validate on backend

7. **Use HTTPS in Production**
   - Required for secure cookies
   - Prevents man-in-the-middle attacks

### ❌ DON'T:

1. **Don't Store Refresh Tokens in localStorage** (for high-security apps)
   ```jsx
   // ❌ Avoid this for sensitive apps
   storageConfig: {
     refreshToken: { storage: 'localStorage' }
   }
   ```

2. **Don't Disable Token Rotation** (unless you have a specific reason)
   ```jsx
   // ❌ Less secure
   tokenRotation: false
   ```

3. **Don't Skip CSRF Protection** (when using cookies)
   ```jsx
   // ❌ Required for cookie-based auth
   csrf: { enabled: false }
   ```

4. **Don't Trust Client-Side Token Validation**
   - Always validate on server

5. **Don't Use HTTP in Production**
   - Cookies marked `secure` won't work
   - Tokens can be intercepted

## JWT-Based Permission Validation (v2.7.0+)

Permission and role checks now read directly from the **decoded JWT access token** rather than from the user object in sessionStorage/localStorage.

### Why This Matters

Previously, `hasRole` and `hasPermission` read from the user object stored in browser storage. A user could open DevTools, edit the `roles` or `permissions` fields in sessionStorage, and bypass UI-level access control — gaining access to screens they shouldn't see. While your server-side APIs would still reject unauthorized requests, the UI was misleadingly accessible.

### How It Works Now

When `hasRole`, `hasPermission`, or any permission check method is called, the library:

1. Decodes the current JWT access token (reads from whichever storage strategy you configured)
2. Extracts `roles` and `permissions` claims from the token payload
3. Uses those values for all checks
4. Falls back to the stored user object only if the token has no `roles`/`permissions` claims (backward compatibility)

Because the JWT is server-signed, modifying the token payload in storage breaks its signature. The token becomes unusable for API calls, and the client-side UI checks now also reflect the unmodified, server-issued claims.

### What Your JWT Must Include

For JWT-based checks to work, your server must include roles and/or permissions in the token payload:

```json
{
  "sub": "user-id",
  "name": "John Doe",
  "roles": ["manager"],
  "permissions": ["read_users", "write_users", "read_settings"],
  "exp": 1234567890
}
```

Supported permission claim names: `permissions` or `perms`.

### Storage Security Impact

| Storage Type | Can be tampered? | JWT check protects against? |
|---|---|---|
| `localStorage` | Yes (DevTools) | ✅ Yes |
| `sessionStorage` | Yes (DevTools) | ✅ Yes |
| `memory` | No (JS only) | ✅ Already secure |

> **Note:** Client-side security is always a convenience layer. The authoritative security check must remain on your server. JWT validation without signature verification on the client means a determined attacker who crafts a well-formed fake JWT could still bypass UI checks — but they would fail on any real API call. Use the recommended security mode (access token in memory) to make token tampering impossible.

### Backward Compatibility

If your JWT does not include `roles` or `permissions` claims, the library falls back to the stored user object. No changes are required for existing implementations, but your users will not benefit from the tamper-resistant checks until your backend includes these claims in the token.

## Security Checklist

Before deploying to production:

- [ ] Using `securityMode: 'recommended'` or secure custom configuration
- [ ] Access tokens are short-lived (≤15 minutes)
- [ ] Refresh tokens in httpOnly cookies (if possible)
- [ ] Token rotation enabled
- [ ] CSRF protection enabled (if using cookies)
- [ ] HTTPS enabled in production
- [ ] Backend validates all tokens
- [ ] Backend implements proper CORS configuration
- [ ] Sensitive API endpoints require authentication
- [ ] JWT payload includes `roles` and `permissions` claims (required for JWT-based permission checks)
- [ ] Regular security audits scheduled

## Advanced Security Configuration

```jsx
import {
  initializeAuth,
  getRecommendedStorageConfig,
  createCsrfHandler,
} from "react-auth-router";

// Get recommended configuration and customize
const storageConfig = getRecommendedStorageConfig();

// Customize if needed
storageConfig.accessToken.storage = 'sessionStorage';  // Override if needed

initializeAuth({
  securityMode: 'custom',
  storageConfig: storageConfig,

  // Token rotation
  tokenRotation: true,

  // CSRF configuration
  csrf: {
    enabled: true,
    tokenKey: 'csrf_token',
    headerName: 'X-CSRF-Token',
    cookieName: 'csrf_token',
  },

  // Custom login with security
  customLogin: async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include',  // Important: Include cookies
    });

    const data = await response.json();

    return {
      user: data.user,
      accessToken: data.accessToken,
      // refreshToken is in httpOnly cookie, don't include here
    };
  },

  // Custom refresh with security
  customRefresh: async () => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',  // Send httpOnly cookie
    });

    const data = await response.json();

    return {
      accessToken: data.accessToken,
    };
  },

  // Custom logout with security
  customLogout: async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',  // Clear httpOnly cookie
    });
  },
});
```

### Getting the Refresh Token

In recommended mode with httpOnly cookies:

```jsx
import { useAuth } from "react-auth-router";

const { getRefreshToken } = useAuth();

// This will return null and log an info message
const refreshToken = getRefreshToken();
// [AuthStore] Refresh token is stored in httpOnly cookie and cannot be accessed from JavaScript

// This is correct behavior for security!
```

To check if user has valid tokens:
```jsx
const { isAuthenticated, user } = useAuth();

if (isAuthenticated && user) {
  // User is authenticated
  // Tokens are managed automatically
}
```

---

**[Back to Main README](../README.md)**
