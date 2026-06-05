import type { CreateListFormData } from "../schemas/lists.schema";

import type { List } from "@/lib/api";

/** Maps API list fields to react-hook-form default values. */
export function listToFormValues(
  list: Pick<List, "name" | "description" | "visibility">
): CreateListFormData {
  return {
    name: list.name,
    description: list.description ?? "",
    visibility: list.visibility,
  };
}

/** Request body for POST /list and PUT /list/:listId. */
export function listFormValuesToBody(values: CreateListFormData) {
  return {
    name: values.name,
    description: values.description?.trim() || undefined,
    visibility: values.visibility,
  };
}
