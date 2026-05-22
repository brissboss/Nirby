"use client";

import { useTranslations } from "next-intl";

import { ProfileSectionLayout } from "../components/ui/profile-section-layout.component";
import { DeleteAccountContent } from "../forms/delete-account-content";

import { Card } from "@/components/ui";

type ProfileDeleteAccountViewProps = {
  onBack: () => void;
};

export function ProfileDeleteAccountView({ onBack }: ProfileDeleteAccountViewProps) {
  const t = useTranslations("profile");

  return (
    <ProfileSectionLayout
      title={t("deleteAccount.title")}
      description={t("deleteAccount.description")}
      onBack={onBack}
    >
      <Card>
        <DeleteAccountContent closeDialog={onBack} embedded />
      </Card>
    </ProfileSectionLayout>
  );
}
