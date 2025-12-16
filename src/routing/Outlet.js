import React, { useMemo } from "react";
import { useRouteContext } from "./RouteContext";
import { RouteGuard } from "./RouteGuard";
import { routeUtils } from "../utils";

/**
 * Outlet component for rendering nested child routes within a parent layout route
 *
 * Similar to React Router's Outlet component, this allows parent components to
 * specify where their child routes should be rendered.
 *
 * @example
 * ```jsx
 * const SettingsLayout = () => {
 *   return (
 *     <div>
 *       <h1>Settings</h1>
 *       <nav>
 *         <Link to="/settings/profile">Profile</Link>
 *         <Link to="/settings/security">Security</Link>
 *       </nav>
 *       <Outlet /> // Child routes render here
 *     </div>
 *   );
 * };
 * ```
 *
 * @param {Object} props
 * @param {React.ComponentType} props.fallback - Component to render when no child route matches
 * @returns {React.ReactElement|null} The matched child route component or fallback
 */
export const Outlet = ({ fallback = null }) => {
  const { childRoutes, currentPath, params: parentParams, query } = useRouteContext();

  // Find which child route matches the current path
  const matchedChild = useMemo(() => {
    if (!childRoutes || childRoutes.length === 0) {
      return null;
    }

    return routeUtils.findMatchingRoute(currentPath, childRoutes);
  }, [childRoutes, currentPath]);

  // If no child route matches, render fallback
  if (!matchedChild) {
    if (fallback) {
      return React.isValidElement(fallback) ? fallback : React.createElement(fallback);
    }
    return null;
  }

  // Extract params from the matched child route
  const childParams = useMemo(() => {
    const extracted = routeUtils.extractParams(currentPath, matchedChild.path);
    // Merge parent params with child params (child params take precedence)
    return { ...parentParams, ...extracted };
  }, [currentPath, matchedChild, parentParams]);

  // Render the child component
  const ChildComponent = matchedChild.component;

  if (!ChildComponent) {
    console.error(`[Outlet] No component found for route: ${matchedChild.path}`);
    if (fallback) {
      return React.isValidElement(fallback) ? fallback : React.createElement(fallback);
    }
    return null;
  }

  return (
    <RouteGuard route={matchedChild}>
      <ChildComponent params={childParams} route={matchedChild} query={query} />
    </RouteGuard>
  );
};

/**
 * OutletWithFallback is a convenience component that shows a message when no child routes match
 *
 * @example
 * ```jsx
 * <OutletWithFallback message="Please select an option from the menu" />
 * ```
 *
 * @param {Object} props
 * @param {string} props.message - Message to display when no child route matches
 * @param {React.ComponentType} props.fallback - Custom fallback component
 * @returns {React.ReactElement} Outlet with default fallback
 */
export const OutletWithFallback = ({ message = "Please select an option", fallback }) => {
  const defaultFallback = () => (
    <div style={{
      padding: "2rem",
      textAlign: "center",
      color: "#6b7280",
      fontSize: "0.875rem"
    }}>
      {message}
    </div>
  );

  return <Outlet fallback={fallback || defaultFallback} />;
};
