import { createContext, useContext } from "react";

/**
 * Context for sharing route information between parent and child routes
 * Used by the Outlet component to render nested routes
 */
const RouteContext = createContext(null);

/**
 * Provider component that wraps route components to share route data
 * @param {Object} props
 * @param {Object} props.route - The current route object
 * @param {Object} props.params - URL parameters for the route
 * @param {Object} props.query - Query string parameters
 * @param {Array} props.childRoutes - Available child routes
 * @param {string} props.currentPath - Current browser path
 * @param {React.ReactNode} props.children - Child components to render
 */
export const RouteProvider = ({
  route,
  params,
  query,
  childRoutes,
  currentPath,
  children
}) => {
  return (
    <RouteContext.Provider
      value={{
        route,
        params,
        query,
        childRoutes,
        currentPath
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

/**
 * Hook to access route context information
 * Used by Outlet component and custom route components that need route data
 * @returns {Object} Route context with route, params, query, childRoutes, currentPath
 * @throws {Error} If used outside of RouteProvider
 */
export const useRouteContext = () => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error("useRouteContext must be used within a RouteProvider");
  }
  return context;
};

/**
 * Hook to check if there are child routes available
 * Useful for conditional rendering based on nested routes
 * @returns {boolean} True if child routes exist
 */
export const useHasChildRoutes = () => {
  const context = useContext(RouteContext);
  if (!context) {
    return false;
  }
  return context.childRoutes && context.childRoutes.length > 0;
};
