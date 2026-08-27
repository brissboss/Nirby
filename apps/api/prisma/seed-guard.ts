export function assertResetAllowed(
  nodeEnv = process.env.NODE_ENV ?? "development",
  allowReset = process.env.ALLOW_DB_RESET
): void {
  if (nodeEnv === "production" && allowReset !== "true") {
    throw new Error(
      "Refusing to wipe a production database. Re-run with ALLOW_DB_RESET=true (and CONFIRM_RESET=RESET on the VPS script)."
    );
  }
}
