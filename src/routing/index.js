export { Router, useRouter } from "./Router";
export { RouteGuard } from "./RouteGuard";
export { Routes } from "./Routes";

// Individual hooks for better performance
export const useNavigate = () => {
  const { navigate } = useRouter();
  return navigate;
};

export const useParams = () => {
  const { params } = useRouter();
  return params;
};

export const useQuery = () => {
  const { query } = useRouter();
  return query;
};
