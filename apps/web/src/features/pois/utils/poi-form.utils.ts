import type { CreatePoiFormData } from "../schemas/pois.schema";

import type { CreatePoiData } from "@/lib/api";

/** Request body for `POST /poi` from the create form values. */
export function poiFormValuesToBody(values: CreatePoiFormData): CreatePoiData["body"] {
  return {
    name: values.name,
    latitude: values.latitude,
    longitude: values.longitude,
    description: values.description?.trim() || undefined,
    address: values.address?.trim() || undefined,
    visibility: values.visibility,
    category: values.category,
  };
}
