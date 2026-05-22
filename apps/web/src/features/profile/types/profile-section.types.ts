export type ProfileSection =
  | "hub"
  | "info"
  | "preferences"
  | "privacy"
  | "changePassword"
  | "deleteAccount";

/** Sections accessibles depuis le formulaire « Mes informations » */
export type ProfileInfoSubSection = Extract<ProfileSection, "changePassword" | "deleteAccount">;
