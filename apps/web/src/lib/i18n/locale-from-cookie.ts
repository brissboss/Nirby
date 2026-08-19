import { defaultLocale, locales, type Locale } from "./constants";

export function getLocaleFromCookieString(cookie: string): Locale {
  const match = cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
  if (!match?.[1]) {
    return defaultLocale;
  }

  let value = match[1].trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return defaultLocale;
  }

  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}
