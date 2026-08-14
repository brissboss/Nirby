import * as z from "zod";

import {
  POI_CATEGORY_VALUES,
  POI_VISIBILITY_VALUES,
  poiConstraints,
} from "../constants/pois.constants";

const poiVisibility = z.enum(POI_VISIBILITY_VALUES);
const poiCategory = z.enum(POI_CATEGORY_VALUES);

export interface CreatePoiFormMessages {
  requiredName: string;
  nameTooLong: string;
  descriptionTooLong: string;
  addressTooLong: string;
  latitudeInvalid: string;
  longitudeInvalid: string;
  requiredList: string;
}

export function createPoiFormSchema(
  messages: CreatePoiFormMessages,
  options: { requireListId?: boolean } = {}
) {
  const { name, description, address, latitude, longitude } = poiConstraints;

  return z
    .object({
      name: z
        .string()
        .trim()
        .min(name.min, { message: messages.requiredName })
        .max(name.max, { message: messages.nameTooLong }),
      latitude: z
        .number(messages.latitudeInvalid)
        .min(latitude.min, { message: messages.latitudeInvalid })
        .max(latitude.max, { message: messages.latitudeInvalid }),
      longitude: z
        .number(messages.longitudeInvalid)
        .min(longitude.min, { message: messages.longitudeInvalid })
        .max(longitude.max, { message: messages.longitudeInvalid }),
      description: z
        .string()
        .max(description.max, { message: messages.descriptionTooLong })
        .optional(),
      address: z.string().max(address.max, { message: messages.addressTooLong }).optional(),
      visibility: poiVisibility.optional(),
      category: poiCategory.optional(),
      listId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (options.requireListId && !data.listId?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["listId"],
          message: messages.requiredList,
        });
      }
    });
}

export type CreatePoiFormData = z.infer<ReturnType<typeof createPoiFormSchema>>;
