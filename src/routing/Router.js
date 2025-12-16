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
  const [hash, setHash] = useState("");
  const [hashParams, setHashParams] = useState({});

  useEffect(() => {
    if (typeof window === "undefined" || !enableHistory) return;

    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      updateRouteState(path);
    };

    const handleHashChange = () => {
      updateRouteState(currentPath);
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handleHashChange);
    updateRouteState(currentPath);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [currentPath, enableHistory]);

  const updateRouteState = useCallback((path) => {
    if (typeof window === "undefined") return;

    // Parse query parameters (after ?)
    const searchParams = new URLSearchParams(window.location.search);
    const queryParams = {};
    for (let [key, value] of searchParams) {
      queryParams[key] = value;
    }
    setQuery(queryParams);

    // Parse hash fragment (after #)
    const hashString = window.location.hash;
    if (hashString) {
      // Remove the leading # symbol
      const hashWithoutSymbol = hashString.substring(1);
      setHash(hashWithoutSymbol);

      // Parse hash parameters (e.g., #access_token=xyz&token_type=bearer)
      // Check if hash contains parameters (has = or &)
      if (hashWithoutSymbol.includes("=") || hashWithoutSymbol.includes("&")) {
        const hashSearchParams = new URLSearchParams(hashWithoutSymbol);
        const hashParamsObj = {};
        for (let [key, value] of hashSearchParams) {
          hashParamsObj[key] = value;
        }
        setHashParams(hashParamsObj);
      } else {
        // Hash is just a fragment identifier (e.g., #section1)
        setHashParams({});
      }
    } else {
      setHash("");
      setHashParams({});
    }
  }, []);

  const navigate = useCallback(
    (path, options = {}) => {
      const {
        replace = false,
        query: queryParams = {},
        hash: hashFragment = "",
        state = null,
      } = options;

      const fullPath = basePath ? `${basePath}${path}` : path;

      // Build query string
      const searchParams = new URLSearchParams(queryParams);
      let finalPath = searchParams.toString()
        ? `${fullPath}?${searchParams}`
        : fullPath;

      // Add hash fragment if provided
      if (hashFragment) {
        // Ensure hash doesn't start with # (we'll add it)
        const cleanHash = hashFragment.startsWith("#")
          ? hashFragment.substring(1)
          : hashFragment;
        finalPath = `${finalPath}#${cleanHash}`;
      }

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
        hash,
        hashParams,
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
