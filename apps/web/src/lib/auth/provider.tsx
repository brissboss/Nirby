"use client";

import { useState, useEffect, useCallback } from "react";

import {
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  signup,
  verifyEmail,
  resendVerification,
} from "@/lib/api";
import { setAccessToken, setRefreshTokenFn } from "@/lib/api/client";
import type { User } from "@/lib/api/generated";
import { AuthContext, type AuthContextType } from "@/lib/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
    setAccessToken(token);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await getMe();

      if (response.data) {
        setUser(response.data.user);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const response = await login({
        body: {
          email,
          password,
        },
      });

      if (response.data) {
        updateToken(response.data.accessToken);
        await fetchUser();
      } else {
        throw response.error;
      }
    },
    [updateToken, fetchUser]
  );

  const handleSignup = useCallback(async (email: string, password: string, language?: string) => {
    const response = await signup({
      body: { email, password, language },
    });

    if (response.data) {
      return response.data;
    } else {
      throw response.error;
    }
  }, []);

  const handleForgotPassword = useCallback(async (email: string, language?: string) => {
    const response = await forgotPassword({
      body: { email, language },
    });

    if (response.data) {
      return;
    } else {
      throw response.error;
    }
  }, []);

  const handleResetPassword = useCallback(async (token: string, password: string) => {
    const response = await resetPassword({
      body: { token, password },
    });

    if (response.data) {
      return;
    } else {
      throw response.error;
    }
  }, []);

  const handleVerifyEmail = useCallback(async (token: string) => {
    const response = await verifyEmail({
      query: { token },
    });

    if (response.data) {
      return response.data;
    } else {
      throw response.error;
    }
  }, []);

  const handleResendEmail = useCallback(async (email: string) => {
    const response = await resendVerification({
      body: { email },
    });

    if (response.data) {
      return;
    } else {
      throw response.error;
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const response = await refreshToken();

      if (response.data) {
        updateToken(response.data.accessToken);
        await fetchUser();
      } else {
        updateToken(null);
        setUser(null);
      }
    } catch {
      updateToken(null);
      setUser(null);
    }
  }, [updateToken, fetchUser]);

  const refreshTokenOnly = useCallback(async () => {
    try {
      const response = await refreshToken();
      if (response.data) {
        updateToken(response.data.accessToken);
        return response.data.accessToken;
      }
      updateToken(null);
      setUser(null);
      return null;
    } catch {
      updateToken(null);
      setUser(null);
      return null;
    }
  }, [updateToken]);

  useEffect(() => {
    setRefreshTokenFn(refreshTokenOnly);
  }, [refreshTokenOnly]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      updateToken(null);
      setUser(null);
    }
  }, [updateToken]);

  useEffect(() => {
    const init = async () => {
      try {
        await handleRefresh();
      } catch {
        // Silently ignore refresh errors on init
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [handleRefresh]);

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    refresh: handleRefresh,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    signup: handleSignup,
    verifyEmail: handleVerifyEmail,
    resendEmail: handleResendEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
