"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button, Card, CardInset } from "@/components/ui";

export function AuthRequiredPrompt() {
  const t = useTranslations("auth.required");

  return (
    <div className="flex min-h-56 flex-col items-center justify-center py-8">
      <Card className="w-full max-w-sm text-center">
        <CardInset className="flex flex-col items-center gap-4 py-2 bg-transparent">
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <LogIn className="size-6" aria-hidden />
          </span>
          <div className="grid gap-1">
            <h3 className="font-display text-lg font-semibold tracking-tight">{t("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">{t("login")}</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              {t("signup")}
            </Link>
          </p>
        </CardInset>
      </Card>
    </div>
  );
}
