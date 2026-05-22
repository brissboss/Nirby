"use client";

import { useTranslations } from "next-intl";

import { ProfileSectionLayout } from "../components/ui/profile-section-layout.component";
import { ChangePasswordContent } from "../forms/change-password-content";

import { Card } from "@/components/ui";

type ProfileChangePasswordViewProps = {
  onBack: () => void;
};

export function ProfileChangePasswordView({ onBack }: ProfileChangePasswordViewProps) {
  const t = useTranslations("profile");

  return (
    <ProfileSectionLayout
      title={t("changePassword.title")}
      description={t("changePassword.description")}
      onBack={onBack}
    >
      <Card>
        <ChangePasswordContent closeDialog={onBack} embedded />
      </Card>
    </ProfileSectionLayout>
  );
}
