"use client";

import { LogOut, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

import { ProfileSectionLayout } from "../components/ui/profile-section-layout.component";

import { Button, Card, CardInset } from "@/components/ui";
import { useAuth } from "@/features/auth";

type ProfilePrivacyViewProps = {
  onBack: () => void;
};

export function ProfilePrivacyView({ onBack }: ProfilePrivacyViewProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations();
  const { logout } = useAuth();

  return (
    <ProfileSectionLayout
      title={t("privacy.title")}
      description={t("privacy.description")}
      onBack={onBack}
    >
      <Card>
        <CardInset className="flex items-start gap-3">
          <Shield className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("privacy.comingSoon")}</p>
        </CardInset>
        <Button
          type="button"
          variant="destructive"
          className="w-full justify-start"
          onClick={() => void logout()}
        >
          <LogOut className="mr-2 size-4" />
          {tCommon("common.buttons.logout")}
        </Button>
      </Card>
    </ProfileSectionLayout>
  );
}
