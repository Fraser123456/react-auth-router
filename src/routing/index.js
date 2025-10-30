import { useRouter as useRouterHook } from "./Router";

export { Router, useRouter, useNavigate } from "./Router";
export { RouteGuard } from "./RouteGuard";
export { Routes } from "./Routes";

// Individual hooks for better performance
export const useParams = () => {
  const { params } = useRouterHook();
  return params;
};

export const useQuery = () => {
  const { query } = useRouterHook();
  return query;
};
