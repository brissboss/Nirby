"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { createPoiFormSchema } from "../schemas/pois.schema";

/** Zod schema for custom POI create/edit forms with localized validation messages. */
export function usePoiFormSchema(options?: { requireListId?: boolean }) {
  const tPoi = useTranslations("poi");
  const requireListId = options?.requireListId ?? false;

  return useMemo(
    () =>
      createPoiFormSchema(
        {
          requiredName: tPoi("validation.requiredName"),
          nameTooLong: tPoi("validation.nameTooLong"),
          descriptionTooLong: tPoi("validation.descriptionTooLong"),
          addressTooLong: tPoi("validation.addressTooLong"),
          latitudeInvalid: tPoi("validation.latitudeInvalid"),
          longitudeInvalid: tPoi("validation.longitudeInvalid"),
          requiredList: tPoi("validation.requiredList"),
        },
        { requireListId }
      ),
    [tPoi, requireListId]
  );
}
