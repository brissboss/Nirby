import {
  buildProfileSectionSearchParams,
  parseProfileSection,
  PROFILE_SECTION_PARAM,
} from "../constants/profile.constants";
import type { ProfileSection } from "../types/profile-section.types";

import { useUrlParamState } from "@/lib/navigation";

export function useProfileSectionUrl(
  section: ProfileSection,
  setSectionState: (section: ProfileSection) => void
) {
  const { setValueAndPush: setSection } = useUrlParamState({
    param: PROFILE_SECTION_PARAM,
    value: section,
    setValue: setSectionState,
    parse: (raw) => parseProfileSection(raw),
    buildHref: (current, next) => buildProfileSectionSearchParams(current, next),
  });
  return { setSection };
}
