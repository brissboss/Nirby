"use client";

import { createContext } from "react";

import type { SignupResponse, User, VerifyEmailResponse, Error } from "@/lib/api/generated";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, language?: string) => Promise<SignupResponse | null>;
  refresh: () => Promise<void>;
  forgotPassword: (email: string, language?: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<VerifyEmailResponse | Error>;
  resendEmail: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
export type { AuthContextType };
