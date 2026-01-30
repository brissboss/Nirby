import fs from "fs";
import path from "path";

import { headers, cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { locales, type Locale, defaultLocale } from "./constants";

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
  const dir = path.join(process.cwd(), "src/lib/i18n/locales", locale);
  const files = await fs.readdirSync(dir).filter((file) => file.endsWith(".json"));
  const messages: Record<string, unknown> = {};

  for (const file of files) {
    const name = file.replace(".json", "");
    const content = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    messages[name] = content;
  }

  return messages;
}

export default getRequestConfig(async () => {
  const locale = await getLocale();

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
