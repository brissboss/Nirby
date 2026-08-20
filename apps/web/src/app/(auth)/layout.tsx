import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LegalLinks } from "@/components/legal-links";
import { Logo } from "@/components/logo";
import { LanguageSelector } from "@/components/ui/language-selector";
import { isAuthenticated } from "@/features/auth/server";
import { MAIN_CONTENT_ID } from "@/lib/a11y/landmarks";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect("/");
  }

  const t = await getTranslations();

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative z-10 hidden min-h-screen flex-col overflow-visible bg-muted p-10 text-foreground lg:flex">
        <div className="absolute inset-0 bg-muted" />

        <div className="relative z-20 flex items-center justify-between text-lg font-medium">
          <div className="flex items-center">
            <Logo className="mr-2" />
            <span className="font-display text-3xl font-bold">Nirby</span>
          </div>
          <LanguageSelector />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-12 -right-[3%] left-0 z-10 flex items-center justify-center"
        >
          <Image
            src="/auth-hero.png"
            alt=""
            width={1436}
            height={924}
            priority
            className="h-auto w-[min(118%,46rem)] max-w-none translate-x-[8%] object-contain drop-shadow-2xl"
          />
        </div>

        <div className="relative z-20 mt-auto max-w-xl">
          <blockquote className="space-y-2">
            <p className="text-lg">{t("auth.general.description")}</p>
          </blockquote>
        </div>
      </div>
      <div className="relative z-0 flex min-h-screen flex-col bg-background">
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex min-h-0 flex-1 flex-col">
          {children}
        </main>
        <footer className="px-6 py-4">
          <LegalLinks />
        </footer>
      </div>
    </div>
  );
}
