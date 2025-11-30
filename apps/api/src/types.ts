/**
 * Supported languages for the application
 */
export const SUPPORTED_LANGUAGES = ["fr", "en"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
