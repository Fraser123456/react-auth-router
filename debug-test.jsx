import React from "react";
import {
  Router,
  Routes,
  Link,
  useRouter,
  createRouteConfig,
} from "./dist/index.js";

// Simple page components
const Home = () => {
  const { currentPath } = useRouter();
  console.log("[Home] Current path:", currentPath);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Home Page</h1>
      <p>Current path: <strong>{currentPath}</strong></p>
      <div style={{ marginTop: "20px", display: "flex", gap: "15px", flexDirection: "column", maxWidth: "200px" }}>
        <Link
          to="/about"
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
          onClick={() => console.log("[Link] Clicked About")}
        >
          Go to About
        </Link>
        <Link
          to="/contact"
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
          onClick={() => console.log("[Link] Clicked Contact")}
        >
          Go to Contact
        </Link>
      </div>
    </div>
  );
};

const About = () => {
  const { currentPath } = useRouter();
  console.log("[About] Current path:", currentPath);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>About Page</h1>
      <p>Current path: <strong>{currentPath}</strong></p>
      <Link
        to="/"
        style={{
          padding: "10px 20px",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          display: "inline-block"
        }}
      >
        Back to Home
      </Link>
    </div>
  );
};

const Contact = () => {
  const { currentPath } = useRouter();
  console.log("[Contact] Current path:", currentPath);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Contact Page</h1>
      <p>Current path: <strong>{currentPath}</strong></p>
      <Link
        to="/"
        style={{
          padding: "10px 20px",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          display: "inline-block"
        }}
      >
        Back to Home
      </Link>
    </div>
  );
};

// Route config
const routeConfig = createRouteConfig({
  public: [
    {
      path: "/",
      component: Home,
      title: "Home",
      exact: true,
    },
    {
      path: "/about",
      component: About,
      title: "About",
    },
    {
      path: "/contact",
      component: Contact,
      title: "Contact",
    },
  ],
});

// Main App
export default function DebugApp() {
  console.log("[App] Rendering");

  return (
    <Router>
      <div style={{ backgroundColor: "#f0f0f0", minHeight: "100vh" }}>
        <div style={{ backgroundColor: "#333", color: "white", padding: "10px 40px" }}>
          <h2>Debug Test App - Check Browser Console</h2>
        </div>
        <Routes routeConfig={routeConfig} />
      </div>
    </Router>
  );
}
