import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { MAIN_CONTENT_ID } from "@/lib/a11y/landmarks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return {
    title: t("mentions.metaTitle"),
    description: t("mentions.metaDescription"),
  };
}

export default async function MentionsPage() {
  const t = await getTranslations("legal");
  const tCommon = await getTranslations("common");

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <p className="text-muted-foreground mb-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <strong className="text-foreground">{t("disclaimer.title")}</strong> —{" "}
          {t("disclaimer.mentions")}
        </p>

        <header className="mb-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("mentions.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{t("mentions.updatedAt")}</p>
        </header>

        <article className="space-y-8 text-sm leading-relaxed sm:text-base">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("mentions.s1Title")}</h2>
            <p>
              <strong>{t("mentions.s1Name")}</strong>
              <br />
              {t("mentions.s1Capital")}
              <br />
              {t("mentions.s1Rcs")}
              <br />
              {t("mentions.s1Address")}
              <br />
              {t("mentions.s1RepLabel")} <strong>{t("mentions.s1Rep")}</strong>
              <br />
              {t("mentions.s1Contact")}{" "}
              <a
                className="text-primary underline underline-offset-4 hover:no-underline"
                href={`mailto:${t("mentions.s1Email")}`}
              >
                {t("mentions.s1Email")}
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("mentions.s2Title")}</h2>
            <p>{t("mentions.s2Body")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("mentions.s3Title")}</h2>
            <p>{t("mentions.s3Body")}</p>
            <p>
              <strong>{t("mentions.s3Host")}</strong>
              <br />
              {t("mentions.s3Address")}
              <br />
              <span className="text-muted-foreground">{t("mentions.s3Site")}</span>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("mentions.s4Title")}</h2>
            <p>{t("mentions.s4Body")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{t("mentions.s5Title")}</h2>
            <p>
              {t.rich("mentions.s5Body", {
                privacy: (chunks) => (
                  <Link
                    className="text-primary underline underline-offset-4 hover:no-underline"
                    href="/privacy"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </section>
        </article>

        <footer className="text-muted-foreground mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-8 text-sm">
          <Link className="text-primary hover:underline" href="/">
            {tCommon("legal.home")}
          </Link>
          <Link className="text-primary hover:underline" href="/privacy">
            {tCommon("legal.privacy")}
          </Link>
        </footer>
      </main>
    </div>
  );
}
