export type DependencyCheckResult = {
  ok: boolean;
  latencyMs?: number;
  skipped?: boolean;
  error?: string;
};

export type ReadinessResponse = {
  ok: boolean;
  time: string;
  checks: {
    database: DependencyCheckResult;
    redis: DependencyCheckResult;
    storage: DependencyCheckResult;
  };
};
