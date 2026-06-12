"use client";

import { useTranslations } from "next-intl";

import { ProfileLanguagePicker } from "../components/ui/profile-language-picker.component";
import { ProfileSectionLayout } from "../components/ui/profile-section-layout.component";
import { ProfileThemePicker } from "../components/ui/profile-theme-picker.component";

import { Card, Separator } from "@/components/ui";

type ProfilePreferencesViewProps = {
  onBack: () => void;
};

export function ProfilePreferencesView({ onBack }: ProfilePreferencesViewProps) {
  const t = useTranslations("profile");

  return (
    <ProfileSectionLayout
      title={t("preferences.title")}
      description={t("preferences.description")}
      onBack={onBack}
    >
      <Card className="gap-6">
        <ProfileThemePicker />
        <Separator />
        <ProfileLanguagePicker />
      </Card>
    </ProfileSectionLayout>
  );
}
