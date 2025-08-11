export { Router, useRouter, useNavigate } from "./Router";
export { RouteGuard } from "./RouteGuard";
export { Routes } from "./Routes";

// Individual hooks for better performance
export const useParams = () => {
  const { params } = useRouter();
  return params;
};

export const useQuery = () => {
  const { query } = useRouter();
  return query;
};
