export const createRouteConfig = (routes) => {
  const processRoute = (route, parent = null) => {
    const processedRoute = {
      ...route,
      parent,
      fullPath: parent ? `${parent.fullPath}${route.path}` : route.path,
    };

    if (route.children) {
      processedRoute.children = route.children.map((child) =>
        processRoute(child, processedRoute)
      );
    }

    return processedRoute;
  };

  return {
    public: routes.public?.map((route) => processRoute(route)) || [],
    protected: routes.protected?.map((route) => processRoute(route)) || [],
  };
};

export const routeUtils = {
  getAllRoutes: (routeConfig) => {
    const routes = [
      ...(routeConfig.public || []),
      ...(routeConfig.protected || []),
    ];
    const allRoutes = [];

    const addRoutes = (routeList) => {
      routeList.forEach((route) => {
        allRoutes.push(route);
        if (route.children) {
          addRoutes(route.children);
        }
      });
    };

    addRoutes(routes);
    return allRoutes;
  },

  findMatchingRoute: (path, routes) => {
    const findRoute = (path, routes) => {
      for (let route of routes) {
        let matched = false;

        if (route.exact) {
          const routeRegex = new RegExp(
            "^" + route.path.replace(/:\w+/g, "[^/]+") + "$"
          );
          matched = routeRegex.test(path);
        } else {
          matched = path.startsWith(route.path);
        }

        if (matched) {
          // If route has children, check them first
          if (route.children && route.children.length > 0) {
            const childMatch = findRoute(path, route.children);
            if (childMatch) {
              return childMatch;
            }
          }
          // Return this route if no child matched
          return route;
        }
      }
      return null;
    };

    return findRoute(path, routes);
  },

  extractParams: (path, routePath) => {
    console.log("[extractParams] Input:", { path, routePath });

    if (!routePath || !routePath.includes(":")) {
      console.log("[extractParams] No params in route");
      return {};
    }

    const routeRegex = new RegExp(
      "^" + routePath.replace(/:\w+/g, "([^/]+)") + "$"
    );
    console.log("[extractParams] Regex:", routeRegex);

    const matches = path.match(routeRegex);
    console.log("[extractParams] Matches:", matches);

    if (!matches) {
      console.log("[extractParams] No regex match");
      return {};
    }

    const paramNames =
      routePath.match(/:(\w+)/g)?.map((p) => p.substring(1)) || [];
    console.log("[extractParams] Param names:", paramNames);

    const params = {};
    paramNames.forEach((name, index) => {
      if (matches[index + 1]) {
        params[name] = matches[index + 1];
      }
    });

    console.log("[extractParams] Final params:", params);
    return params;
  },

  generateBreadcrumbs: (route, routes) => {
    const breadcrumbs = [];
    let currentRoute = route;

    while (currentRoute) {
      breadcrumbs.unshift({
        title: currentRoute.title,
        path: currentRoute.path,
        route: currentRoute,
      });

      if (currentRoute.parent && typeof currentRoute.parent === "string") {
        currentRoute = routes.find((r) => r.path === currentRoute.parent);
      } else {
        currentRoute = currentRoute.parent;
      }
    }

    return breadcrumbs;
  },

  /**
   * Check if a user can access a specific route based on authentication and permissions
   * @param {Object} route - The route to check
   * @param {Object} context - Object containing isAuthenticated, hasRole, hasPermission, hasAnyRole, hasAnyPermission, hasAllRoles, hasAllPermissions
   * @returns {boolean} - True if user can access the route
   */
  canAccessRoute: (route, context) => {
    const {
      isAuthenticated,
      hasRole,
      hasPermission,
      hasAnyRole,
      hasAnyPermission,
      hasAllRoles,
      hasAllPermissions,
      user,
    } = context;

    // Check guest-only requirement (route only accessible to unauthenticated users)
    if (route.requireGuest && isAuthenticated) {
      return false;
    }

    // Check authentication requirement
    if (route.requireAuth && !isAuthenticated) {
      return false;
    }

    // Check role requirements
    if (route.requiredRoles && route.requiredRoles.length > 0) {
      const hasRequiredRole = route.requireAll
        ? hasAllRoles(route.requiredRoles)
        : hasAnyRole(route.requiredRoles);
      if (!hasRequiredRole) {
        return false;
      }
    }

    // Check permission requirements
    if (route.requiredPermissions && route.requiredPermissions.length > 0) {
      const hasRequiredPermission = route.requireAll
        ? hasAllPermissions(route.requiredPermissions)
        : hasAnyPermission(route.requiredPermissions);
      if (!hasRequiredPermission) {
        return false;
      }
    }

    // Check custom guard
    if (route.customGuard && typeof route.customGuard === "function") {
      const guardResult = route.customGuard({
        hasRole,
        hasPermission,
        isAuthenticated,
        hasAnyRole,
        hasAnyPermission,
        user,
      });
      if (!guardResult) {
        return false;
      }
    }

    return true;
  },

  /**
   * Filter routes to only include those the user can access
   * @param {Array} routes - Array of routes to filter
   * @param {Object} context - Object containing isAuthenticated, hasRole, hasPermission, etc.
   * @returns {Array} - Filtered array of accessible routes
   */
  filterAccessibleRoutes: (routes, context) => {
    return routes.filter((route) => {
      // Always include public routes (no auth requirements)
      if (!route.requireAuth &&
          (!route.requiredRoles || route.requiredRoles.length === 0) &&
          (!route.requiredPermissions || route.requiredPermissions.length === 0) &&
          !route.customGuard) {
        return true;
      }

      // For protected routes, check access
      return routeUtils.canAccessRoute(route, context);
    });
  },
};
