import React from "react";
import {
  Router,
  Routes,
  Link,
  Navigation,
  initializeAuth,
  createRouteConfig,
} from "react-auth-router";
import "react-toastify/dist/ReactToastify.css";

// Initialize auth
initializeAuth({
  permissionHierarchy: {
    admin: ["read_users", "write_users"],
    user: ["read_users"],
  },
});

// Page components
const HomePage = () => (
  <div style={{ padding: "20px" }}>
    <h1>Home Page</h1>
    <p>Welcome to the home page!</p>
    <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
      <Link to="/about" style={{ color: "blue", textDecoration: "underline" }}>
        Go to About
      </Link>
      <Link to="/users" style={{ color: "blue", textDecoration: "underline" }}>
        Go to Users
      </Link>
      <Link
        to="/users/123"
        style={{ color: "blue", textDecoration: "underline" }}
      >
        Go to User 123
      </Link>
    </div>
  </div>
);

const AboutPage = () => (
  <div style={{ padding: "20px" }}>
    <h1>About Page</h1>
    <p>This is the about page.</p>
    <Link to="/" style={{ color: "blue", textDecoration: "underline" }}>
      Back to Home
    </Link>
  </div>
);

const UsersPage = () => (
  <div style={{ padding: "20px" }}>
    <h1>Users Page</h1>
    <p>List of users</p>
    <ul>
      <li>
        <Link
          to="/users/1"
          style={{ color: "blue", textDecoration: "underline" }}
        >
          User 1
        </Link>
      </li>
      <li>
        <Link
          to="/users/2"
          style={{ color: "blue", textDecoration: "underline" }}
        >
          User 2
        </Link>
      </li>
      <li>
        <Link
          to="/users/3"
          style={{ color: "blue", textDecoration: "underline" }}
        >
          User 3
        </Link>
      </li>
    </ul>
    <Link to="/" style={{ color: "blue", textDecoration: "underline" }}>
      Back to Home
    </Link>
  </div>
);

const UserDetailPage = ({ params }) => (
  <div style={{ padding: "20px" }}>
    <h1>User Detail Page</h1>
    <p>Viewing user: {params.id}</p>
    <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
      <Link to="/users" style={{ color: "blue", textDecoration: "underline" }}>
        Back to Users
      </Link>
      <Link to="/" style={{ color: "blue", textDecoration: "underline" }}>
        Back to Home
      </Link>
    </div>
  </div>
);

// Route configuration
const routeConfig = createRouteConfig({
  public: [
    {
      path: "/",
      component: HomePage,
      title: "Home",
      showInNav: true,
      exact: true,
    },
    {
      path: "/about",
      component: AboutPage,
      title: "About",
      showInNav: true,
    },
  ],
  protected: [
    {
      path: "/users",
      component: UsersPage,
      title: "Users",
      showInNav: true,
      exact: true,
      children: [
        {
          path: "/users/:id",
          component: UserDetailPage,
          title: "User Details",
        },
      ],
    },
  ],
});

// Main App
function App() {
  return (
    <Router>
      <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        <Navigation routeConfig={routeConfig} />
        <main style={{ padding: "20px" }}>
          <Routes routeConfig={routeConfig} />
        </main>
      </div>
    </Router>
  );
}

export default App;
