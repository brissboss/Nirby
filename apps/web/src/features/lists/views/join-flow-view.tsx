"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { AuthRequiredPrompt } from "@/features/auth/components/auth-required-prompt.component";
import { useErrorMessage } from "@/hooks/use-error-message";

type JoinFlowMode = "edit" | "accept";

type JoinFlowViewProps = {
  mode: JoinFlowMode;
  returnPath: string;
  token: string | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  isJoining: boolean;
  error: unknown;
};

export function JoinFlowView({
  mode,
  returnPath,
  token,
  isAuthLoading,
  isAuthenticated,
  isJoining,
  error,
}: JoinFlowViewProps) {
  const tLists = useTranslations("lists");
  const getErrorMessage = useErrorMessage();
  const title = tLists(`join.${mode}.title`);
  const description = tLists(`join.${mode}.description`);

  if (isAuthLoading) {
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

  return (
    <div className="grid gap-4">
      <header className="grid gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {!isAuthenticated ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      {!isAuthenticated ? <AuthRequiredPrompt returnPath={returnPath} /> : null}
      {isAuthenticated && !token ? (
        <p className="text-sm text-muted-foreground" role="alert">
          {tLists("join.missingToken")}
        </p>
      ) : null}
      {isAuthenticated && token && error ? (
        <p className="text-sm text-muted-foreground" role="alert">
          {getErrorMessage(error)}
        </p>
      ) : null}
      {isAuthenticated && token && !error ? (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          aria-busy={isJoining}
          aria-label={tLists("join.joining")}
        >
          <Loader2 className="size-4 animate-spin" />
          <p>{tLists("join.joining")}</p>
        </div>
      ) : null}
    </div>
  );
}
