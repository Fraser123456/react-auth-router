# Hash Fragment Routing

> Complete guide to working with URL hash fragments and hash parameters in React Auth Router (v2.6.0+)

## Table of Contents

- [Overview](#overview)
- [Use Cases](#use-cases)
- [Hash Fragments vs Query Parameters](#hash-fragments-vs-query-parameters)
- [Basic Usage](#basic-usage)
- [OAuth/Authentication Callbacks](#oauthauthentication-callbacks)
- [Hooks Reference](#hooks-reference)
- [Navigation with Hash](#navigation-with-hash)
- [Link Component with Hash](#link-component-with-hash)
- [Examples](#examples)

## Overview

Hash fragments are the part of a URL that comes after the `#` symbol. React Auth Router v2.6.0+ provides full support for:
- Reading hash fragments from URLs
- Parsing hash parameters (e.g., `#access_token=xyz&token_type=bearer`)
- Navigating with hash fragments
- Listening to hash changes

**URL Structure:**
```
https://example.com/path?query=param#hash-fragment
                         ↑            ↑
                     Query Params   Hash Fragment
```

## Use Cases

Hash fragments are commonly used for:

1. **OAuth/Authentication Callbacks** - Providers like Supabase, Auth0, Firebase return tokens in the hash
2. **Page Anchors** - Linking to specific sections on a page (`#section-1`)
3. **Client-side State** - Storing temporary state that shouldn't go to the server
4. **Single-page Apps** - Hash-based routing (though this library uses HTML5 History API by default)

## Hash Fragments vs Query Parameters

| Feature | Query Parameters (`?key=value`) | Hash Fragments (`#key=value`) |
|---------|--------------------------------|------------------------------|
| **Server Access** | ✅ Sent to server | ❌ Only available client-side |
| **Security** | ⚠️ Visible in logs | ✅ Not sent to server (more secure for tokens) |
| **OAuth Tokens** | Less common | ✅ Common pattern (Auth0, Supabase, etc.) |
| **SEO** | ✅ Indexed by search engines | ❌ Usually ignored |
| **Use Case** | Server-side filtering, pagination | Client-side state, tokens, anchors |

**Example OAuth Callback URL:**
```
/auth/callback?type=invite#access_token=eyJhbGc...&token_type=bearer&expires_in=3600
               ↑                          ↑
          Query Params              Hash Parameters
```

## Basic Usage

### Reading Hash Fragments

```jsx
import { useHash, useHashParams } from "react-auth-router";

const MyComponent = () => {
  // Get the entire hash string (without the # symbol)
  const hash = useHash();
  // Example: "access_token=xyz&token_type=bearer"

  // Get hash parameters as an object
  const hashParams = useHashParams();
  // Example: { access_token: "xyz", token_type: "bearer" }

  return (
    <div>
      <p>Full Hash: {hash}</p>
      <p>Access Token: {hashParams.access_token}</p>
      <p>Token Type: {hashParams.token_type}</p>
    </div>
  );
};
```

### Different Hash Types

```jsx
const Examples = () => {
  const hash = useHash();
  const hashParams = useHashParams();

  // URL: /page#section-1
  // hash = "section-1"
  // hashParams = {} (no parameters)

  // URL: /page#access_token=xyz&type=bearer
  // hash = "access_token=xyz&type=bearer"
  // hashParams = { access_token: "xyz", type: "bearer" }

  return <div>Hash: {hash}</div>;
};
```

## OAuth/Authentication Callbacks

This is the primary use case for hash fragment support - handling OAuth callbacks from authentication providers.

### Supabase Example

```jsx
import { useEffect } from "react";
import { useHashParams, useNavigate } from "react-auth-router";

const SupabaseCallback = () => {
  const hashParams = useHashParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase returns tokens in hash parameters
    const { access_token, refresh_token, token_type, expires_in } = hashParams;

    if (access_token) {
      // Store tokens and authenticate user
      handleSupabaseAuth(access_token, refresh_token);

      // Redirect to dashboard (removing hash from URL)
      navigate("/dashboard", { replace: true });
    }
  }, [hashParams]);

  return <div>Processing authentication...</div>;
};

const handleSupabaseAuth = async (accessToken, refreshToken) => {
  // Your auth logic here
  const { login } = useAuth();

  await login(
    { accessToken, refreshToken },
    {
      customLogin: async ({ accessToken, refreshToken }) => {
        // Verify token with Supabase
        const { data: { user } } = await supabase.auth.getUser(accessToken);

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata.name,
            roles: ["user"],
            permissions: [],
          },
          token: accessToken,
        };
      },
    }
  );
};
```

### Auth0 Example

```jsx
import { useEffect } from "react";
import { useHashParams, useNavigate, useAuth } from "react-auth-router";

const Auth0Callback = () => {
  const hashParams = useHashParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const { access_token, id_token, expires_in, token_type, error } = hashParams;

    if (error) {
      console.error("Auth0 error:", error);
      navigate("/login", { replace: true });
      return;
    }

    if (access_token) {
      processAuth0Token(access_token, id_token);
    }
  }, [hashParams]);

  const processAuth0Token = async (accessToken, idToken) => {
    try {
      // Decode and verify token with your backend
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, idToken }),
      });

      const data = await response.json();

      await login(
        {},
        {
          customLogin: async () => ({
            user: data.user,
            token: accessToken,
          }),
        }
      );

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Failed to verify token:", error);
      navigate("/login", { replace: true });
    }
  };

  return <div>Authenticating with Auth0...</div>;
};
```

### Generic OAuth Pattern

```jsx
const OAuthCallback = () => {
  const hashParams = useHashParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Common OAuth hash parameters
    const {
      access_token,
      refresh_token,
      token_type,
      expires_in,
      state,
      error,
      error_description,
    } = hashParams;

    if (error) {
      console.error("OAuth error:", error, error_description);
      navigate("/login", { replace: true });
      return;
    }

    if (access_token) {
      handleOAuthCallback(access_token, refresh_token, state);
    }
  }, [hashParams]);

  return (
    <div className="callback-page">
      <p>Processing authentication...</p>
    </div>
  );
};
```

## Hooks Reference

### `useHash()`

Returns the complete hash fragment string (without the `#` symbol).

```jsx
const hash = useHash();

// URL: /page#section-1
// hash = "section-1"

// URL: /page#access_token=xyz&type=bearer
// hash = "access_token=xyz&type=bearer"

// URL: /page (no hash)
// hash = ""
```

**Return Type:** `string`

**Performance:** Only re-renders when hash changes

### `useHashParams()`

Returns an object of parsed hash parameters.

```jsx
const hashParams = useHashParams();

// URL: /page#access_token=xyz&token_type=bearer&expires_in=3600
// hashParams = {
//   access_token: "xyz",
//   token_type: "bearer",
//   expires_in: "3600"
// }

// URL: /page#section-1 (not parameters, just a fragment)
// hashParams = {}
```

**Return Type:** `Record<string, string>`

**Performance:** Only re-renders when hash parameters change

### `useRouter()`

Access hash data along with other router state:

```jsx
const { currentPath, params, query, hash, hashParams, navigate } = useRouter();

console.log(hash);        // "access_token=xyz&type=bearer"
console.log(hashParams);  // { access_token: "xyz", type: "bearer" }
```

## Navigation with Hash

### Programmatic Navigation

```jsx
import { useNavigate } from "react-auth-router";

const MyComponent = () => {
  const navigate = useNavigate();

  const navigateToSection = () => {
    navigate("/docs", { hash: "section-1" });
    // URL: /docs#section-1
  };

  const navigateWithParams = () => {
    navigate("/dashboard", {
      query: { tab: "profile" },
      hash: "access_token=xyz&type=bearer",
    });
    // URL: /dashboard?tab=profile#access_token=xyz&type=bearer
  };

  return (
    <div>
      <button onClick={navigateToSection}>Go to Section</button>
      <button onClick={navigateWithParams}>Dashboard with Token</button>
    </div>
  );
};
```

**Navigate Options:**
```jsx
navigate(path, {
  replace: false,           // Replace history instead of push
  query: {},               // Query parameters object
  hash: "",                // Hash fragment string (with or without #)
  state: null,             // State to pass with navigation
});
```

## Link Component with Hash

```jsx
import { Link } from "react-auth-router";

const Navigation = () => (
  <nav>
    {/* Link to page section */}
    <Link to="/docs" hash="installation">
      Installation Guide
    </Link>

    {/* Link with query and hash */}
    <Link
      to="/dashboard"
      query={{ view: "settings" }}
      hash="profile-section"
    >
      Profile Settings
    </Link>

    {/* Hash with parameters */}
    <Link
      to="/auth/callback"
      hash="access_token=xyz&token_type=bearer"
    >
      Test OAuth Flow
    </Link>
  </nav>
);
```

## Examples

### Example 1: Scroll to Section

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
        <Link to="/docs" hash="installation">Installation</Link>
        <Link to="/docs" hash="usage">Usage</Link>
      </nav>

      <section id="intro">
        <h2>Introduction</h2>
        <p>Content...</p>
      </section>

      <section id="installation">
        <h2>Installation</h2>
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

### Example 2: Parse Multiple Token Types

```jsx
const TokenHandler = () => {
  const hashParams = useHashParams();

  useEffect(() => {
    // Handle different OAuth providers
    if (hashParams.access_token) {
      // Standard OAuth2 implicit flow
      handleOAuth2Token(hashParams);
    } else if (hashParams.id_token) {
      // OpenID Connect
      handleOpenIDToken(hashParams);
    } else if (hashParams.code) {
      // Authorization code in hash (unusual but possible)
      handleAuthCode(hashParams);
    }
  }, [hashParams]);

  return <div>Processing authentication...</div>;
};
```

### Example 3: Clear Hash After Processing

```jsx
const CallbackPage = () => {
  const hashParams = useHashParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (hashParams.access_token) {
      // Process the token
      processToken(hashParams.access_token);

      // Clear hash from URL (for security)
      navigate(window.location.pathname, { replace: true });
      // This removes the hash while keeping the path
    }
  }, [hashParams]);

  return <div>Processing...</div>;
};
```

### Example 4: Combine Query and Hash Parameters

```jsx
const ComplexCallback = () => {
  const query = useQuery();
  const hashParams = useHashParams();

  useEffect(() => {
    // Query params from URL: /auth/callback?type=invite&provider=google
    const inviteType = query.type;
    const provider = query.provider;

    // Hash params: #access_token=xyz&refresh_token=abc
    const { access_token, refresh_token } = hashParams;

    if (access_token) {
      handleAuth({
        inviteType,
        provider,
        accessToken: access_token,
        refreshToken: refresh_token,
      });
    }
  }, [query, hashParams]);

  return <div>Processing {query.provider} authentication...</div>;
};
```

## Best Practices

### ✅ DO:

1. **Clear sensitive hash data after processing**
   ```jsx
   // After extracting tokens
   navigate(window.location.pathname, { replace: true });
   ```

2. **Use hash for OAuth tokens** (security best practice)
   - Tokens in hash are not sent to server
   - More secure than query parameters

3. **Handle hash and query independently**
   ```jsx
   const query = useQuery();        // Server-side data
   const hashParams = useHashParams(); // Client-side data
   ```

4. **Validate hash parameters**
   ```jsx
   if (hashParams.access_token && hashParams.token_type === "bearer") {
     // Process valid token
   }
   ```

### ❌ DON'T:

1. **Don't store long-term sensitive data in hash**
   - Hash is visible in browser history
   - Use it for temporary tokens only

2. **Don't rely on hash for SEO**
   - Search engines typically ignore hash fragments
   - Use query parameters for SEO-relevant data

3. **Don't mix hash routing with HTML5 routing**
   - This library uses HTML5 History API by default
   - Hash fragments are for data, not routing paths

## Migration from v2.5.0

No breaking changes! All existing code continues to work. Hash support is opt-in.

**New features available:**
```jsx
// New hooks
const hash = useHash();
const hashParams = useHashParams();

// New navigation option
navigate("/path", { hash: "fragment" });

// New Link prop
<Link to="/path" hash="fragment" />
```

---

**[Back to Main README](../README.md)** | **[View Routing Docs](./ROUTING.md)** | **[View Hooks Reference](./HOOKS.md)**
