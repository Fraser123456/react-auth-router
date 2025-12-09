import { useEffect, useMemo } from "react";
import { useRouter, useNavigate } from "./Router";
import { RouteGuard } from "./RouteGuard";
import { RouteProvider } from "./RouteContext";
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
  const { currentPath, updateParams, query } = useRouter();
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

  // Handle index route redirects
  // If we match a route exactly and it has an index child, redirect to the index
  useEffect(() => {
    if (!currentRoute || loading) return;

    // Check if this route has children and we're on the exact parent path
    if (currentRoute.children && currentRoute.children.length > 0) {
      const isExactParentPath = currentPath === currentRoute.path;

      if (isExactParentPath) {
        // Find index child
        const indexChild = currentRoute.children.find(child => child.index === true);

        if (indexChild) {
          // Redirect to index child
          navigate(indexChild.path, { replace: true });
        }
      }
    }
  }, [currentRoute, currentPath, loading, navigate]);

  // Determine if we should render as a layout route
  // A layout route renders the parent component with an Outlet for children
  const shouldRenderAsLayout = useMemo(() => {
    if (!currentRoute) return false;

    // Must be marked as a layout route
    if (!currentRoute.layout) return false;

    // Must have children
    if (!currentRoute.children || currentRoute.children.length === 0) return false;

    // Current path must not be an exact match to parent path (unless there's no index route)
    const isExactParentPath = currentPath === currentRoute.path;
    const hasIndexChild = currentRoute.children.some(child => child.index === true);

    // If we're on parent path and there's an index child, don't render as layout
    // (let the redirect happen)
    if (isExactParentPath && hasIndexChild) return false;

    // Check if any child matches the current path
    const hasMatchingChild = routeUtils.findMatchingRoute(currentPath, currentRoute.children);

    return !!hasMatchingChild;
  }, [currentRoute, currentPath]);

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

  // Render as layout route (parent component with Outlet for children)
  if (shouldRenderAsLayout) {
    const LayoutComponent = typeof currentRoute.component === "string"
      ? pageComponents[currentRoute.component]
      : currentRoute.component;

    if (!LayoutComponent) {
      console.error(`[Routes] Layout component not found for route: ${currentRoute.path}`);
      return NotFoundComponent ? <NotFoundComponent /> : <DefaultNotFound />;
    }

    return (
      <RouteGuard route={currentRoute}>
        <RouteProvider
          route={currentRoute}
          params={params}
          query={query}
          childRoutes={currentRoute.children}
          currentPath={currentPath}
        >
          <LayoutComponent params={params} route={currentRoute} query={query} />
        </RouteProvider>
      </RouteGuard>
    );
  }

  // Standard rendering (non-layout routes) - current behavior
  if (typeof currentRoute.component === "string") {
    const PageComponent = pageComponents[currentRoute.component];
    if (!PageComponent) {
      return NotFoundComponent ? <NotFoundComponent /> : <DefaultNotFound />;
    }

    return (
      <RouteGuard route={currentRoute}>
        <PageComponent params={params} route={currentRoute} query={query} />
      </RouteGuard>
    );
  }

  const PageComponent = currentRoute.component;
  return (
    <RouteGuard route={currentRoute}>
      <PageComponent params={params} route={currentRoute} query={query} />
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
