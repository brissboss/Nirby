import * as z from "zod";

import { LIST_VISIBILITY_VALUES, listConstraints } from "../constants/lists.constants";

const listVisibility = z.enum(LIST_VISIBILITY_VALUES);

export interface CreateListFormMessages {
  requiredName: string;
  nameTooLong: string;
  descriptionTooLong: string;
}

export function createListFormSchema(messages: CreateListFormMessages) {
  const { name, description } = listConstraints;

  return z.object({
    name: z
      .string()
      .trim()
      .min(name.min, { message: messages.requiredName })
      .max(name.max, { message: messages.nameTooLong }),
    description: z
      .string()
      .max(description.max, { message: messages.descriptionTooLong })
      .optional(),
    visibility: listVisibility,
  });
}

export type CreateListFormData = z.infer<ReturnType<typeof createListFormSchema>>;
