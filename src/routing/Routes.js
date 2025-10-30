import { useEffect, useMemo } from "react";
import { useRouter } from "./Router";
import { RouteGuard } from "./RouteGuard";
import { routeUtils } from "../utils";

export const Routes = ({
  routeConfig,
  pageComponents = {},
  notFoundComponent: NotFoundComponent,
  loadingComponent: LoadingComponent,
}) => {
  const { currentPath, updateParams } = useRouter();

  if (!routeConfig) {
    throw new Error("Routes component requires routeConfig prop");
  }

  const allRoutes = routeUtils.getAllRoutes(routeConfig);
  const currentRoute = routeUtils.findMatchingRoute(currentPath, allRoutes);

  // Extract params from the current URL based on the matched route
  const params = useMemo(() => {
    if (!currentRoute) return {};
    const extracted = routeUtils.extractParams(currentPath, currentRoute.path);
    console.log("[Routes] Extracting params:", {
      currentPath,
      routePath: currentRoute.path,
      extracted
    });
    return extracted;
  }, [currentPath, currentRoute]);

  // Update Router context with extracted params so useParams() works
  useEffect(() => {
    console.log("[Routes] Updating context params:", params);
    updateParams(params);
  }, [params, updateParams]);

  useEffect(() => {
    if (currentRoute?.meta?.title) {
      document.title = currentRoute.meta.title;
    }
  }, [currentRoute]);

  if (!currentRoute) {
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
