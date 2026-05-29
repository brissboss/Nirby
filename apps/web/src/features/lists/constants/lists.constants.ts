/** Field limits for list create/update — mirrors POST/PUT /list validation. */
export const listConstraints = {
  name: { min: 1, max: 255 },
  description: { max: 1000 },
} as const;

export const LIST_VISIBILITY_VALUES = ["PRIVATE", "SHARED", "PUBLIC"] as const;

export type ListVisibility = (typeof LIST_VISIBILITY_VALUES)[number];

export const DEFAULT_LIST_VISIBILITY: ListVisibility = "PRIVATE";
