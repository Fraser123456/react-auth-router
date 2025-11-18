import { useEffect, useMemo } from "react";
import { useRouter, useNavigate } from "./Router";
import { RouteGuard } from "./RouteGuard";
import { routeUtils } from "../utils";
import { useAuth, usePermissions } from "../auth";

export const Routes = ({
  routeConfig,
  pageComponents = {},
  notFoundComponent: NotFoundComponent,
  loadingComponent: LoadingComponent,
  hideUnauthorizedRoutes = true, // Secure by default - show 404 for unauthorized routes
  defaultRoute, // Default route for all users
  authenticatedDefaultRoute, // Default route for authenticated users (overrides defaultRoute)
  unauthenticatedDefaultRoute, // Default route for unauthenticated users (overrides defaultRoute)
}) => {
  const { currentPath, updateParams } = useRouter();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();
  const {
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission,
    hasAllRoles,
    hasAllPermissions,
  } = usePermissions();

  if (!routeConfig) {
    throw new Error("Routes component requires routeConfig prop");
  }

  // Check if we're on the root path and need to redirect
  const isRootPath = currentPath === "/" || currentPath === "" || !currentPath;
  const hasDefaultRoutes = !!(defaultRoute || authenticatedDefaultRoute || unauthenticatedDefaultRoute);

  // Handle default route redirects
  useEffect(() => {
    // Only redirect if we're on the root path, not loading, and have default routes configured
    if (!isRootPath || loading || !hasDefaultRoutes) return;

    let redirectTo = null;

    // Determine redirect target based on authentication state
    if (isAuthenticated && authenticatedDefaultRoute) {
      redirectTo = authenticatedDefaultRoute;
    } else if (!isAuthenticated && unauthenticatedDefaultRoute) {
      redirectTo = unauthenticatedDefaultRoute;
    } else if (defaultRoute) {
      redirectTo = defaultRoute;
    }

    // Perform redirect if needed (use replace to avoid adding to history)
    if (redirectTo && redirectTo !== currentPath) {
      navigate(redirectTo, { replace: true });
    }
  }, [
    currentPath,
    isRootPath,
    isAuthenticated,
    loading,
    defaultRoute,
    authenticatedDefaultRoute,
    unauthenticatedDefaultRoute,
    hasDefaultRoutes,
    navigate,
  ]);

  // Show loading state while auth is loading on root path
  if (isRootPath && hasDefaultRoutes && loading) {
    return LoadingComponent ? <LoadingComponent /> : <DefaultLoading />;
  }

  const allRoutes = routeUtils.getAllRoutes(routeConfig);

  // Security: Filter routes based on user permissions before matching
  // This prevents information disclosure by showing 404 for unauthorized routes
  const routesToSearch = hideUnauthorizedRoutes
    ? routeUtils.filterAccessibleRoutes(allRoutes, {
      isAuthenticated,
      hasRole,
      hasPermission,
      hasAnyRole,
      hasAnyPermission,
      hasAllRoles,
      hasAllPermissions,
      user,
    })
    : allRoutes;

  const currentRoute = routeUtils.findMatchingRoute(currentPath, routesToSearch);

  // Extract params from the current URL based on the matched route
  const params = useMemo(() => {
    if (!currentRoute) return {};
    const extracted = routeUtils.extractParams(currentPath, currentRoute.path);
    return extracted;
  }, [currentPath, currentRoute]);

  // Update Router context with extracted params so useParams() works
  useEffect(() => {
    updateParams(params);
  }, [params, updateParams]);

  useEffect(() => {
    if (currentRoute?.meta?.title) {
      document.title = currentRoute.meta.title;
    }
  }, [currentRoute]);

  // If no route found and we're on root path with default routes, show loading while redirect happens
  if (!currentRoute) {
    if (isRootPath && hasDefaultRoutes && !loading) {
      // Auth is loaded but redirect hasn't happened yet, show loading briefly
      return LoadingComponent ? <LoadingComponent /> : <DefaultLoading />;
    }
    return NotFoundComponent ? <NotFoundComponent /> : <DefaultNotFound />;
  }

  if (typeof currentRoute.component === "string") {
    const PageComponent = pageComponents[currentRoute.component];
    if (!PageComponent) {
      return NotFoundComponent ? <NotFoundComponent /> : <DefaultNotFound />;
    }

    return (
      <RouteGuard route={currentRoute}>
        <PageComponent params={params} route={currentRoute} />
      </RouteGuard>
    );
  }

  const PageComponent = currentRoute.component;
  return (
    <RouteGuard route={currentRoute}>
      <PageComponent params={params} route={currentRoute} />
    </RouteGuard>
  );
};

const DefaultNotFound = () => (
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
      <h1
        style={{
          fontSize: "6rem",
          fontWeight: "700",
          color: "#111827",
          margin: "0 0 1rem 0",
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: "1.25rem",
          color: "#6b7280",
          marginBottom: "1.5rem",
          margin: "0 0 1.5rem 0",
        }}
      >
        Page not found
      </p>
      <button
        onClick={() => window.history.back()}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: "0.375rem",
          border: "none",
          cursor: "pointer",
        }}
      >
        Go Back
      </button>
    </div>
  </div>
);

const DefaultLoading = () => (
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
      <p style={{ color: "#6b7280", margin: 0 }}>Loading...</p>
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
