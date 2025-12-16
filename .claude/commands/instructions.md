# React Auth Router

> A comprehensive React library for authentication and routing with permissions, error handling, and performance optimization using subscriber patterns.

 # Project Overview

  React Auth Router is a comprehensive React library (v2.1.2) that provides:
  - Authentication management using a subscriber pattern (not React Context) for optimal performance
  - Flexible routing with nested routes, parameters, and query strings
  - Permission-based access control (RBAC + permission-based)
  - Error handling with react-toastify integration for beautiful toast notifications
  - Smart breadcrumbs that auto-generate from route hierarchy
  - Mobile-ready navigation with responsive breakpoints

  # Key Architecture Components

  1. `AuthStore (src/auth/AuthStore.js)`
    - Singleton pattern for global auth state
    - Subscriber pattern for targeted re-renders (avoiding Context re-render issues)
    - JWT token management with automatic refresh
    - Cross-tab synchronization via localStorage events
    - Permission expansion from role hierarchies
  2. `Router System (src/routing/)`
    - Custom router implementation (not react-router)
    - Browser history integration
    - Route guards with auth/permission checks
    - Parameter and query string extraction
    - Nested route support with automatic child matching
  3. `Error Management (src/error-management/index.js)`
    - ErrorBoundary for component-level error catching
    - ErrorProvider with react-toastify integration
    - Separate methods: addError, addSuccess, addWarning, addInfo
    - Global error state management
  4. `Components (src/components/index.js)`
    - Navigation with mobile support
    - Breadcrumb auto-generation
    - ProtectedComponent for conditional rendering
    - Routes component for route rendering

**Instructions:**
- Read the entire project to understand what this project does.
- Read the docs folder and understand the relevant md files for context of whats being requested for and the context you need.
- Understand the scope of changes you are being asked.
- Understand that major changes can break projects that impliment this library.
- Always be sure to update the package.json version property with the correct kind of version update. major, minor and improvements. Understand the value you need to update.
- If there is new functionality or functionality has changed then update the relevant document in the documents folder or create a new document if it's a new feature.