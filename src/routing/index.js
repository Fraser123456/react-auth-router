import { useRouter as useRouterHook } from "./Router";

export { Router, useRouter, useNavigate, useGoBack, useGoForward, useHistory } from "./Router";
export { RouteGuard } from "./RouteGuard";
export { Routes } from "./Routes";
export { Link } from "./Link";
export { Outlet, OutletWithFallback } from "./Outlet";
export { RouteProvider, useRouteContext, useHasChildRoutes } from "./RouteContext";

// Individual hooks for better performance
export const useParams = () => {
  const { params } = useRouterHook();
  return params;
};

export const useQuery = () => {
  const { query } = useRouterHook();
  return query;
};

export const useHash = () => {
  const { hash } = useRouterHook();
  return hash;
};

export const useHashParams = () => {
  const { hashParams } = useRouterHook();
  return hashParams;
};
