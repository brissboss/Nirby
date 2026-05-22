"use client";

import { Lock, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ProfileActionRow } from "../components/ui/profile-action-row.component";
import type { ProfileInfoSubSection } from "../types/profile-section.types";

type ProfileInfoSecurityProps = {
  onNavigateSection: (section: ProfileInfoSubSection) => void;
};

export function ProfileInfoSecurity({ onNavigateSection }: ProfileInfoSecurityProps) {
  const t = useTranslations("profile");

  return (
    <div className="grid gap-2">
      <ProfileActionRow
        label={t("changePassword.title")}
        icon={Lock}
        onClick={() => onNavigateSection("changePassword")}
      />
      <ProfileActionRow
        label={t("deleteAccount.title")}
        icon={Trash2}
        variant="destructive"
        onClick={() => onNavigateSection("deleteAccount")}
      />
    </div>
  );
}
