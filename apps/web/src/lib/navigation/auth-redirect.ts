/** Query param used to resume a path after login or signup. */
export const RETURN_URL_PARAM = "returnUrl";

/**
 * Returns a same-origin relative path, or `null` if `raw` is missing or unsafe
 * (absolute URL, protocol-relative `//`, backslashes).
 */
export function getSafeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  let path = raw;
  try {
    path = decodeURIComponent(raw);
  } catch {
    path = raw;
  }

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("://")
  ) {
    return null;
  }

  return path;
}

export function buildLoginHref(returnPath: string): string {
  const safe = getSafeReturnPath(returnPath);
  if (!safe) {
    return "/login";
  }
  return `/login?${RETURN_URL_PARAM}=${encodeURIComponent(safe)}`;
}

export function buildSignupHref(returnPath: string): string {
  const safe = getSafeReturnPath(returnPath);
  if (!safe) {
    return "/signup";
  }
  return `/signup?${RETURN_URL_PARAM}=${encodeURIComponent(safe)}`;
}
