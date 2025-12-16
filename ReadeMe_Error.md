## Error Handling

### Setup

**First, import the react-toastify CSS in your app entry point:**

```jsx
// In your index.js or App.js
import "react-toastify/dist/ReactToastify.css";
```

### Error Boundaries

The `ErrorProvider` wraps your app to provide global error handling and toast notifications using **react-toastify**.

```jsx
import { ErrorProvider, ErrorBoundary } from "react-auth-router";
import "react-toastify/dist/ReactToastify.css"; // Required!

function App() {
  return (
    <ErrorProvider>
      <ErrorBoundary level="app">
        <Router>
          <ErrorBoundary level="navigation">
            <Navigation />
          </ErrorBoundary>

          <main>
            <ErrorBoundary level="content">
              <Routes />
            </ErrorBoundary>
          </main>
        </Router>
      </ErrorBoundary>
    </ErrorProvider>
  );
}
```

**Customize Toast Configuration:**

```jsx
<ErrorProvider
  toastConfig={{
    position: "bottom-right",      // Toast position
    autoClose: 3000,               // Auto-close duration (ms)
    hideProgressBar: false,        // Show/hide progress bar
    closeOnClick: true,            // Close on click
    pauseOnHover: true,            // Pause timer on hover
    draggable: true,               // Allow dragging
    theme: "dark",                 // "light", "dark", or "colored"
    className: "custom-toast",     // Custom CSS class
  }}
>
  <App />
</ErrorProvider>
```

**Available Toast Positions:**
- `"top-left"`, `"top-right"`, `"top-center"`
- `"bottom-left"`, `"bottom-right"`, `"bottom-center"`

**Themes:**
- `"light"` - Light background
- `"dark"` - Dark background
- `"colored"` - Colored background based on toast type

### Error Handling in Components

React Auth Router now uses **react-toastify** for beautiful, reliable toast notifications with separate methods for different notification types.

**Note:** Make sure you've imported the CSS (see [Installation](#installation)).

```jsx
import { useError, useApiError } from "react-auth-router";
// CSS import required: import "react-toastify/dist/ReactToastify.css";

const UserProfile = () => {
  const { addSuccess, addError, addWarning, addInfo } = useError();
  const { handleApiError } = useApiError();

  const saveProfile = async (profileData) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      // Use specific notification methods
      addSuccess("Profile saved successfully!");
    } catch (error) {
      handleApiError(error, "Saving profile");
    }
  };

  const handleDelete = async () => {
    addWarning("This action cannot be undone");
    // ... delete logic
  };

  const showTip = () => {
    addInfo("You can edit your profile anytime");
  };

  return (
    <div>
      <button onClick={() => saveProfile(data)}>Save Profile</button>
      <button onClick={handleDelete}>Delete</button>
      <button onClick={showTip}>Show Tip</button>
    </div>
  );
};
```

**Available Notification Methods:**
- `addSuccess(message, options)` - Green success toast
- `addError(message, options)` - Red error toast
- `addWarning(message, options)` - Yellow warning toast
- `addInfo(message, options)` - Blue info toast

**Options:**
```jsx
addSuccess("Saved!", {
  autoClose: 3000,      // Auto-close after 3 seconds
  position: "top-left", // Toast position
  theme: "dark",        // Dark theme
});
```

### Custom Error Components

```jsx
const CustomErrorPage = ({ error, onRetry }) => (
  <div className="error-page">
    <h2>Oops! Something went wrong</h2>
    <p>{error.message}</p>
    <button onClick={onRetry}>Try Again</button>
    <button onClick={() => (window.location.href = "/")}>Go Home</button>
  </div>
);

// Use in RouteGuard
<RouteGuard route={route} forbiddenComponent={CustomErrorPage}>
  <YourContent />
</RouteGuard>;
```