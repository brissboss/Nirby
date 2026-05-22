"use client";

import { useTranslations } from "next-intl";

import { ProfileSectionLayout } from "../components/ui/profile-section-layout.component";
import { ProfileInfoForm } from "../forms/profile-info-form";
import type { ProfileInfoSubSection } from "../types/profile-section.types";

type ProfileInfoViewProps = {
  onBack: () => void;
  onNavigateSection: (section: ProfileInfoSubSection) => void;
};

export function ProfileInfoView({ onBack, onNavigateSection }: ProfileInfoViewProps) {
  const t = useTranslations("profile");

  return (
    <ProfileSectionLayout
      title={t("info.title")}
      description={t("info.description")}
      onBack={onBack}
    >
      <ProfileInfoForm onNavigateSection={onNavigateSection} />
    </ProfileSectionLayout>
  );
}
