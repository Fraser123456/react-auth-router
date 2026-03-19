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

  const readFromStore = () => {
    const tokenRoles = authStore.getTokenRoles();
    const tokenPermissions = authStore.getTokenPermissions();
    return {
      roles: tokenRoles.length > 0 ? tokenRoles : (authStore.getUser()?.roles || []),
      permissions: tokenPermissions.length > 0 ? tokenPermissions : (authStore.getUser()?.permissions || []),
    };
  };

  const [permissions, setPermissions] = useState(readFromStore);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setPermissions(readFromStore());
    });
    return unsubscribe;
  }, [authStore]);

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
