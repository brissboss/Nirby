import crypto from "crypto";

/**
 * Generate a verification token for email verification
 * @returns Random 32 bytes hex string encoded as base64
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculate the expiration date for a verification token
 * @param hours - Number of hours until expiration (default: 24)
 * @returns Expiration date
 */
export function getVerificationTokenExpiration(hours: number = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
