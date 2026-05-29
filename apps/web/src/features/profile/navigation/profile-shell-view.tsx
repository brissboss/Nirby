"use client";

import { useEffect, useState } from "react";

import { DEFAULT_PROFILE_SECTION } from "../constants/profile.constants";
import { useProfileSectionUrl } from "../hooks/use-profile-section-url";
import type { ProfileSection } from "../types/profile-section.types";
import { ProfileChangePasswordView } from "../views/profile-change-password-view.component";
import { ProfileDeleteAccountView } from "../views/profile-delete-account-view.component";
import { ProfileHub } from "../views/profile-hub.component";
import { ProfileInfoView } from "../views/profile-info-view.component";
import { ProfilePreferencesView } from "../views/profile-preferences-view.component";
import { ProfilePrivacyView } from "../views/profile-privacy-view.component";

import { useAuth } from "@/features/auth";

export function ProfileShellView() {
  const { user, isLoading } = useAuth();
  const [section, setSectionState] = useState<ProfileSection>(DEFAULT_PROFILE_SECTION);
  const { setSection } = useProfileSectionUrl(section, setSectionState);

  useEffect(() => {
    if (!isLoading && !user && section !== DEFAULT_PROFILE_SECTION) {
      setSection(DEFAULT_PROFILE_SECTION);
    }
  }, [user, isLoading, section, setSection]);

  const goHub = () => setSection(DEFAULT_PROFILE_SECTION);
  const goInfo = () => setSection("info");

  const navigate = (next: Exclude<ProfileSection, "hub">) => setSection(next);

  switch (section) {
    case "info":
      return <ProfileInfoView onBack={goHub} onNavigateSection={navigate} />;
    case "changePassword":
      return <ProfileChangePasswordView onBack={goInfo} />;
    case "deleteAccount":
      return <ProfileDeleteAccountView onBack={goInfo} />;
    case "preferences":
      return <ProfilePreferencesView onBack={goHub} />;
    case "privacy":
      return <ProfilePrivacyView onBack={goHub} />;
    case "hub":
    default:
      return <ProfileHub onNavigate={navigate} />;
  }
}
