import { useState, useEffect, useMemo } from "react";
import { getAuthStore } from "./AuthStore";

export const useAuth = () => {
  const authStore = getAuthStore();
  const [authState, setAuthState] = useState({
    user: authStore.getUser(),
    loading: authStore.isLoading(),
    isAuthenticated: authStore.isAuthenticated(),
  });

  useEffect(() => {
    const unsubscribe = authStore.subscribe((update) => {
      setAuthState({
        user: update.user,
        loading: update.loading,
        isAuthenticated: !!update.user,
      });
    });

    return unsubscribe;
  }, [authStore]);

  const authMethods = useMemo(
    () => ({
      login: authStore.login.bind(authStore),
      logout: authStore.logout.bind(authStore),
      updateProfile: authStore.updateProfile.bind(authStore),
      refreshToken: authStore.refreshToken.bind(authStore),
      hasRole: authStore.hasRole.bind(authStore),
      hasPermission: authStore.hasPermission.bind(authStore),
      hasAnyRole: authStore.hasAnyRole.bind(authStore),
      hasAnyPermission: authStore.hasAnyPermission.bind(authStore),
      hasAllRoles: authStore.hasAllRoles.bind(authStore),
      hasAllPermissions: authStore.hasAllPermissions.bind(authStore),
      getToken: authStore.getToken.bind(authStore),
    }),
    [authStore]
  );

  return { ...authState, ...authMethods };
};

export const usePermissions = () => {
  const authStore = getAuthStore();
  const [permissions, setPermissions] = useState({
    roles: authStore.getUser()?.roles || [],
    permissions: authStore.getUser()?.permissions || [],
  });

  useEffect(() => {
    const unsubscribe = authStore.subscribe((update) => {
      const newRoles = update.user?.roles || [];
      const newPermissions = update.user?.permissions || [];

      if (
        JSON.stringify(newRoles) !== JSON.stringify(permissions.roles) ||
        JSON.stringify(newPermissions) !==
          JSON.stringify(permissions.permissions)
      ) {
        setPermissions({
          roles: newRoles,
          permissions: newPermissions,
        });
      }
    });

    return unsubscribe;
  }, [authStore, permissions]);

  return {
    roles: permissions.roles,
    permissions: permissions.permissions,
    hasRole: authStore.hasRole.bind(authStore),
    hasPermission: authStore.hasPermission.bind(authStore),
    hasAnyRole: authStore.hasAnyRole.bind(authStore),
    hasAnyPermission: authStore.hasAnyPermission.bind(authStore),
    hasAllRoles: authStore.hasAllRoles.bind(authStore),
    hasAllPermissions: authStore.hasAllPermissions.bind(authStore),
  };
};

export const useAuthLoading = () => {
  const authStore = getAuthStore();
  const [loading, setLoading] = useState(authStore.isLoading());

  useEffect(() => {
    const unsubscribe = authStore.subscribe((update) => {
      setLoading(update.loading);
    });

    return unsubscribe;
  }, [authStore]);

  return loading;
};

export const useAuthUser = () => {
  const authStore = getAuthStore();
  const [user, setUser] = useState(authStore.getUser());

  useEffect(() => {
    const unsubscribe = authStore.subscribe((update) => {
      setUser(update.user);
    });

    return unsubscribe;
  }, [authStore]);

  return user;
};
