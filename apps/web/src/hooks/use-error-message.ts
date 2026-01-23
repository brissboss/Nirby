import { useTranslations } from "next-intl";

import { getErrorCode } from "@/lib/api/errors";

export function useErrorMessage() {
  const t = useTranslations("errors.api");

  return (error: unknown) => {
    const code = getErrorCode(error);
    if (code && t.has(code)) {
      return t(code);
    }
    return t("INTERNAL_ERROR");
  };
}
