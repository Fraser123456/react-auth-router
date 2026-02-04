# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.2] - 2026-01-04

### Added
- Documentation is now included in the npm package for better accessibility
- AI tools (like Claude Code) can now read documentation when the package is installed
- Added CHANGELOG.md to track version history

### Changed
- Package now includes `docs/` folder in published files for offline documentation access

## [2.6.1] - 2024

### Fixed
- Custom refresh token handling improvements

## [2.6.0] - 2024

### Added
- Full support for URL hash fragments (`#section`)
- Parse hash parameters for OAuth callbacks (`#access_token=xyz&token_type=bearer`)
- New `useHash()` and `useHashParams()` hooks
- Hash support in `navigate()` and `Link` component
- Automatic `hashchange` event handling
- Documentation: HASH-ROUTING.md

### Use Cases
- Perfect for Supabase, Auth0, and other OAuth providers
- Support for hash-based routing and fragment navigation

## [2.5.0] - 2024

### Added
- `Outlet` component for layout routes
- `useHasChildRoutes()` hook
- Support for parent layouts that wrap child routes

## [2.4.0] - 2024

### Added
- Enterprise-grade security modes (Recommended/Custom/Legacy)
- Multiple storage strategies (memory, sessionStorage, localStorage, httpOnly cookies)
- Automatic token rotation
- CSRF protection via CsrfHandler
- Separate access/refresh token management
- TokenStorage system for flexible token storage
- Documentation: SECURITY.md with comprehensive security guide

### Changed
- Enhanced AuthStore with configurable security modes
- Improved token management architecture

## [2.3.0] - 2024

### Added
- Default route functionality for "/" path
- Navigation history hooks (`useGoBack`, `useGoForward`, `useHistory`)
- Smart authentication-based redirects
- `authenticatedDefaultRoute` and `unauthenticatedDefaultRoute` props on Routes component

## [2.2.2] - 2024

### Added
- `requireGuest` property for login/register routes
- Prevents authenticated users from accessing auth pages

## [2.2.1] - 2024

### Changed
- Security enhancement: unauthorized routes now show 404 by default
- Prevents route enumeration attacks
- Secure by default approach

## [2.2.0] - 2024

### Added
- Comprehensive documentation structure
- 15 detailed markdown documentation files
- Migration guides and best practices

## [2.1.0] - 2024

### Added
- Initial stable release
- Subscriber pattern for AuthStore
- Custom routing system
- Permission-based access control
- Error handling with react-toastify
- Breadcrumb generation
- Mobile-responsive navigation

[2.6.2]: https://github.com/Fraser123456/react-auth-router/compare/v2.6.1...v2.6.2
[2.6.1]: https://github.com/Fraser123456/react-auth-router/compare/v2.6.0...v2.6.1
[2.6.0]: https://github.com/Fraser123456/react-auth-router/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/Fraser123456/react-auth-router/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/Fraser123456/react-auth-router/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/Fraser123456/react-auth-router/compare/v2.2.2...v2.3.0
[2.2.2]: https://github.com/Fraser123456/react-auth-router/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/Fraser123456/react-auth-router/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Fraser123456/react-auth-router/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Fraser123456/react-auth-router/releases/tag/v2.1.0
