import React, {
  Component,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { AlertTriangle, RefreshCw, Home, Bug, X } from "lucide-react";

export const ErrorTypes = {
  NETWORK: "NETWORK",
  VALIDATION: "VALIDATION",
  AUTHENTICATION: "AUTHENTICATION",
  AUTHORIZATION: "AUTHORIZATION",
  NOT_FOUND: "NOT_FOUND",
  SERVER: "SERVER",
  CLIENT: "CLIENT",
  UNKNOWN: "UNKNOWN",
  SUCCESS: "SUCCESS",
};

const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);
  const [globalError, setGlobalError] = useState(null);

  const addError = (error) => {
    const errorObj = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      type: error.type || ErrorTypes.UNKNOWN,
      message: error.message || "An unexpected error occurred",
      details: error.details || null,
      stack: error.stack || null,
      dismissed: false,
    };

    setErrors((prev) => [...prev, errorObj]);

    console.error("Application Error:", errorObj);
  };

  const removeError = (errorId) => {
    setErrors((prev) => prev.filter((err) => err.id !== errorId));
  };

  const clearAllErrors = () => {
    setErrors([]);
    setGlobalError(null);
  };

  const setFatalError = (error) => {
    setGlobalError(error);
  };

  return (
    <ErrorContext.Provider
      value={{
        errors,
        globalError,
        addError,
        removeError,
        clearAllErrors,
        setFatalError,
      }}
    >
      {children}
      <ErrorDisplay />
      {globalError && <FatalErrorDisplay error={globalError} />}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Error Boundary Caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return <Fallback error={this.state.error} onRetry={this.handleRetry} />;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          level={this.props.level || "component"}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, onRetry, level }) => {
  const [showDetails, setShowDetails] = useState(false);

  const errorTitle =
    level === "app" ? "Application Error" : "Something went wrong";
  const errorMessage = error?.message || "An unexpected error occurred";

  return (
    <div
      style={{
        minHeight: level === "app" ? "100vh" : "auto",
        backgroundColor: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          maxWidth: "28rem",
          width: "100%",
          backgroundColor: "white",
          borderRadius: "0.5rem",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <AlertTriangle
            style={{
              height: "2rem",
              width: "2rem",
              color: "#ef4444",
              marginRight: "0.75rem",
            }}
          />
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#111827",
              margin: 0,
            }}
          >
            {errorTitle}
          </h1>
        </div>

        <p
          style={{
            color: "#6b7280",
            marginBottom: "1.5rem",
            margin: "0 0 1.5rem 0",
          }}
        >
          {errorMessage}
        </p>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <button
            onClick={onRetry}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            <RefreshCw
              style={{ height: "1rem", width: "1rem", marginRight: "0.5rem" }}
            />
            Try Again
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem 1rem",
              backgroundColor: "#6b7280",
              color: "white",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            <Home
              style={{ height: "1rem", width: "1rem", marginRight: "0.5rem" }}
            />
            Go Home
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem 1rem",
              backgroundColor: "white",
              color: "#374151",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            <Bug
              style={{ height: "1rem", width: "1rem", marginRight: "0.5rem" }}
            />
            {showDetails ? "Hide" : "Show"} Details
          </button>
        </div>

        {showDetails && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              backgroundColor: "#f3f4f6",
              borderRadius: "0.375rem",
            }}
          >
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#111827",
                marginBottom: "0.5rem",
                margin: "0 0 0.5rem 0",
              }}
            >
              Error Details:
            </h3>
            <pre
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                whiteSpace: "pre-wrap",
                overflow: "auto",
                maxHeight: "10rem",
                margin: 0,
              }}
            >
              {error?.stack ||
                errorInfo?.componentStack ||
                "No additional details available"}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const ErrorDisplay = () => {
  const { errors, removeError } = useError();

  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {errors.slice(-3).map((error) => (
        <ErrorToast
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
        />
      ))}
    </div>
  );
};

const ErrorToast = ({ error, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getErrorColor = (type) => {
    switch (type) {
      case ErrorTypes.NETWORK:
        return "#f97316";
      case ErrorTypes.AUTHENTICATION:
      case ErrorTypes.AUTHORIZATION:
        return "#eab308";
      case ErrorTypes.VALIDATION:
        return "#3b82f6";
      case ErrorTypes.SUCCESS:
        return "#10b981";
      default:
        return "#ef4444";
    }
  };

  return (
    <div
      style={{
        transform: isVisible ? "translateX(0)" : "translateX(100%)",
        opacity: isVisible ? 1 : 0,
        transition: "all 0.3s ease-in-out",
        maxWidth: "24rem",
        width: "100%",
        backgroundColor: "white",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        borderLeft: `4px solid ${getErrorColor(error.type)}`,
      }}
    >
      <div style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div style={{ flexShrink: 0 }}>
            <AlertTriangle
              style={{
                height: "1.25rem",
                width: "1.25rem",
                color: getErrorColor(error.type),
              }}
            />
          </div>
          <div style={{ marginLeft: "0.75rem", flex: 1 }}>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#111827",
                margin: 0,
              }}
            >
              {error.type}{" "}
              {error.type === ErrorTypes.SUCCESS ? "Success" : "Error"}
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginTop: "0.25rem",
                margin: "0.25rem 0 0 0",
              }}
            >
              {error.message}
            </p>
          </div>
          <div style={{ marginLeft: "1rem", flexShrink: 0 }}>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              style={{
                color: "#9ca3af",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
              }}
            >
              <X style={{ height: "1rem", width: "1rem" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FatalErrorDisplay = ({ error }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.5rem",
          padding: "1.5rem",
          maxWidth: "28rem",
          margin: "1rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <AlertTriangle
            style={{
              height: "4rem",
              width: "4rem",
              color: "#ef4444",
              margin: "0 auto 1rem",
            }}
          />
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "0.5rem",
              margin: "0 0 0.5rem 0",
            }}
          >
            Critical Error
          </h2>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "1.5rem",
              margin: "0 0 1.5rem 0",
            }}
          >
            The application has encountered a critical error and needs to be
            restarted.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: "#ef4444",
              color: "white",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Restart Application
          </button>
        </div>
      </div>
    </div>
  );
};

export const useApiError = () => {
  const { addError } = useError();

  const handleApiError = (error, context = "") => {
    let errorType = ErrorTypes.UNKNOWN;
    let message = "An unexpected error occurred";

    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        errorType = ErrorTypes.AUTHENTICATION;
        message = "Please log in to continue";
      } else if (status === 403) {
        errorType = ErrorTypes.AUTHORIZATION;
        message = "You do not have permission to perform this action";
      } else if (status === 404) {
        errorType = ErrorTypes.NOT_FOUND;
        message = "The requested resource was not found";
      } else if (status >= 400 && status < 500) {
        errorType = ErrorTypes.VALIDATION;
        message = error.response.data?.message || "Invalid request";
      } else if (status >= 500) {
        errorType = ErrorTypes.SERVER;
        message = "Server error occurred. Please try again later";
      }
    } else if (error.request) {
      errorType = ErrorTypes.NETWORK;
      message = "Network error. Please check your connection";
    }

    addError({
      type: errorType,
      message: `${context ? context + ": " : ""}${message}`,
      details: error.response?.data,
      stack: error.stack,
    });
  };

  return { handleApiError };
};
