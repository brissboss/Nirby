"use client";

import { CompassIcon, OctagonXIcon, SearchXIcon, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type ExploreStateProps = {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
  children?: ReactNode;
  role?: "alert";
};

/** Shared layout for the Explore placeholder states (idle, empty, error). */
function ExploreState({
  icon: Icon,
  iconClassName,
  title,
  description,
  children,
  role,
}: ExploreStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center" role={role}>
      <span className={cn("grid size-12 place-items-center rounded-full", iconClassName)}>
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="grid max-w-sm gap-1">
        <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function ExploreIdle() {
  const tExplore = useTranslations("explore");

  return (
    <ExploreState
      icon={CompassIcon}
      iconClassName="bg-primary/10 text-primary"
      title={tExplore("idle.title")}
      description={tExplore("idle.description")}
    >
      <p className="text-xs text-muted-foreground">{tExplore("search.minLengthHint")}</p>
    </ExploreState>
  );
}

export function ExploreEmpty() {
  const tExplore = useTranslations("explore");

  return (
    <ExploreState
      icon={SearchXIcon}
      iconClassName="bg-muted text-muted-foreground"
      title={tExplore("results.empty.title")}
      description={tExplore("results.empty.description")}
    />
  );
}

type ExploreErrorProps = {
  message: string;
  onRetry: () => void;
};

export function ExploreError({ message, onRetry }: ExploreErrorProps) {
  const tExplore = useTranslations("explore");

  return (
    <ExploreState
      icon={OctagonXIcon}
      iconClassName="bg-destructive/10 text-destructive"
      title={tExplore("results.error.title")}
      description={message}
      role="alert"
    >
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {tExplore("results.error.retry")}
      </Button>
    </ExploreState>
  );
}
