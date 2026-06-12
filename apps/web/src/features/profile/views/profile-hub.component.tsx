"use client";

import { useTranslations } from "next-intl";

import { ProfileIdentityCard } from "../components/ui/profile-identity-card.component";
import { ProfileMenuList } from "../components/ui/profile-menu-list.component";
import { ProfileMenuRow } from "../components/ui/profile-menu-row.component";
import type { ProfileSection } from "../types/profile-section.types";

type ProfileHubProps = {
  onNavigate: (section: Exclude<ProfileSection, "hub">) => void;
};

export function ProfileHub({ onNavigate }: ProfileHubProps) {
  const t = useTranslations("profile");

  return (
    <div className="grid gap-4 pb-4">
      <div className="grid gap-1 px-1">
        <h2 className="font-display text-lg font-semibold tracking-tight">{t("hub.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("hub.subtitle")}</p>
      </div>
      <ProfileIdentityCard variant="readonly" />
      <ProfileMenuList>
        <ProfileMenuRow label={t("sections.info")} onClick={() => onNavigate("info")} />
        <ProfileMenuRow
          label={t("sections.preferences")}
          onClick={() => onNavigate("preferences")}
        />
        <ProfileMenuRow label={t("sections.privacy")} onClick={() => onNavigate("privacy")} />
      </ProfileMenuList>
    </div>
  );
}
