import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/logo";
import { LanguageSelector } from "@/components/ui/language-selector";
import { isAuthenticated } from "@/features/auth/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect("/");
  }

  const t = await getTranslations();

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-foreground lg:flex border-r">
        <div className="absolute inset-0 bg-muted" />
        <div className="relative z-20 flex justify-between items-center text-lg font-medium">
          <div className="flex items-center">
            <Logo className="mr-2" />
            <span className="font-display font-bold text-3xl">Nirby</span>
          </div>
          <LanguageSelector />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">{t("auth.general.description")}</p>
          </blockquote>
        </div>
      </div>
      <>{children}</>
    </div>
  );
}
