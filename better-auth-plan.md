# Plan: Better Auth Adapter for react-auth-router

## Context

react-auth-router manages its own JWT-based token lifecycle. Users who want to adopt Better Auth (a full-stack, database-backed session auth platform) have no bridge — they would need to abandon either this library's routing/guards or Better Auth's session management.

This plan introduces an opt-in adapter sub-entry-point (`react-auth-router/adapters/better-auth`) that:
- Extends `AuthStore` to delegate auth operations to Better Auth's client SDK
- Supports email/password, social OAuth (Google, GitHub, etc.), magic link, username, and passkey sign-in
- Supports multi-tenancy via Better Auth's organization plugin — **opt-in, gracefully ignored for single-tenant apps**
- Leaves all routing, route guards, hooks, UI components, and the core library completely unchanged for existing users

**Target version:** v2.9.0

---

## Architecture

The adapter is a second Rollup bundle entry point in the same repo. Three core source files plus an entry point:

| File | Role |
|---|---|
| `mapBetterAuthUser.js` | Pure utility — converts Better Auth session → react-auth-router `User` shape |
| `BetterAuthStore.js` | Extends `AuthStore` — overrides auth operations, adds social/org/register methods |
| `BetterAuthSync.jsx` | Zero-UI React component — bridges `useSession()` + optional `useActiveOrganization()` into the subscriber pattern |
| `index.js` | Public adapter entry point |

No files in `src/auth`, `src/routing`, `src/components`, `src/error-management`, or `src/utils` are touched.

---

## Key Design Decisions

### Single-tenant still works out of the box
Organisation support is entirely opt-in. `BetterAuthSync` accepts `useActiveOrganization` as an **optional** prop. When omitted, the adapter behaves identically to a simple email/social auth setup. All org methods are no-ops when org plugin is not configured.

### Social auth triggers a redirect — not a synchronous return
`authClient.signIn.social()` redirects the browser to the OAuth provider. The session is established server-side on the callback. `useSession()` is reactive (built on nanostores) and automatically reflects the authenticated state when the page loads after the redirect — no manual `refetch()` needed.

### Organisation member roles are comma-separated strings
Better Auth stores org member roles as `"owner,admin"` (comma-separated, supporting multi-role membership). The adapter must split this into an array.

### `session.activeOrganizationId` is in the session payload
Better Auth stores `activeOrganizationId` directly on the session object, so `BetterAuthSync` can detect org context from `useSession()` alone. The full org membership data (including the user's role within the org) requires a separate `getFullOrganization()` call — triggered internally by `BetterAuthSync` when an active org is detected.

### `getToken()` returns null by default
Better Auth uses opaque cookie-based sessions. `getToken()` returns `this._bearerToken || null`. The Bearer plugin populates `_bearerToken` if configured (session payload includes `session.token`).

---

## Task Breakdown

---

### Task 1 — Build system: add adapter Rollup entry point
**File:** `rollup.config.js`

Add a second config object to the exported array. The plugin stack is identical to the existing entry — copy it verbatim:

```js
{
  input: "src/adapters/better-auth/index.js",
  output: [
    { file: "dist/adapters/better-auth/index.js",     format: "cjs", sourcemap: true },
    { file: "dist/adapters/better-auth/index.esm.js", format: "esm", sourcemap: true },
  ],
  plugins: [
    peerDepsExternal(),
    babel({ /* same config as existing entry */ }),
    resolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    terser(),
  ],
  external: ["react", "react-dom", "better-auth", "better-auth/react", "react-auth-router"],
}
```

`react-auth-router` is external — the adapter imports `AuthStore` from the base lib at runtime, never re-bundled.

---

### Task 2 — package.json: exports map + optional peer dep
**File:** `package.json`

**1. Add `"exports"` field** — must preserve the existing root entry:
```json
"exports": {
  ".": {
    "import":  "./dist/index.esm.js",
    "require": "./dist/index.js",
    "types":   "./types/index.d.ts"
  },
  "./adapters/better-auth": {
    "import":  "./dist/adapters/better-auth/index.esm.js",
    "require": "./dist/adapters/better-auth/index.js",
    "types":   "./types/adapters/better-auth.d.ts"
  }
}
```

**2. Add optional peer dep:**
```json
"peerDependencies": {
  "react":       ">=16.8.0 <20.0.0",
  "react-dom":   ">=16.8.0 <20.0.0",
  "better-auth": ">=1.0.0"
},
"peerDependenciesMeta": {
  "better-auth": { "optional": true }
}
```

`"files"` already includes `"types"` — `types/adapters/` is covered automatically.

---

### Task 3 — `mapBetterAuthUser.js`
**File:** `src/adapters/better-auth/mapBetterAuthUser.js`

Pure function, no React, no side effects. Accepts an optional `activeOrgMember` for multi-tenant role merging.

```js
/**
 * Maps a Better Auth session object to a react-auth-router User shape.
 *
 * @param {object} sessionData        - Better Auth session: { session, user }
 * @param {object} permissionHierarchy - react-auth-router permission hierarchy config
 * @param {object|null} activeOrgMember - The current user's membership record from
 *                                        getFullOrganization().members, or null
 */
export function mapBetterAuthUser(sessionData, permissionHierarchy, activeOrgMember = null) {
  const { user } = sessionData;

  // --- Role derivation ---
  // Priority: org-level role (if member provided) > user.roles array > user.role string > default
  let roles;

  if (activeOrgMember?.role) {
    // Org member roles are comma-separated strings: "owner,admin" → ["owner", "admin"]
    const orgRoles = activeOrgMember.role.split(',').map(r => r.trim()).filter(Boolean);
    // Also include global role so app-level guards still work alongside org guards
    const globalRole = user.role;
    roles = [...new Set([...orgRoles, globalRole].filter(Boolean))];
  } else if (Array.isArray(user.roles) && user.roles.length > 0) {
    roles = user.roles;
  } else if (typeof user.role === 'string' && user.role) {
    roles = [user.role];
  } else {
    roles = ['user'];
  }

  // --- Permission expansion ---
  // Same algorithm as AuthStore.expandPermissions — kept here to avoid circular imports
  const permissions = new Set();
  roles.forEach(role => {
    (permissionHierarchy[role] || []).forEach(p => permissions.add(p));
  });

  // Strip Better Auth-specific role fields; spread remaining custom fields through
  const { role: _role, roles: _roles, ...rest } = user;

  return {
    ...rest,
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image || null,
    roles,
    permissions: Array.from(permissions),
  };
}
```

---

### Task 4 — `BetterAuthStore.js`
**File:** `src/adapters/better-auth/BetterAuthStore.js`

#### Constructor

```js
import { AuthStore } from 'react-auth-router';
import { mapBetterAuthUser } from './mapBetterAuthUser';

export class BetterAuthStore extends AuthStore {
  constructor(authClient, config = {}) {
    // super() calls this.initialize() via JS prototype dispatch — the override fires immediately
    super(config);
    this.authClient = authClient;
    this._bearerToken = null;
    this._activeOrg = null;           // populated by syncFromSession when org plugin in use
    this._isBetterAuth = true;        // marker for consumer debugging
  }
```

#### `initialize()` override

```js
  async initialize() {
    // Better Auth is cookie-based — nothing to read from localStorage/sessionStorage.
    // Set loading to false immediately; BetterAuthSync pushes real state on mount.
    this.loading = true;
    this.notify('LOADING_START');
    this.loading = false;
    this.notify('LOADING_END');
  }
```

#### `login()` override — email/password + social detection

```js
  async login(credentials = {}, options = {}) {
    try {
      this.loading = true;
      this.notify('LOGIN_START');

      // Social auth: credentials.provider triggers OAuth redirect
      if (credentials.provider) {
        await this.authClient.signIn.social({
          provider: credentials.provider,
          callbackURL:        credentials.callbackURL        || options.callbackURL        || '/',
          errorCallbackURL:   credentials.errorCallbackURL   || options.errorCallbackURL,
          newUserCallbackURL: credentials.newUserCallbackURL || options.newUserCallbackURL,
        });
        // Browser redirects — execution stops here. BetterAuthSync handles state on return.
        return { success: true };
      }

      // Username/password (username plugin)
      if (credentials.username) {
        const result = await this.authClient.signIn.username({
          username: credentials.username,
          password: credentials.password,
        });
        if (result.error) throw new Error(result.error.message || 'Login failed');
        return { success: true };
      }

      // Default: email/password
      const result = await this.authClient.signIn.email({
        email:    credentials.email,
        password: credentials.password,
      });
      if (result.error) throw new Error(result.error.message || 'Login failed');
      return { success: true };

    } catch (error) {
      this.reportError('AUTHENTICATION', 'Login failed', error.message);
      this.notify('LOGIN_ERROR', error);
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
      this.notify('LOADING_END');
    }
  }
```

#### `loginWithSocial()` — explicit social sign-in method

```js
  async loginWithSocial(provider, options = {}) {
    return this.login({ provider, ...options });
  }
```

#### `loginWithMagicLink()` — magic link sign-in

```js
  async loginWithMagicLink(email, options = {}) {
    try {
      this.loading = true;
      this.notify('LOGIN_START');
      const result = await this.authClient.signIn.magicLink({
        email,
        callbackURL:        options.callbackURL        || '/',
        newUserCallbackURL: options.newUserCallbackURL,
        errorCallbackURL:   options.errorCallbackURL,
      });
      if (result?.error) throw new Error(result.error.message || 'Magic link failed');
      return { success: true };
    } catch (error) {
      this.reportError('AUTHENTICATION', 'Magic link failed', error.message);
      this.notify('LOGIN_ERROR', error);
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
      this.notify('LOADING_END');
    }
  }
```

#### `register()` — sign up with email/password

```js
  async register(credentials = {}, options = {}) {
    try {
      this.loading = true;
      this.notify('LOGIN_START');
      const result = await this.authClient.signUp.email(
        {
          email:    credentials.email,
          password: credentials.password,
          name:     credentials.name || credentials.email,
          ...credentials,
        },
        {
          onRequest: options.onRequest,
          onSuccess: options.onSuccess,
          onError:   options.onError,
        }
      );
      if (result?.error) throw new Error(result.error.message || 'Registration failed');
      return { success: true };
    } catch (error) {
      this.reportError('AUTHENTICATION', 'Registration failed', error.message);
      this.notify('LOGIN_ERROR', error);
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
      this.notify('LOADING_END');
    }
  }
```

#### `requestPasswordReset()` — forgot password

```js
  async requestPasswordReset(email, options = {}) {
    try {
      const result = await this.authClient.requestPasswordReset({
        email,
        redirectTo: options.redirectTo,
      });
      if (result?.error) throw new Error(result.error.message || 'Password reset request failed');
      return { success: true };
    } catch (error) {
      this.reportError('CLIENT', 'Password reset request failed', error.message);
      return { success: false, error: error.message };
    }
  }
```

#### `resetPassword()` — consume reset token

```js
  async resetPassword(token, newPassword) {
    try {
      const result = await this.authClient.resetPassword({ token, newPassword });
      if (result?.error) throw new Error(result.error.message || 'Password reset failed');
      return { success: true };
    } catch (error) {
      this.reportError('CLIENT', 'Password reset failed', error.message);
      return { success: false, error: error.message };
    }
  }
```

#### `logout()` override

```js
  async logout(_options = {}) {
    try {
      this.loading = true;
      this.notify('LOGOUT_START');
      await this.authClient.signOut();
      this.user = null;
      this._bearerToken = null;
      this._activeOrg = null;
      this.clearStorage(); // safe — base method skips null keys gracefully
      this.notify('LOGOUT_SUCCESS');
      return { success: true };
    } catch (error) {
      this.reportError('CLIENT', 'Logout failed', error.message);
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
      this.notify('LOADING_END');
    }
  }
```

#### `refreshToken()` override — no-op

```js
  async refreshToken(_options = {}) {
    // Better Auth refreshes sessions server-side automatically via cookie.
    this.notify('TOKEN_REFRESHED', null);
    return true;
  }
```

#### `getToken()` override

```js
  getToken() {
    // No JWT available by default. Populated only when Better Auth Bearer plugin is configured.
    return this._bearerToken || null;
  }
```

#### `getTokenRoles()` + `getTokenPermissions()` overrides

```js
  getTokenRoles() {
    // No JWT to decode — read from user object (populated by syncFromSession)
    return this.user?.roles || [];
  }

  getTokenPermissions() {
    return this.user?.permissions || [];
  }
```

#### `syncFromSession()` — called by BetterAuthSync only

```js
  syncFromSession(sessionData, isPending, activeOrgMember = null) {
    const wasAuthenticated = !!this.user;

    if (isPending) {
      if (!this.loading) {
        this.loading = true;
        this.notify('LOADING_START');
      }
      return;
    }

    this.loading = false;

    if (sessionData?.user) {
      const mappedUser = mapBetterAuthUser(
        sessionData,
        this.config.permissionHierarchy,
        activeOrgMember
      );
      this.user = mappedUser;

      // Cache bearer token if provided by Better Auth Bearer plugin
      if (sessionData.session?.token) {
        this._bearerToken = sessionData.session.token;
      }

      if (!wasAuthenticated) {
        this.notify('LOGIN_SUCCESS', this.user);
      } else {
        this.notify('PROFILE_UPDATE_SUCCESS', this.user);
      }
    } else {
      this.user = null;
      this._bearerToken = null;
      this._activeOrg = null;

      if (wasAuthenticated) {
        this.notify('LOGOUT_SUCCESS');
      } else {
        this.notify('LOADING_END');
      }
    }
  }
```

#### Organisation methods — all no-ops if org plugin not configured

```js
  // Returns the active organisation data (set by BetterAuthSync)
  getActiveOrganization() {
    return this._activeOrg || null;
  }

  async switchOrganization(orgIdOrSlug) {
    try {
      const param = typeof orgIdOrSlug === 'string' && orgIdOrSlug.includes('-')
        ? { organizationId: orgIdOrSlug }
        : { organizationSlug: orgIdOrSlug };
      const result = await this.authClient.organization.setActive(param);
      if (result?.error) throw new Error(result.error.message);
      return { success: true };
    } catch (error) {
      this.reportError('CLIENT', 'Switch organisation failed', error.message);
      return { success: false, error: error.message };
    }
  }

  async createOrganization(data) {
    try {
      const result = await this.authClient.organization.create(data);
      if (result?.error) throw new Error(result.error.message);
      return { success: true, organization: result.data };
    } catch (error) {
      this.reportError('CLIENT', 'Create organisation failed', error.message);
      return { success: false, error: error.message };
    }
  }

  async inviteMember(data) {
    try {
      const result = await this.authClient.organization.inviteMember(data);
      if (result?.error) throw new Error(result.error.message);
      return { success: true };
    } catch (error) {
      this.reportError('CLIENT', 'Invite member failed', error.message);
      return { success: false, error: error.message };
    }
  }

  async getFullOrganization(orgId) {
    try {
      const result = await this.authClient.organization.getFullOrganization({
        organizationId: orgId,
      });
      if (result?.error) throw new Error(result.error.message);
      return { success: true, organization: result.data };
    } catch (error) {
      this.reportError('CLIENT', 'Get organisation failed', error.message);
      return { success: false, error: error.message };
    }
  }
```

#### Org-aware permission checks

```js
  // Checks role within the active organisation only
  hasOrgRole(role) {
    const activeOrg = this.getActiveOrganization();
    if (!activeOrg) return false;
    const member = activeOrg.members?.find(m => m.userId === this.user?.id);
    if (!member) return false;
    return member.role.split(',').map(r => r.trim()).includes(role);
  }

  // Checks the global (app-level) role only — ignores org context
  hasGlobalRole(role) {
    const globalRole = this._rawUser?.role;
    if (!globalRole) return false;
    return globalRole === role;
  }

  // hasRole() keeps its existing behaviour — checks user.roles (merged org+global from mapBetterAuthUser)
  // No override needed — base class fallback to this.user?.roles works correctly
```

Note: `this._rawUser` should store the original `sessionData.user` in `syncFromSession` before mapping, so `hasGlobalRole()` can access the raw global role.

#### Factory function

```js
export const createBetterAuthStore = (authClient, config = {}) =>
  new BetterAuthStore(authClient, config);
```

---

### Task 5 — `BetterAuthSync.jsx`
**File:** `src/adapters/better-auth/BetterAuthSync.jsx`

Accepts `useActiveOrganization` as an **optional** prop. When omitted, org logic is skipped entirely — single-tenant apps are unaffected.

```jsx
import { useEffect, useRef } from 'react';

/**
 * BetterAuthSync — place inside your React tree, above any component
 * that uses react-auth-router hooks.
 *
 * Props:
 *   store                 {BetterAuthStore} — from createBetterAuthStore()
 *   useSession            {function}        — authClient.useSession
 *   useActiveOrganization {function}        — authClient.useActiveOrganization (optional)
 */
export function BetterAuthSync({ store, useSession, useActiveOrganization }) {
  const session = useSession();

  // useActiveOrganization is optional — only call it when provided (org plugin in use)
  // Rules of hooks: always call the same hooks in the same order.
  // We work around the conditional by wrapping with a no-op fallback.
  const activeOrg = (useActiveOrganization ?? (() => ({ data: null })))();

  const prevSessionRef = useRef(undefined);
  const prevOrgRef = useRef(undefined);

  useEffect(() => {
    const sessionChanged = session.data !== prevSessionRef.current || session.isPending;
    const orgChanged = activeOrg.data !== prevOrgRef.current;

    if (!sessionChanged && !orgChanged) return;

    prevSessionRef.current = session.data;
    prevOrgRef.current = activeOrg.data;

    // Resolve the current user's membership record from the active org
    let activeOrgMember = null;
    if (activeOrg.data && session.data?.user) {
      activeOrgMember = activeOrg.data.members?.find(
        m => m.userId === session.data.user.id
      ) || null;
    }

    store.syncFromSession(session.data, session.isPending, activeOrgMember);

    // Keep the store's _activeOrg up to date for getActiveOrganization()
    if (store._activeOrg !== activeOrg.data) {
      store._activeOrg = activeOrg.data || null;
    }
  }, [session.data, session.isPending, activeOrg.data, store]);

  return null;
}
```

**Single-tenant usage:**
```jsx
<Router>
  <BetterAuthSync store={store} useSession={authClient.useSession} />
  <Routes ... />
</Router>
```

**Multi-tenant usage:**
```jsx
<Router>
  <BetterAuthSync
    store={store}
    useSession={authClient.useSession}
    useActiveOrganization={authClient.useActiveOrganization}
  />
  <Routes ... />
</Router>
```

---

### Task 6 — `src/adapters/better-auth/index.js`
**File:** `src/adapters/better-auth/index.js`

```js
export { BetterAuthStore, createBetterAuthStore } from './BetterAuthStore';
export { BetterAuthSync } from './BetterAuthSync';
export { mapBetterAuthUser } from './mapBetterAuthUser';
```

---

### Task 7 — TypeScript definitions
**File:** `types/adapters/better-auth.d.ts`

Uses `declare module "react-auth-router/adapters/better-auth"` pattern, matching the style of `types/index.d.ts`.

Key interfaces to declare:

```typescript
declare module "react-auth-router/adapters/better-auth" {
  import { AuthStore, AuthConfig, User } from "react-auth-router";

  // Better Auth session user shape
  export interface BetterAuthSessionUser {
    id: string;
    name: string;
    email: string;
    emailVerified?: boolean;
    image?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    role?: string;        // admin plugin: global role string
    roles?: string[];     // optional array from custom fields / org plugin
    [key: string]: any;
  }

  export interface BetterAuthSession {
    session: {
      id: string;
      userId: string;
      token?: string;                   // Bearer plugin only
      expiresAt?: Date;
      activeOrganizationId?: string;   // Organization plugin
      [key: string]: any;
    };
    user: BetterAuthSessionUser;
  }

  export interface BetterAuthOrgMember {
    id: string;
    userId: string;
    organizationId: string;
    role: string;  // comma-separated: "owner,admin"
    createdAt?: Date;
    user?: { id: string; name: string; email: string; image?: string };
  }

  export interface BetterAuthOrganization {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    metadata?: Record<string, unknown>;
    members?: BetterAuthOrgMember[];
    invitations?: any[];
  }

  export interface UseSessionReturn {
    data: BetterAuthSession | null;
    isPending: boolean;
    error: any;
    refetch: () => void;
  }

  export interface UseActiveOrganizationReturn {
    data: BetterAuthOrganization | null;
    isPending?: boolean;
    error?: any;
  }

  export interface BetterAuthStoreConfig extends Partial<AuthConfig> {}

  export interface SocialLoginCredentials {
    provider: string;
    callbackURL?: string;
    errorCallbackURL?: string;
    newUserCallbackURL?: string;
  }

  export interface EmailLoginCredentials {
    email: string;
    password: string;
  }

  export interface UsernameLoginCredentials {
    username: string;
    password: string;
  }

  export class BetterAuthStore extends AuthStore {
    constructor(authClient: any, config?: BetterAuthStoreConfig);

    // Overridden methods
    login(credentials: SocialLoginCredentials | EmailLoginCredentials | UsernameLoginCredentials, options?: Record<string, any>): Promise<{ success: boolean; user?: User; error?: string }>;
    logout(options?: Record<string, any>): Promise<{ success: boolean; error?: string }>;
    refreshToken(options?: Record<string, any>): Promise<boolean>;
    getToken(): string | null;
    getTokenRoles(): string[];
    getTokenPermissions(): string[];

    // Social / additional sign-in
    loginWithSocial(provider: string, options?: { callbackURL?: string; errorCallbackURL?: string; newUserCallbackURL?: string }): Promise<{ success: boolean; error?: string }>;
    loginWithMagicLink(email: string, options?: { callbackURL?: string; errorCallbackURL?: string; newUserCallbackURL?: string }): Promise<{ success: boolean; error?: string }>;

    // Registration & password
    register(credentials: { email: string; password: string; name?: string; [key: string]: any }, options?: Record<string, any>): Promise<{ success: boolean; error?: string }>;
    requestPasswordReset(email: string, options?: { redirectTo?: string }): Promise<{ success: boolean; error?: string }>;
    resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }>;

    // Organisation (no-op if org plugin not configured)
    getActiveOrganization(): BetterAuthOrganization | null;
    switchOrganization(orgIdOrSlug: string): Promise<{ success: boolean; error?: string }>;
    createOrganization(data: { name: string; slug: string; logo?: string; metadata?: Record<string, unknown> }): Promise<{ success: boolean; organization?: BetterAuthOrganization; error?: string }>;
    inviteMember(data: { organizationId: string; email: string; role: string }): Promise<{ success: boolean; error?: string }>;
    getFullOrganization(orgId: string): Promise<{ success: boolean; organization?: BetterAuthOrganization; error?: string }>;

    // Org-aware permission checks
    hasOrgRole(role: string): boolean;
    hasGlobalRole(role: string): boolean;

    // Internal bridge — not for direct consumer use
    syncFromSession(sessionData: BetterAuthSession | null, isPending: boolean, activeOrgMember?: BetterAuthOrgMember | null): void;
  }

  export function createBetterAuthStore(authClient: any, config?: BetterAuthStoreConfig): BetterAuthStore;

  export interface BetterAuthSyncProps {
    store: BetterAuthStore;
    useSession: () => UseSessionReturn;
    useActiveOrganization?: () => UseActiveOrganizationReturn;
  }

  export function BetterAuthSync(props: BetterAuthSyncProps): null;

  export function mapBetterAuthUser(
    sessionData: BetterAuthSession,
    permissionHierarchy: Record<string, string[]>,
    activeOrgMember?: BetterAuthOrgMember | null
  ): User;
}
```

---

### Task 8 — Documentation: `BETTER-AUTH-ADAPTER.md`
**File:** `docs/BETTER-AUTH-ADAPTER.md`

Match the style of `docs/AUTHENTICATION.md` (h1, blockquote subtitle, ToC, numbered sections with copy-pasteable code examples).

**Sections:**

1. **Overview** — what it is, when to use it, what it does NOT replace
2. **Installation** — server setup (betterAuth config), client setup (createAuthClient), adapter import
3. **Quick Start (Single-Tenant)** — full minimal app with email + Google login, no org plugin
4. **Available Sign-In Methods**
   - Email/password via `useAuth().login({ email, password })`
   - Social/OAuth via `useAuth().login({ provider: 'google', callbackURL: '/dashboard' })` or `loginWithSocial()`
   - Magic link via `loginWithMagicLink()`
   - Username via `login({ username, password })`
   - Social provider server config table (google, github, discord, etc.)
5. **Registration & Password Reset**
   - `register({ email, password, name })`
   - `requestPasswordReset(email)` + `resetPassword(token, newPassword)`
   - Server-side `sendResetPassword` hook requirement noted
6. **`createBetterAuthStore` API** — constructor, config options
7. **`BetterAuthSync` Component** — purpose, props, placement in component tree
8. **Role & Permission Mapping**
   - Better Auth global `role` string → `roles` array
   - `permissionHierarchy` config (same as base library)
   - How `hasRole()`, `hasPermission()`, `ProtectedComponent`, and `RouteGuard` all continue to work unchanged
9. **Multi-Tenancy (Organisation Plugin)**
   - Prerequisites (org plugin on server + `organizationClient()` on client)
   - Passing `useActiveOrganization` to `BetterAuthSync`
   - Org-level vs global roles — how they are merged
   - `hasOrgRole()` vs `hasGlobalRole()` vs `hasRole()`
   - Org management: `switchOrganization()`, `createOrganization()`, `inviteMember()`, `getFullOrganization()`
   - Full multi-tenant quick start example
10. **`getToken()` Behaviour** — null by default; Bearer plugin path
11. **TypeScript** — import from `react-auth-router/adapters/better-auth`
12. **Limitations** — no client-side JWT; `BetterAuthSync` must be mounted; `updateProfile` needs `apiEndpoint`; passkey requires WebAuthn browser support

---

### Task 9 — Migration guide update
**File:** `docs/MIGRATION-GUIDE.md`

Prepend two new sections before the existing `## From v2.2.2 to v2.3.0` entry. Update the ToC.

**Section A:** `## Adding Better Auth to an Existing react-auth-router Project (v2.9.0+)`
- Before: `initializeAuth()` with a JWT backend
- After: Better Auth handles auth; react-auth-router handles all routing/guards
- 5-step migration:
  1. Keep existing Better Auth server setup unchanged
  2. Install `better-auth` if not already present
  3. Replace `initializeAuth(config)` with `createBetterAuthStore(authClient, config)`
  4. Add `<BetterAuthSync store={store} useSession={authClient.useSession} />` inside `<Router>`
  5. Replace any direct `useSession()` calls with `useAuth()` / `useAuthUser()` / `usePermissions()`
- **Action Required box:** "No changes needed to route config, RouteGuard, Navigation, ProtectedComponent, or any hooks."

**Section B:** `## New Project: Better Auth + react-auth-router from Scratch (v2.9.0+)`
- Condensed setup guide for greenfield projects

---

### Task 10 — Update `docs/README.md`
**File:** `docs/README.md`

Add to the "Security & Authentication" section:
```markdown
- **[BETTER-AUTH-ADAPTER.md](./BETTER-AUTH-ADAPTER.md)** - Better Auth adapter: social OAuth, magic link, multi-tenancy (v2.9.0+)
```

---

### Task 11 — CHANGELOG entry
**File:** `CHANGELOG.md`

Prepend v2.9.0 entry following existing Keep a Changelog format:

```markdown
## [2.9.0] - 2026-03-26

### Added
- Better Auth adapter at `react-auth-router/adapters/better-auth` — opt-in, zero impact on existing installs
- `BetterAuthStore` — extends `AuthStore`; delegates auth to Better Auth client SDK
- Social/OAuth sign-in: `login({ provider })` and `loginWithSocial()` (Google, GitHub, Discord, etc.)
- Magic link sign-in: `loginWithMagicLink()`
- Email sign-up: `register()`
- Password reset: `requestPasswordReset()` and `resetPassword()`
- Username sign-in: `login({ username, password })`
- Multi-tenancy: `switchOrganization()`, `createOrganization()`, `inviteMember()`, `getFullOrganization()`
- Org-aware permission checks: `hasOrgRole()` and `hasGlobalRole()`
- `BetterAuthSync` React component — bridges `useSession()` (and optional `useActiveOrganization()`) into the subscriber pattern
- `mapBetterAuthUser` utility — normalises Better Auth session to react-auth-router `User` shape
- TypeScript definitions at `types/adapters/better-auth.d.ts`
- `docs/BETTER-AUTH-ADAPTER.md` — full adapter documentation
- Migration guide sections in `docs/MIGRATION-GUIDE.md`

### Changed
- `rollup.config.js` — second Rollup entry for the adapter bundle
- `package.json` — `exports` map + optional `better-auth` peer dependency
```

Add compare link at the bottom of CHANGELOG.md:
```
[2.9.0]: https://github.com/Fraser123456/react-auth-router/compare/v2.8.0...v2.9.0
```

---

## Task Execution Order

```
Task 1  (rollup.config.js)         — no dependencies, start here
Task 2  (package.json)             — after Task 1

Task 3  (mapBetterAuthUser.js)     — no dependencies, start here in parallel with Task 1
Task 4  (BetterAuthStore.js)       — after Task 3
Task 5  (BetterAuthSync.jsx)       — after Task 4
Task 6  (adapter index.js)         — after Tasks 3, 4, 5

Task 7  (TypeScript types)         — after Task 6
Task 8  (BETTER-AUTH-ADAPTER.md)   — after Task 6
Task 9  (MIGRATION-GUIDE.md)       — after Task 8
Task 10 (docs/README.md)           — after Task 8
Task 11 (CHANGELOG.md)             — after all prior tasks
```

Tasks 1+3 can start in parallel. Tasks 7, 8 can run in parallel once Task 6 is done. Tasks 9, 10 can run in parallel once Task 8 is done.

---

## Backward Compatibility Guarantee

- `src/index.js` — not touched
- No existing exports changed or removed
- The `"exports"` map `.` entry is identical to the current `main`/`module` fields
- Adapter activated only by explicitly importing from `react-auth-router/adapters/better-auth` and mounting `<BetterAuthSync>`
- `useActiveOrganization` prop on `BetterAuthSync` is optional — single-tenant apps pass nothing and org code is never reached

---

## Files Changed

| File | Action |
|---|---|
| `src/adapters/better-auth/mapBetterAuthUser.js` | Create |
| `src/adapters/better-auth/BetterAuthStore.js` | Create |
| `src/adapters/better-auth/BetterAuthSync.jsx` | Create |
| `src/adapters/better-auth/index.js` | Create |
| `types/adapters/better-auth.d.ts` | Create |
| `docs/BETTER-AUTH-ADAPTER.md` | Create |
| `rollup.config.js` | Modify — add second entry |
| `package.json` | Modify — exports map + optional peer dep |
| `docs/MIGRATION-GUIDE.md` | Modify — prepend two new sections + update ToC |
| `docs/README.md` | Modify — add link in Security & Authentication |
| `CHANGELOG.md` | Modify — prepend v2.9.0 entry |

---

## Verification

1. `npm run build` — both bundles compile without errors
2. `dist/adapters/better-auth/index.js` and `index.esm.js` exist
3. `dist/index.js` is unchanged (existing users unaffected)
4. `types/adapters/better-auth.d.ts` resolves from the exports map
5. Manual test — `BetterAuthSync` with a mock `useSession` (returning `{ data: mockSession, isPending: false }`) triggers `useAuth()` returning the correct user, roles, and permissions
6. Manual test — `BetterAuthSync` with a mock `useActiveOrganization` returning an org with members triggers `hasOrgRole()` correctly
7. Manual test — passing no `useActiveOrganization` prop leaves org state as null and all org methods return `{ success: false }` gracefully
