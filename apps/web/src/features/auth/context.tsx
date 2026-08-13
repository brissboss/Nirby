"use client";

import { createContext } from "react";

import type { SignupResponse, User, VerifyEmailResponse, Error } from "@/lib/api/generated";
import type { Locale } from "@/lib/i18n/constants";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, language?: Locale) => Promise<SignupResponse | null>;
  refresh: () => Promise<void>;
  forgotPassword: (email: string, language?: Locale) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<VerifyEmailResponse | Error>;
  resendEmail: (email: string) => Promise<void>;
  updateProfile: (name: string, avatarUrl: string, bio: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string, language?: Locale) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
export type { AuthContextType };
