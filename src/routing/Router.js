import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const RouterContext = createContext();

export const Router = ({ children, basePath = "", enableHistory = true }) => {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  const [params, setParams] = useState({});
  const [query, setQuery] = useState({});

  useEffect(() => {
    if (typeof window === "undefined" || !enableHistory) return;

    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      updateRouteState(path);
    };

    window.addEventListener("popstate", handlePopState);
    updateRouteState(currentPath);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentPath, enableHistory]);

  const updateRouteState = useCallback((path) => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const queryParams = {};
    for (let [key, value] of searchParams) {
      queryParams[key] = value;
    }
    setQuery(queryParams);
  }, []);

  const navigate = useCallback(
    (path, options = {}) => {
      const {
        replace = false,
        query: queryParams = {},
        state = null,
      } = options;

      const fullPath = basePath ? `${basePath}${path}` : path;

      const searchParams = new URLSearchParams(queryParams);
      const finalPath = searchParams.toString()
        ? `${fullPath}?${searchParams}`
        : fullPath;

      if (typeof window !== "undefined" && enableHistory) {
        if (replace) {
          window.history.replaceState(state, "", finalPath);
        } else {
          window.history.pushState(state, "", finalPath);
        }
      }

      setCurrentPath(fullPath);
      updateRouteState(fullPath);
    },
    [basePath, enableHistory, updateRouteState]
  );

  const updateParams = useCallback((newParams) => {
    setParams(newParams);
  }, []);

  const goBack = useCallback(() => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  }, []);

  const goForward = useCallback(() => {
    if (typeof window !== "undefined") {
      window.history.forward();
    }
  }, []);

  const go = useCallback((delta) => {
    if (typeof window !== "undefined") {
      window.history.go(delta);
    }
  }, []);

  return (
    <RouterContext.Provider
      value={{
        currentPath,
        params,
        query,
        navigate,
        goBack,
        goForward,
        go,
        basePath,
        updateParams,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a Router component");
  }
  return context;
};

export const useNavigate = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useNavigate must be used within a Router component");
  }
  return context.navigate;
};

export const useGoBack = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useGoBack must be used within a Router component");
  }
  return context.goBack;
};

export const useGoForward = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useGoForward must be used within a Router component");
  }
  return context.goForward;
};

export const useHistory = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useHistory must be used within a Router component");
  }
  return {
    goBack: context.goBack,
    goForward: context.goForward,
    go: context.go,
  };
};
