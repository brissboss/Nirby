"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { AuthRequiredPrompt } from "./auth-required-prompt.component";

import { useAuth } from "@/features/auth/hooks";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex min-h-56 items-center justify-center py-8"
        aria-busy="true"
        aria-label="Loading"
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <AuthRequiredPrompt />;
  }

  return children;
}
