import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { MAIN_CONTENT_ID } from "@/lib/a11y/landmarks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return {
    title: t("privacy.metaTitle"),
    description: t("privacy.metaDescription"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const tCommon = await getTranslations("common");

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <p className="text-muted-foreground mb-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <strong className="text-foreground">{t("disclaimer.title")}</strong> —{" "}
          {t("disclaimer.privacy")}
        </p>

        <header className="mb-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("privacy.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{t("privacy.updatedAt")}</p>
        </header>

        <article className="space-y-8 text-sm leading-relaxed sm:text-base">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("privacy.s1Title")}</h2>
            <p>
              {t("privacy.s1Body")}
              <br />
              {t("privacy.s1Contact")}{" "}
              <a
                className="text-primary underline underline-offset-4 hover:no-underline"
                href={`mailto:${t("privacy.s1Email")}`}
              >
                {t("privacy.s1Email")}
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("privacy.s2Title")}</h2>
            <p>{t("privacy.s2Body")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("privacy.s3Title")}</h2>
            <p>{t("privacy.s3Body")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("privacy.s4Title")}</h2>
            <p>{t("privacy.s4Body")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("privacy.s5Title")}</h2>
            <p>{t("privacy.s5Body")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("privacy.s6Title")}</h2>
            <p>{t("privacy.s6Body")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("privacy.s7Title")}</h2>
            <p>
              {t.rich("privacy.s7Body", {
                cnil: (chunks) => (
                  <a
                    className="text-primary underline underline-offset-4 hover:no-underline"
                    href="https://www.cnil.fr"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("privacy.s8Title")}</h2>
            <p>{t("privacy.s8Body")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("privacy.s9Title")}</h2>
            <p>{t("privacy.s9Body")}</p>
            <p>{t("privacy.s9Necessary")}</p>
            <p>{t("privacy.s9Mapbox")}</p>
            <p>{t("privacy.s9Sentry")}</p>
          </section>
        </article>

        <footer className="text-muted-foreground mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-8 text-sm">
          <Link className="text-primary hover:underline" href="/">
            {tCommon("legal.home")}
          </Link>
          <Link className="text-primary hover:underline" href="/mentions">
            {tCommon("legal.mentions")}
          </Link>
        </footer>
      </main>
    </div>
  );
}
