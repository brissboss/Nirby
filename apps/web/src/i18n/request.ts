import { headers, cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const headersList = await headers();

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  const acceptLanguage = headersList.get("accept-language") || "";

  // Parse Accept-Language header
  const preferredLocale = acceptLanguage
    .split(",")
    .map((lang) => lang.split(";")[0].trim().split("-")[0])
    .find((lang) => locales.includes(lang as Locale));

  return (preferredLocale as Locale) || defaultLocale;
}

async function loadMessages(locale: Locale) {
  const [common, auth, errors] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/auth.json`),
    import(`../messages/${locale}/errors.json`),
  ]);

  return {
    common: common.default,
    auth: auth.default,
    errors: errors.default,
  };
}

export default getRequestConfig(async () => {
  const locale = await getLocale();

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
