import type { Metadata, Viewport } from "next";
import { Poppins, Quicksand } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale, getTranslations } from "next-intl/server";
import { ThemeProvider } from "next-themes";

import { CookieConsent } from "@/components/cookie-consent";
import { SkipLink } from "@/components/skip-link";
import { ToasterWrapper } from "@/components/ui";
import { AuthProvider } from "@/features/auth";
import { QueryProvider } from "@/lib/query-client";

import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nirby",
  description: "Nirby is a platform for creating and sharing lists of places",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nirby",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("common");

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${quicksand.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <SkipLink>{t("skipLink")}</SkipLink>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CookieConsent>
              <QueryProvider>
                <AuthProvider>{children}</AuthProvider>
              </QueryProvider>
              <ToasterWrapper />
            </CookieConsent>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
