import React, { useEffect } from "react";
import { usePermissions, useAuth } from "../auth/hooks";
import { useNavigate } from "./Router";
import { Shield, Lock } from "lucide-react";

export const RouteGuard = ({
  route,
  children,
  fallback = null,
  unauthorizedComponent: UnauthorizedComponent,
  forbiddenComponent: ForbiddenComponent,
}) => {
  const {
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission,
    hasAllRoles,
    hasAllPermissions,
  } = usePermissions();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users away from guest-only routes
  useEffect(() => {
    if (route.requireGuest && isAuthenticated) {
      const redirectPath = route.authenticatedRedirect || "/";
      navigate(redirectPath, { replace: true });
    }
  }, [route.requireGuest, route.authenticatedRedirect, isAuthenticated, navigate]);

  // If this is a guest-only route and user is authenticated, show loading while redirecting
  if (route.requireGuest && isAuthenticated) {
    return fallback || <DefaultRedirecting />;
  }

  if (route.requireAuth && !isAuthenticated) {
    if (UnauthorizedComponent) {
      return <UnauthorizedComponent route={route} />;
    }
    return fallback || <DefaultUnauthorized route={route} />;
  }

  if (route.requiredRoles && route.requiredRoles.length > 0) {
    const hasRequiredRole = route.requireAll
      ? hasAllRoles(route.requiredRoles)
      : hasAnyRole(route.requiredRoles);

    if (!hasRequiredRole) {
      if (ForbiddenComponent) {
        return (
          <ForbiddenComponent
            route={route}
            message="Insufficient role permissions"
          />
        );
      }
      return (
        fallback || (
          <DefaultForbidden
            route={route}
            message="Insufficient role permissions"
          />
        )
      );
    }
  }

  if (route.requiredPermissions && route.requiredPermissions.length > 0) {
    const hasRequiredPermission = route.requireAll
      ? hasAllPermissions(route.requiredPermissions)
      : hasAnyPermission(route.requiredPermissions);

    if (!hasRequiredPermission) {
      if (ForbiddenComponent) {
        return (
          <ForbiddenComponent
            route={route}
            message="Insufficient permissions"
          />
        );
      }
      return (
        fallback || (
          <DefaultForbidden route={route} message="Insufficient permissions" />
        )
      );
    }
  }

  if (route.customGuard && typeof route.customGuard === "function") {
    const guardResult = route.customGuard({
      hasRole,
      hasPermission,
      isAuthenticated,
      hasAnyRole,
      hasAnyPermission,
    });
    if (!guardResult) {
      if (ForbiddenComponent) {
        return (
          <ForbiddenComponent
            route={route}
            message="Custom access check failed"
          />
        );
      }
      return (
        fallback || (
          <DefaultForbidden
            route={route}
            message="Custom access check failed"
          />
        )
      );
    }
  }

  return children;
};

const DefaultUnauthorized = ({ route }) => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f9fafb",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <Lock
        style={{
          height: "4rem",
          width: "4rem",
          color: "#9ca3af",
          margin: "0 auto 1rem",
        }}
      />
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "#111827",
          marginBottom: "0.5rem",
          margin: "0 0 0.5rem 0",
        }}
      >
        Authentication Required
      </h1>
      <p style={{ color: "#6b7280", margin: 0 }}>
        Please log in to access this page.
      </p>
    </div>
  </div>
);

const DefaultForbidden = ({ route, message }) => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f9fafb",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <Shield
        style={{
          height: "4rem",
          width: "4rem",
          color: "#ef4444",
          margin: "0 auto 1rem",
        }}
      />
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "#111827",
          marginBottom: "0.5rem",
          margin: "0 0 0.5rem 0",
        }}
      >
        Access Denied
      </h1>
      <p style={{ color: "#6b7280", margin: 0 }}>
        {message || "You do not have permission to access this page."}
      </p>
    </div>
  </div>
);

const DefaultRedirecting = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f9fafb",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "3rem",
          height: "3rem",
          border: "4px solid #e5e7eb",
          borderTopColor: "#2563eb",
          borderRadius: "50%",
          margin: "0 auto 1rem",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ color: "#6b7280", margin: 0 }}>Redirecting...</p>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  </div>
);
