"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { createListFormSchema } from "../schemas/lists.schema";

/** Zod schema for list create/edit forms with localized validation messages. */
export function useListFormSchema() {
  const tLists = useTranslations("lists");

  return useMemo(
    () =>
      createListFormSchema({
        requiredName: tLists("validation.requiredName"),
        nameTooLong: tLists("validation.nameTooLong"),
        descriptionTooLong: tLists("validation.descriptionTooLong"),
      }),
    [tLists]
  );
}
