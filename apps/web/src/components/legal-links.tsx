"use client";

import { FileText, Scale } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type LegalLinksProps = {
  variant?: "inline" | "stack";
  className?: string;
};

export function LegalLinks({ variant = "inline", className }: LegalLinksProps) {
  const t = useTranslations("common");

  if (variant === "stack") {
    return (
      <nav aria-label={t("legal.navLabel")} className={cn("grid gap-2", className)}>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/privacy">
            <FileText className="mr-2 size-4" />
            {t("legal.privacy")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/mentions">
            <Scale className="mr-2 size-4" />
            {t("legal.mentions")}
          </Link>
        </Button>
      </nav>
    );
  }

  return (
    <nav
      aria-label={t("legal.navLabel")}
      className={cn("flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm", className)}
    >
      <Link className="text-primary hover:underline" href="/privacy">
        {t("legal.privacy")}
      </Link>
      <Link className="text-primary hover:underline" href="/mentions">
        {t("legal.mentions")}
      </Link>
    </nav>
  );
}
