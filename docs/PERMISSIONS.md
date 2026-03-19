# Permissions

> Role-based and permission-based access control with React Auth Router

## Table of Contents

- [JWT-Based Permission Checks](#jwt-based-permission-checks)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Permission-Based Access Control](#permission-based-access-control)
- [Component-Level Protection](#component-level-protection)
- [Permission Hierarchy](#permission-hierarchy)
- [Combining Roles and Permissions](#combining-roles-and-permissions)

## JWT-Based Permission Checks

As of v2.7.0, all permission and role checks (`hasRole`, `hasPermission`, etc.) read from the **decoded JWT access token** rather than from the user object in browser storage.

This prevents users from opening DevTools and modifying their roles/permissions in sessionStorage or localStorage to bypass UI-level access control.

**Default behaviour** — the library looks for `roles` and `permissions` (or `perms`) at the top level of the token payload:

```json
{
  "sub": "user-id",
  "roles": ["manager"],
  "permissions": ["read_users", "write_users", "read_settings"],
  "exp": 1234567890
}
```

If your token does not include these claims, the library falls back to the stored user object (backward compatible).

### Custom Claim Paths (v2.8.0+)

Third-party providers like Supabase often nest claims differently. Use `tokenClaims` to tell the library where to find roles and permissions in your token.

**Dot-notation path** — for nested claims:

```js
initializeAuth({
  tokenClaims: {
    roles:       'app_metadata.roles',
    permissions: 'app_metadata.permissions',
  },
});
```

**Function** — for any structure, including computed or combined claims:

```js
initializeAuth({
  tokenClaims: {
    roles:       (claims) => claims.app_metadata?.roles ?? [],
    permissions: (claims) => [
      ...(claims.app_metadata?.permissions ?? []),
      ...(claims.user_metadata?.extra_permissions ?? []),
    ],
  },
});
```

Both `roles` and `permissions` can mix path strings and functions independently. If a resolver is not provided for one of them, the library falls back to the default top-level claim lookup.

See [Security docs](./SECURITY.md#jwt-based-permission-validation-v270) for full details.

## Role-Based Access Control (RBAC)

```jsx
const AdminPanel = () => {
  const { hasRole } = usePermissions();

  if (!hasRole("admin")) {
    return <div>Access denied</div>;
  }

  return <div>Admin panel content</div>;
};
```

## Permission-Based Access Control

```jsx
const UserActions = () => {
  const { hasPermission, hasAnyPermission } = usePermissions();

  return (
    <div>
      {hasPermission("read_users") && <button>View Users</button>}

      {hasPermission("write_users") && <button>Create User</button>}

      {hasAnyPermission(["write_users", "delete_users"]) && (
        <button>Manage Users</button>
      )}
    </div>
  );
};
```

## Component-Level Protection

```jsx
import { ProtectedComponent } from "react-auth-router";

const App = () => (
  <div>
    <ProtectedComponent
      requiredPermissions={["admin_access"]}
      fallback={<div>You need admin access</div>}
    >
      <AdminSettings />
    </ProtectedComponent>

    <ProtectedComponent
      requiredRoles={["manager", "admin"]}
      requireAll={false} // OR logic
    >
      <ManagerTools />
    </ProtectedComponent>
  </div>
);
```

## Permission Hierarchy

```jsx
initializeAuth({
  permissionHierarchy: {
    super_admin: ["*"], // All permissions
    admin: [
      "read_users",
      "write_users",
      "delete_users",
      "read_settings",
      "write_settings",
      "admin_access",
    ],
    manager: ["read_users", "write_users", "read_settings"],
    user: ["read_users"],
    guest: [], // No permissions
  },
});
```

## Combining Roles and Permissions

### Route-Level Protection

```jsx
const routeConfig = createRouteConfig({
  protected: [
    {
      path: "/admin",
      component: "AdminPage",
      requiredRoles: ["admin"],
      requiredPermissions: ["admin_access"],
      requireAll: true, // User must have BOTH role AND permission
    },
    {
      path: "/dashboard",
      component: "DashboardPage",
      requiredRoles: ["user", "manager", "admin"],
      requireAll: false, // User needs ANY of these roles
    },
  ],
});
```

### Programmatic Checks

```jsx
const { hasAllRoles, hasAnyPermission, hasAllPermissions } = usePermissions();

// Check multiple roles (user must have ALL)
if (hasAllRoles(["admin", "moderator"])) {
  // User is both admin and moderator
}

// Check multiple permissions (user must have ANY)
if (hasAnyPermission(["read_posts", "write_posts"])) {
  // User can either read or write posts
}

// Check multiple permissions (user must have ALL)
if (hasAllPermissions(["read_users", "write_users", "delete_users"])) {
  // User has full user management permissions
}
```

### Custom Permission Logic

```jsx
const { user } = useAuth();
const { hasPermission, hasRole } = usePermissions();

const canDeletePost = (post) => {
  // Admins can delete any post
  if (hasRole("admin")) return true;

  // Users can delete their own posts if they have delete permission
  if (user.id === post.authorId && hasPermission("delete_own_posts")) {
    return true;
  }

  return false;
};
```

---

**[Back to Main README](../README.md)** | **[View Authentication Docs](./AUTHENTICATION.md)**
