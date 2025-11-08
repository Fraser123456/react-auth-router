import React, { useEffect, useState } from "react";
import { useRouter, useNavigate } from "../routing";
import { RouteGuard } from "../routing/RouteGuard";
import { routeUtils } from "../utils";
import { useAuth, usePermissions } from "../auth";
import { Home } from "lucide-react";

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
  const { currentPath, params } = useRouter();
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
      console.log('[Routes] Redirecting from', currentPath, 'to', redirectTo);
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
      console.error(
        `Component "${currentRoute.component}" not found in pageComponents`
      );
      return <DefaultNotFound />;
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

export const Breadcrumb = ({
  routeConfig,
  className = "",
  customBreadcrumbComponent: CustomBreadcrumbComponent,
  showHome = true,
  homeTitle = "Home",
  homePath = "/"
}) => {
  const { currentPath, navigate } = useRouter();

  if (!routeConfig) return null;

  const allRoutes = routeUtils.getAllRoutes(routeConfig);
  const currentRoute = routeUtils.findMatchingRoute(currentPath, allRoutes);

  if (!currentRoute) return null;

  // Use the existing generateBreadcrumbs utility
  const breadcrumbs = routeUtils.generateBreadcrumbs(currentRoute, allRoutes);

  // Add home breadcrumb if needed
  if (showHome && breadcrumbs.length > 0 && breadcrumbs[0].path !== homePath) {
    breadcrumbs.unshift({ title: homeTitle, path: homePath, route: null });
  }

  if (breadcrumbs.length === 0) return null;

  // If custom component provided, use it
  if (CustomBreadcrumbComponent) {
    return <CustomBreadcrumbComponent breadcrumbs={breadcrumbs} navigate={navigate} />;
  }

  return (
    <nav
      className={`breadcrumb ${className}`}
      style={{ display: "flex", marginBottom: "1rem" }}
      aria-label="Breadcrumb"
    >
      <ol
        style={{
          display: "inline-flex",
          alignItems: "center",
          margin: 0,
          padding: 0,
          listStyle: "none",
          gap: "0.25rem",
        }}
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isHome = index === 0 && breadcrumb.path === homePath;

          return (
            <li
              key={breadcrumb.path || index}
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              {index > 0 && (
                <svg
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    color: "#9ca3af",
                    marginRight: "0.25rem",
                  }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}

              {isLast ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#6b7280",
                  }}
                >
                  {isHome && (
                    <Home
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginRight: "0.5rem",
                      }}
                    />
                  )}
                  {breadcrumb.title}
                </span>
              ) : (
                <button
                  onClick={() => navigate(breadcrumb.path)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                  onMouseOver={(e) => (e.target.style.color = "#2563eb")}
                  onMouseOut={(e) => (e.target.style.color = "#374151")}
                >
                  {isHome && (
                    <Home
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginRight: "0.5rem",
                      }}
                    />
                  )}
                  {breadcrumb.title}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export const ProtectedComponent = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = true,
  fallback = null,
}) => {
  const { hasRole, hasPermission, hasAnyRole, hasAnyPermission, hasAllRoles, hasAllPermissions } = usePermissions();

  const hasAccess = () => {
    // Check roles
    if (requiredRoles.length > 0) {
      const roleCheck = requireAll
        ? hasAllRoles(requiredRoles)
        : hasAnyRole(requiredRoles);
      if (!roleCheck) return false;
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      const permissionCheck = requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
      if (!permissionCheck) return false;
    }

    return true;
  };

  if (!hasAccess()) {
    if (fallback) {
      return React.isValidElement(fallback) ? fallback : <fallback />;
    }
    
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.375rem',
        color: '#b91c1c'
      }}>
        Access denied. You don't have the required permissions to view this content.
      </div>
    );
  }

  return children;
};

export const Navigation = ({
  routeConfig,
  className = "",
  mobileBreakpoint = 768,
  showIcons = true,
  brandComponent,
  customLogoutComponent,
  style = {},
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { hasRole, hasPermission } = usePermissions();
  const { currentPath } = useRouter();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isRouteVisible = (route) => {
    if (!route.showInNav) return false;
    
    if (route.requireAuth && !isAuthenticated) return false;
    
    if (route.requiredRoles && route.requiredRoles.length > 0) {
      const hasRequiredRole = route.requireAll 
        ? route.requiredRoles.every(role => hasRole(role))
        : route.requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRole) return false;
    }
    
    if (route.requiredPermissions && route.requiredPermissions.length > 0) {
      const hasRequiredPermission = route.requireAll
        ? route.requiredPermissions.every(perm => hasPermission(perm))
        : route.requiredPermissions.some(perm => hasPermission(perm));
      if (!hasRequiredPermission) return false;
    }
    
    if (route.customGuard) {
      return route.customGuard({ isAuthenticated, hasRole, hasPermission, user });
    }
    
    return true;
  };

  const getVisibleRoutes = () => {
    if (!routeConfig) return [];
    
    const allRoutes = routeUtils.getAllRoutes(routeConfig);
    return allRoutes.filter(isRouteVisible);
  };

  const isActiveRoute = (route) => {
    return currentPath === route.path || 
           (route.children && route.children.some(child => currentPath.startsWith(child.path)));
  };

  const handleNavClick = (route) => {
    navigate(route.path);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const renderNavItem = (route) => (
    <li key={route.path} style={{ margin: 0 }}>
      <button
        onClick={() => handleNavClick(route)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          color: isActiveRoute(route) ? '#2563eb' : '#6b7280',
          backgroundColor: isActiveRoute(route) ? '#eff6ff' : 'transparent',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
          if (!isActiveRoute(route)) {
            e.target.style.color = '#374151';
            e.target.style.backgroundColor = '#f9fafb';
          }
        }}
        onMouseOut={(e) => {
          if (!isActiveRoute(route)) {
            e.target.style.color = '#6b7280';
            e.target.style.backgroundColor = 'transparent';
          }
        }}
      >
        {showIcons && route.icon && (
          <span>
            {React.isValidElement(route.icon) ? route.icon : <route.icon />}
          </span>
        )}
        {route.title}
      </button>
    </li>
  );

  const renderBrand = () => {
    if (brandComponent) {
      return brandComponent;
    }
    
    return (
      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
          }}
        >
          MyApp
        </button>
      </div>
    );
  };

  const renderUserMenu = () => {
    if (!isAuthenticated) return null;
    
    if (customLogoutComponent) {
      return customLogoutComponent({ user, onLogout: handleLogout });
    }
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Welcome, {user?.name || 'User'}
        </span>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
        >
          Logout
        </button>
      </div>
    );
  };

  const visibleRoutes = getVisibleRoutes();

  return (
    <nav
      className={`react-auth-nav ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'relative',
        ...style,
      }}
    >
      {renderBrand()}
      
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: 'block',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
          aria-label="Toggle mobile menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}
      
      {visibleRoutes.length > 0 && (
        <ul
          style={{
            display: isMobile && !isMobileMenuOpen ? 'none' : 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            gap: isMobile ? '0.5rem' : '1rem',
            position: isMobile ? 'absolute' : 'static',
            top: isMobile ? '100%' : 'auto',
            left: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : 'auto',
            backgroundColor: isMobile ? '#ffffff' : 'transparent',
            borderTop: isMobile ? '1px solid #e5e7eb' : 'none',
            padding: isMobile ? '1rem' : 0,
            zIndex: 1000,
          }}
        >
          {visibleRoutes.map(renderNavItem)}
        </ul>
      )}
      
      {!isMobile && renderUserMenu()}
      
      {isMobile && isMobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          padding: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          {renderUserMenu()}
        </div>
      )}
    </nav>
  );
};
