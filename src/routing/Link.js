import React from "react";
import { useNavigate } from "./Router";

/**
 * Link component for client-side navigation without page reloads
 * Similar to react-router-dom's Link component
 *
 * @param {Object} props
 * @param {string} props.to - The path to navigate to
 * @param {boolean} props.replace - Replace current history entry instead of pushing
 * @param {Object} props.query - Query parameters to add to the URL
 * @param {Object} props.state - State to pass with navigation
 * @param {string} props.className - CSS class name
 * @param {Object} props.style - Inline styles
 * @param {Function} props.onClick - Click handler (called before navigation)
 * @param {ReactNode} props.children - Link content
 */
export const Link = ({
  to,
  replace = false,
  query = {},
  state = null,
  className = "",
  style = {},
  onClick,
  children,
  ...props
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    // Prevent default link behavior (page reload)
    e.preventDefault();
    e.stopPropagation();

    // Call custom onClick handler if provided
    if (onClick) {
      const result = onClick(e);
      // If onClick returns false or calls preventDefault, don't navigate
      if (result === false || e.defaultPrevented) {
        return;
      }
    }

    // Perform navigation
    navigate(to, { replace, query, state });
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={className}
      style={{
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        ...style,
      }}
      {...props}
    >
      {children}
    </a>
  );
};
