import type { ReactNode } from "react";

import { ProfileSubViewHeader } from "./profile-subview-header.component";

/**
 * Props for {@link ProfileSectionLayout}.
 */
type ProfileSectionLayoutProps = {
  /** Section heading shown below the back control. */
  title: string;
  /** Optional subtitle under the title. */
  description?: string;
  /** Called when the user taps back (typically `setSection` to a parent section). */
  onBack: () => void;
  /** Section body (forms, cards, pickers, etc.). */
  children: ReactNode;
};

/**
 * Standard shell layout for profile sub-sections (info, preferences, privacy, …).
 *
 * Renders a back header plus content with consistent vertical spacing (`gap-4`, `pb-4`).
 * Use inside {@link ProfileShellView} section views instead of duplicating
 * `ProfileSubViewHeader` and wrapper markup.
 *
 * @example
 * ```tsx
 * <ProfileSectionLayout
 *   title={t("preferences.title")}
 *   description={t("preferences.description")}
 *   onBack={onBack}
 * >
 *   <Card>...</Card>
 * </ProfileSectionLayout>
 * ```
 */
export function ProfileSectionLayout({
  title,
  description,
  onBack,
  children,
}: ProfileSectionLayoutProps) {
  return (
    <div className="grid gap-4 pb-4">
      <ProfileSubViewHeader title={title} description={description} onBack={onBack} />
      {children}
    </div>
  );
}
