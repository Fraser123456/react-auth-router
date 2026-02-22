import React, {
  Component,
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

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
  INFO: "INFO",
  WARNING: "WARNING",
};

const ErrorContext = createContext();

export const ErrorProvider = ({ children, toastConfig = {} }) => {
  const [errors, setErrors] = useState([]);
  const [globalError, setGlobalError] = useState(null);

  const defaultToastConfig = useMemo(() => ({
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...toastConfig,
  }), [toastConfig]);

  const addError = useCallback((message, options = {}) => {
    const errorObj = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      type: ErrorTypes.UNKNOWN,
      message: message || "An unexpected error occurred",
      details: options.details || null,
      stack: options.stack || null,
    };

    setErrors((prev) => [...prev, errorObj]);
    console.error("Application Error:", errorObj);

    toast.error(message, { ...defaultToastConfig, ...options });

    return errorObj.id;
  }, [defaultToastConfig]);

  const addSuccess = useCallback((message, options = {}) => {
    const successObj = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      type: ErrorTypes.SUCCESS,
      message: message || "Operation successful",
      details: options.details || null,
    };

    toast.success(message, { ...defaultToastConfig, ...options });

    return successObj.id;
  }, [defaultToastConfig]);

  const addWarning = useCallback((message, options = {}) => {
    const warningObj = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      type: ErrorTypes.WARNING,
      message: message || "Warning",
      details: options.details || null,
    };

    console.warn("Warning:", warningObj);

    toast.warning(message, { ...defaultToastConfig, ...options });

    return warningObj.id;
  }, [defaultToastConfig]);

  const addInfo = useCallback((message, options = {}) => {
    const infoObj = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      type: ErrorTypes.INFO,
      message: message || "Information",
      details: options.details || null,
    };

    console.info("Info:", infoObj);

    toast.info(message, { ...defaultToastConfig, ...options });

    return infoObj.id;
  }, [defaultToastConfig]);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setGlobalError(null);
    toast.dismiss();
  }, []);

  const setFatalError = useCallback((error) => {
    setGlobalError(error);
  }, []);

  const contextValue = useMemo(() => ({
    errors,
    globalError,
    addError,
    addSuccess,
    addWarning,
    addInfo,
    clearAllErrors,
    setFatalError,
  }), [errors, globalError, addError, addSuccess, addWarning, addInfo, clearAllErrors, setFatalError]);

  return (
    <ErrorContext.Provider value={contextValue}>
      <ToastContainer {...defaultToastConfig} />
      {children}
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
  const { addError, addWarning } = useError();

  const handleApiError = useCallback((error, context = "") => {
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

    const finalMessage = `${context ? context + ": " : ""}${message}`;

    // Use warning for non-critical errors, error for critical ones
    if (errorType === ErrorTypes.VALIDATION) {
      addWarning(finalMessage, {
        details: error.response?.data,
        stack: error.stack,
      });
    } else {
      addError(finalMessage, {
        details: error.response?.data,
        stack: error.stack,
      });
    }
  }, [addError, addWarning]);

  return useMemo(() => ({ handleApiError }), [handleApiError]);
};
